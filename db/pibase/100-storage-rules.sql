-- ============================================================
-- PIBASE: media upload rules (replaces the storage.objects policies that
-- Supabase uses — PIBASE projects can't add policies to storage tables).
--
-- PIBASE calls public.storage_write_allowed(bucket, name) for every signed-in
-- upload, overwrite and delete. Same rules as the Supabase policies:
--   * Owner/Admin: any write.
--   * Editor: may upload NEW files. Overwriting or deleting an existing file
--     changes the live site with no row for the approval gate to hold, so while
--     change approval is on only Owner/Admin may do that.
-- Run after db/migrations-2026-10-change-approval.sql. Safe to re-run.
-- ============================================================
create or replace function public.storage_write_allowed(bucket_id text, name text)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_role text := my_role();
  v_exists boolean;
  v_gated boolean := false;
begin
  if v_role in ('owner', 'admin') then return true; end if;
  if v_role is distinct from 'editor' then return false; end if;
  begin
    v_gated := change_approval_enabled();
  exception when undefined_function then
    v_gated := false;
  end;
  if not v_gated then return true; end if;
  select exists (select 1 from storage.objects o where o.bucket_id = storage_write_allowed.bucket_id and o.name = storage_write_allowed.name)
    into v_exists;
  return not v_exists;
end $$;
revoke all on function public.storage_write_allowed(text, text) from public;
grant execute on function public.storage_write_allowed(text, text) to authenticated;
