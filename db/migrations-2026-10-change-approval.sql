-- ============================================================
-- Oasis CMS — Change approval + history + undo
--
-- Run ONCE in the Supabase SQL Editor. It only ADDS objects; it never drops
-- or edits your content, and it is safe to re-run.
-- (Do NOT run supabase-setup.sql on a live project — it drops tables.)
--
-- Nothing changes for editors until an Owner/Admin switches approval on in
-- Admin → Settings ("Require approval for editor changes"). So: deploy the
-- website code first, then turn it on.
--
-- What this adds
--   1. Approval gate     When approval is on, a change made by an `editor` or
--                        `events_only` user (Visual Editor or Admin panel) is
--                        NOT applied. The database stores it as a pending
--                        row in change_requests instead. It is enforced by the
--                        database, so it cannot be bypassed from a browser.
--   2. Approve / reject  Owner/Admin in Admin → Approvals, or any approver via
--                        the personal link in the notification email.
--   3. History + undo    content_revisions keeps who / when / before / after
--                        for every change that does go live; Owner/Admin can
--                        undo one from Admin → Change History.
-- ============================================================

-- ---------- settings (admin-only table, same place as form recipients) ----------
alter table form_settings
  add column if not exists change_alert_recipients text not null default '';
alter table form_settings
  add column if not exists require_change_approval boolean not null default false;

-- ---------- which tables are covered ----------
-- History is kept for all of these. To cover a new table, add its name here
-- and re-run this file.
create or replace function content_revision_tables() returns text[]
language sql immutable as $$
  select array[
    'page_overrides',            -- Visual Editor (every "Publish")
    'pages', 'page_blocks',
    'site_settings', 'form_settings', 'nav_items',
    'events', 'sermons', 'team_members', 'team_sections',
    'ministries', 'ministry_posts',
    'about_hub_cards', 'beliefs', 'core_values', 'faqs',
    'profiles'                   -- recorded for the audit trail, never restorable
  ]
$$;

-- Tables whose changes can be held for approval. form_settings and profiles
-- are excluded: only Owner/Admin can write them at all.
create or replace function content_approval_tables() returns text[]
language sql immutable as $$
  select array(
    select t from unnest(content_revision_tables()) t
     where t not in ('form_settings', 'profiles'))
$$;

create or replace function content_pk_column(p_table text) returns text
language sql immutable as $$
  select case when p_table = 'page_overrides' then 'slug' else 'id' end
$$;

-- ============================================================
-- HISTORY
-- ============================================================
create table if not exists content_revisions (
  id               bigint generated always as identity primary key,
  changed_at       timestamptz not null default now(),
  -- Deliberately NOT a foreign key: history must survive deleting a user.
  changed_by       uuid,
  changed_by_name  text,
  table_name       text not null,
  pk_value         text not null,
  op               text not null check (op in ('INSERT','UPDATE','DELETE')),
  old_data         jsonb,
  new_data         jsonb,
  source           text,               -- null = direct edit · 'request:<uuid>' · 'restore:<id>'
  approved_by      text,               -- who approved it, when it came from a request
  reverted_at      timestamptz,
  reverted_by_name text
);
create index if not exists content_revisions_changed_at_idx on content_revisions (changed_at desc);
create index if not exists content_revisions_row_idx        on content_revisions (table_name, pk_value, id desc);

alter table content_revisions enable row level security;
-- Owner/Admin may READ. There is intentionally no insert/update/delete policy:
-- rows are written only by the trigger and the functions below.
drop policy if exists "admins read revisions" on content_revisions;
create policy "admins read revisions" on content_revisions
  for select using (my_role() in ('owner','admin'));
revoke all on content_revisions from anon, authenticated;
grant select on content_revisions to authenticated;

-- ============================================================
-- APPROVAL REQUESTS
-- ============================================================
create table if not exists change_requests (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  requested_by       uuid not null,
  requested_by_name  text,
  requested_by_email text,
  table_name         text not null,
  pk_value           text not null,
  op                 text not null check (op in ('INSERT','UPDATE','DELETE')),
  old_data           jsonb,              -- the live row when the request was made
  new_data           jsonb,              -- what the editor wants it to become
  status             text not null default 'pending'
                       check (status in ('pending','approved','rejected','withdrawn','superseded')),
  notified_at        timestamptz,        -- set once approvers were emailed
  decided_at         timestamptz,
  decided_by         text,               -- admin name, or the approver's email address
  decision_note      text
);
create index if not exists change_requests_status_idx on change_requests (status, created_at desc);
create index if not exists change_requests_user_idx   on change_requests (requested_by, created_at desc);
create index if not exists change_requests_row_idx    on change_requests (table_name, pk_value) where status = 'pending';

alter table change_requests enable row level security;
-- Owner/Admin see everything; an editor sees only their own requests.
-- No direct writes: rows come from the gate trigger and the functions below.
drop policy if exists "read change requests" on change_requests;
create policy "read change requests" on change_requests
  for select using (my_role() in ('owner','admin') or requested_by = auth.uid());
revoke all on change_requests from anon, authenticated;
grant select on change_requests to authenticated;

-- One secret link per (request, approver). Kept in its own table with NO
-- policies, so no browser session — including the editor who made the
-- request — can ever read a link. Only the website server (service role) can.
create table if not exists change_request_tokens (
  token       text primary key,
  request_id  uuid not null references change_requests(id) on delete cascade,
  recipient   text not null,
  created_at  timestamptz not null default now()
);
create index if not exists change_request_tokens_request_idx on change_request_tokens (request_id);
alter table change_request_tokens enable row level security;
revoke all on change_request_tokens from anon, authenticated;

-- ---------- helpers ----------
create or replace function change_approval_enabled() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select require_change_approval from form_settings where id = 1), false)
$$;

-- The website asks this to know whether to say "Published" or "Sent for approval".
create or replace function changes_need_approval() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select change_approval_enabled() and coalesce(my_role(), '') in ('editor','events_only')
$$;

create or replace function content_actor_name(p_uid uuid) returns text
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v text;
begin
  if p_uid is null then return 'system'; end if;
  begin select nullif(full_name, '') into v from profiles where id = p_uid; exception when others then v := null; end;
  if v is null then
    begin select email into v from auth.users where id = p_uid; exception when others then v := null; end;
  end if;
  return coalesce(v, p_uid::text);
end $$;

-- ============================================================
-- THE GATE  (BEFORE trigger: holds an editor's change for approval)
-- ============================================================
create or replace function gate_content_change() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_role   text := my_role();
  v_uid    uuid := auth.uid();
  v_pk_col text := content_pk_column(tg_table_name);
  v_old    jsonb;
  v_new    jsonb;
  v_op     text := tg_op;
  v_pk     text;
  v_email  text;
  v_merged jsonb;
begin
  -- Owner/Admin, the website server, and SQL-editor changes pass straight through.
  -- So does a change that is being applied by an approval or an undo (those
  -- functions do their own permission checks and set this marker; a browser
  -- cannot set it).
  if v_role is null or v_role not in ('editor','events_only') or not change_approval_enabled()
     or coalesce(current_setting('app.revision_source', true), '') <> '' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  -- Leave tables this role may not write to the normal permission rules (they reject it).
  if v_role = 'events_only' and tg_table_name <> 'events' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  v_pk := coalesce(v_new, v_old) ->> v_pk_col;

  -- An "insert" of something that already exists is really an edit
  -- (the Visual Editor always saves a page with an upsert).
  if tg_op = 'INSERT' then
    execute format('select to_jsonb(t) from public.%I t where t.%I::text = $1', tg_table_name, v_pk_col)
      into v_old using v_pk;
    if v_old is not null then v_op := 'UPDATE'; end if;
  end if;

  if v_op = 'UPDATE' then
    -- Nothing actually changed, or only the display order / bookkeeping columns
    -- changed: no approval needed.
    if (v_old - 'sort_order' - 'updated_at' - 'updated_by') = (v_new - 'sort_order' - 'updated_at' - 'updated_by') then
      if tg_op = 'INSERT' then return null; end if;   -- identical re-save of an existing row
      return new;
    end if;
  end if;

  -- scripts/smoke-publish.mjs writes throwaway rows under "__smoke/".
  if tg_table_name = 'page_overrides' and v_pk like '\_\_smoke/%' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  begin select email into v_email from auth.users where id = v_uid; exception when others then v_email := null; end;

  -- A second edit to an item this person already has waiting builds on their
  -- waiting version (the Admin forms always start from the live values, so
  -- without this a second save would silently drop their first change).
  if v_op = 'UPDATE' then
    select p.new_data || coalesce((select jsonb_object_agg(k, v_new -> k) from jsonb_object_keys(v_new) k
                                    where (v_new -> k) is distinct from (v_old -> k)), '{}'::jsonb)
      into v_merged
      from change_requests p
     where p.status = 'pending' and p.requested_by = v_uid and p.op = 'UPDATE'
       and p.table_name = tg_table_name and p.pk_value = v_pk
     order by p.created_at desc limit 1;
    if v_merged is not null then v_new := v_merged; end if;
  end if;

  -- A newer request from the same person for the same item replaces their older one.
  update change_requests
     set status = 'superseded', decided_at = now(), decided_by = 'replaced by a newer request'
   where status = 'pending' and requested_by = v_uid
     and table_name = tg_table_name and pk_value = v_pk;

  insert into change_requests
    (requested_by, requested_by_name, requested_by_email, table_name, pk_value, op, old_data, new_data)
  values
    (v_uid, content_actor_name(v_uid), v_email, tg_table_name, v_pk, v_op, v_old, v_new);

  return null;   -- hold the change: the live row is left untouched
end $$;
revoke all on function gate_content_change() from public, anon, authenticated;

-- ============================================================
-- HISTORY TRIGGER  (AFTER: records everything that really went live)
-- ============================================================
create or replace function record_content_revision() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old  jsonb;
  v_new  jsonb;
  v_pk   text;
  v_uid  uuid := auth.uid();
  v_src  text := nullif(current_setting('app.revision_source', true), '');
  v_req  uuid;
  v_by   text;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  if tg_op = 'UPDATE' and v_old = v_new then return null; end if;

  v_pk := coalesce(v_new, v_old) ->> content_pk_column(tg_table_name);
  if tg_table_name = 'page_overrides' and v_pk like '\_\_smoke/%' then return null; end if;

  -- An approved request is credited to the person who asked for it.
  if v_src like 'request:%' then
    begin
      v_req := substr(v_src, 9)::uuid;
      select requested_by, decided_by into v_uid, v_by from change_requests where id = v_req;
      v_by := coalesce(nullif(current_setting('app.revision_approver', true), ''), v_by);
    exception when others then v_req := null;
    end;
  end if;

  insert into content_revisions (changed_by, changed_by_name, table_name, pk_value, op, old_data, new_data, source, approved_by)
  values (v_uid, content_actor_name(v_uid), tg_table_name, v_pk, tg_op, v_old, v_new, v_src, v_by);
  return null;
end $$;
revoke all on function record_content_revision() from public, anon, authenticated;

-- ============================================================
-- APPLYING A STORED CHANGE  (shared by approve + undo)
-- ============================================================
-- Brings one row to a target state. Only the columns that differ between
-- p_from and p_to are written, so unrelated edits made in the meantime survive.
-- Raises (message text is matched by the website):
--   row_changed_since   one of those columns was edited by someone else meanwhile
--   row_already_exists  asked to create an item that exists
--   row_missing         asked to edit an item that has since been deleted
create or replace function apply_content_state(
  p_table text, p_pk text, p_op text, p_from jsonb, p_to jsonb, p_force boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pk_col text := content_pk_column(p_table);
  v_cur    jsonb;
  v_cols   text;
  v_set    text;
  v_clash  boolean;
begin
  if not (p_table = any (content_revision_tables())) or p_table = 'profiles' then
    raise exception 'not_restorable';
  end if;

  execute format('select to_jsonb(t) from public.%I t where t.%I::text = $1', p_table, v_pk_col)
    into v_cur using p_pk;

  if p_op = 'DELETE' then
    if v_cur is null then return; end if;                         -- already gone
    if not p_force and (v_cur - 'sort_order') is distinct from (p_from - 'sort_order') then
      raise exception 'row_changed_since';
    end if;
    execute format('delete from public.%I where %I::text = $1', p_table, v_pk_col) using p_pk;
    return;
  end if;

  if p_op = 'INSERT' or (p_op = 'UPDATE' and v_cur is null and p_force) then
    if v_cur is not null then
      if not p_force then raise exception 'row_already_exists'; end if;
      p_from := v_cur;                                            -- forced: overwrite what is there
    else
      select string_agg(format('%I', a.attname), ', ' order by a.attnum) into v_cols
        from pg_attribute a
       where a.attrelid = format('public.%I', p_table)::regclass
         and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
         and p_to ? a.attname;
      execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)',
                     p_table, v_cols, v_cols, p_table) using p_to;
      return;
    end if;
  end if;

  -- UPDATE (or a forced insert over an existing row)
  if v_cur is null then raise exception 'row_missing'; end if;

  select string_agg(format('%I = s.%I', a.attname, a.attname), ', ' order by a.attnum),
         bool_or((v_cur -> a.attname) is distinct from (p_from -> a.attname)
                 and a.attname not in ('updated_at','updated_by'))
    into v_set, v_clash
    from pg_attribute a
   where a.attrelid = format('public.%I', p_table)::regclass
     and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
     and a.attname <> v_pk_col and p_to ? a.attname
     and (p_to -> a.attname) is distinct from (coalesce(p_from, '{}'::jsonb) -> a.attname);

  if v_set is null then return; end if;                           -- nothing to change
  if v_clash and not p_force then raise exception 'row_changed_since'; end if;

  execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I, $1) s where t.%I::text = $2',
                 p_table, v_set, p_table, v_pk_col) using p_to, p_pk;
end $$;
revoke all on function apply_content_state(text, text, text, jsonb, jsonb, boolean) from public, anon, authenticated;

-- ============================================================
-- APPROVE / REJECT / WITHDRAW
-- ============================================================
-- Internal: no permission check. Callable only by the website server (service
-- role) for email-link approvals, and by the admin wrappers below.
create or replace function decide_change_request_internal(
  p_id uuid, p_decision text, p_by text, p_note text default null, p_force boolean default false)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r change_requests%rowtype;
begin
  if p_decision not in ('approved','rejected','withdrawn') then raise exception 'bad_decision'; end if;

  select * into r from change_requests where id = p_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if r.status <> 'pending' then raise exception 'not_pending'; end if;

  if p_decision = 'approved' then
    perform set_config('app.revision_source', 'request:' || p_id, true);
    perform set_config('app.revision_approver', coalesce(p_by, ''), true);
    perform apply_content_state(r.table_name, r.pk_value, r.op, r.old_data, r.new_data, p_force);
    perform set_config('app.revision_source', '', true);
    perform set_config('app.revision_approver', '', true);
  end if;

  update change_requests
     set status = p_decision, decided_at = now(), decided_by = p_by,
         decision_note = nullif(left(coalesce(p_note, ''), 500), '')
   where id = p_id;
  delete from change_request_tokens where request_id = p_id;      -- links stop working

  return jsonb_build_object('ok', true, 'status', p_decision, 'table', r.table_name, 'pk', r.pk_value);
end $$;
revoke all on function decide_change_request_internal(uuid, text, text, text, boolean) from public, anon, authenticated;
grant execute on function decide_change_request_internal(uuid, text, text, text, boolean) to service_role;

create or replace function approve_change_request(p_id uuid, p_force boolean default false) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce(my_role(), '') not in ('owner','admin') then raise exception 'not_allowed' using errcode = '42501'; end if;
  return decide_change_request_internal(p_id, 'approved', content_actor_name(auth.uid()), null, p_force);
end $$;

create or replace function reject_change_request(p_id uuid, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce(my_role(), '') not in ('owner','admin') then raise exception 'not_allowed' using errcode = '42501'; end if;
  return decide_change_request_internal(p_id, 'rejected', content_actor_name(auth.uid()), p_note, false);
end $$;

-- An editor may cancel their own pending request.
create or replace function withdraw_change_request(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from change_requests where id = p_id and requested_by = auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return decide_change_request_internal(p_id, 'withdrawn', content_actor_name(auth.uid()), null, false);
end $$;

revoke all on function approve_change_request(uuid, boolean) from public, anon;
revoke all on function reject_change_request(uuid, text)     from public, anon;
revoke all on function withdraw_change_request(uuid)         from public, anon;
grant execute on function approve_change_request(uuid, boolean) to authenticated;
grant execute on function reject_change_request(uuid, text)     to authenticated;
grant execute on function withdraw_change_request(uuid)         to authenticated;
revoke all on function changes_need_approval()                  from public, anon;
grant execute on function changes_need_approval()               to authenticated;
revoke all on function change_approval_enabled()                from public, anon;
grant execute on function change_approval_enabled()             to authenticated;   -- used by the storage policies below
-- Internal helper: not callable from a browser.
revoke all on function content_actor_name(uuid)                 from public, anon, authenticated;

-- ============================================================
-- MEDIA FILES
-- Replacing or deleting an image changes the live site instantly, with no row
-- for the gate to hold. So while approval is on, editors may still UPLOAD new
-- files (a new file is not shown anywhere until an approved change points to
-- it) but only Owner/Admin may overwrite or delete existing ones.
-- ============================================================
do $$
begin
  drop policy if exists "staff update media" on storage.objects;
  create policy "staff update media" on storage.objects for update
    using (bucket_id = 'media' and (my_role() in ('owner','admin') or (my_role() = 'editor' and not change_approval_enabled())));
  drop policy if exists "staff delete media" on storage.objects;
  create policy "staff delete media" on storage.objects for delete
    using (bucket_id = 'media' and (my_role() in ('owner','admin') or (my_role() = 'editor' and not change_approval_enabled())));
exception when others then
  raise warning 'Could not update the media storage policies (%). Editors can still replace/delete media files without approval — update the two policies on storage.objects by hand.', sqlerrm;
end $$;

-- ============================================================
-- UNDO a change that already went live (Owner/Admin)
-- ============================================================
create or replace function restore_content_revision(p_id bigint, p_force boolean default false) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r     content_revisions%rowtype;
  v_op  text;
begin
  if coalesce(my_role(), '') not in ('owner','admin') then raise exception 'not_allowed' using errcode = '42501'; end if;

  select * into r from content_revisions where id = p_id for update;
  if not found then raise exception 'revision_not_found'; end if;
  if r.table_name = 'profiles' then raise exception 'not_restorable'; end if;
  if r.reverted_at is not null then raise exception 'already_reverted'; end if;

  -- The opposite operation: undo a creation = delete, undo a deletion = re-create.
  v_op := case r.op when 'INSERT' then 'DELETE' when 'DELETE' then 'INSERT' else 'UPDATE' end;

  perform set_config('app.revision_source', 'restore:' || p_id, true);
  perform apply_content_state(r.table_name, r.pk_value, v_op, r.new_data, r.old_data, p_force);
  perform set_config('app.revision_source', '', true);

  update content_revisions set reverted_at = now(), reverted_by_name = content_actor_name(auth.uid()) where id = p_id;
  return jsonb_build_object('ok', true, 'table', r.table_name, 'op', r.op);
end $$;
revoke all on function restore_content_revision(bigint, boolean) from public, anon;
grant execute on function restore_content_revision(bigint, boolean) to authenticated;

-- ============================================================
-- ATTACH THE TRIGGERS to every covered table that exists
-- ("aa_" / "zz_" prefixes: Postgres fires same-kind triggers in name order.)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array content_revision_tables() loop
    if to_regclass('public.' || t) is null then continue; end if;

    execute format('drop trigger if exists zz_record_revision on public.%I', t);
    execute format('create trigger zz_record_revision after insert or update or delete on public.%I
                      for each row execute function record_content_revision()', t);

    execute format('drop trigger if exists aa_gate_change on public.%I', t);
    if t = any (content_approval_tables()) then
      execute format('create trigger aa_gate_change before insert or update or delete on public.%I
                        for each row execute function gate_content_change()', t);
    end if;
  end loop;
end $$;
