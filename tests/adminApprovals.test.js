import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { describeChange } from '../lib/changeRequests';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const views = read('../public/admin/views.js'), actions = read('../public/admin/actions.js'), dbjs = read('../public/admin/db.js');

const request = (o) => ({
  id: 'aaaaaaaa-0000-0000-0000-000000000001', created_at: '2026-10-03T15:00:00Z', requested_by: 'u-vic', requested_by_name: 'Vic Volunteer',
  table_name: 'page_overrides', pk_value: 'about', op: 'UPDATE', old_data: { edits: {} },
  new_data: { edits: { text: { k: '<b>New words</b>' }, sig: { k: 'Welcome' } } }, status: 'pending', notified_at: '2026-10-03T15:00:05Z', ...o,
});
const revision = (o) => ({
  id: 1, changed_at: '2026-10-03T15:00:00Z', changed_by_name: 'Vic Volunteer', table_name: 'events', pk_value: 'e1', op: 'UPDATE',
  old_data: { title: 'Picnic' }, new_data: { title: 'Party' }, source: null, approved_by: null, reverted_at: null, reverted_by_name: null, ...o,
});

function admin({ rows = [], rpc = vi.fn().mockResolvedValue({ data: { ok: true }, error: null }), isAdmin = true, me = 'u-admin', listError = null, gated = false } = {}) {
  const dom = new JSDOM('<div id="confirm-msg"></div><div id="confirm-modal"></div><span id="approvals-badge"></span>', { url: 'https://example.com/admin', runScripts: 'outside-only' });
  const w = dom.window;
  w.OasisChanges = { describe: describeChange };
  w.DB = {
    canManageUsers: () => isAdmin, me: { id: me }, audit: vi.fn(), gated,
    list: vi.fn(async () => { if (listError) throw listError; return rows; }),
    saveFormSettings: vi.fn(async () => {}),
    client: { rpc, from: () => ({ select: () => ({ eq: async () => ({ count: 3, error: null }) }) }) },
  };
  w.toast = vi.fn(); w.go = vi.fn();
  w.eval(views); w.eval(actions);
  return { w, rpc };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('Approvals screen', () => {
  it('shows an admin what is waiting, before → after, with Approve and Reject', async () => {
    const { w } = admin({ rows: [request(), request({ id: 'aaaaaaaa-0000-0000-0000-000000000002', table_name: 'site_settings', pk_value: '1', old_data: { donate_url: 'https://good.example' }, new_data: { donate_url: 'https://bad.example' }, notified_at: null })] });
    const html = await w.VIEWS.approvals();
    expect(html).toContain('Waiting for approval (2)');
    expect(html).toContain('Welcome');
    expect(html).toContain('New words');
    expect(html).not.toContain('<b>New words</b>');
    expect(html).toContain('Look closely');
    expect(html).toContain('approvers not emailed yet');
    expect(html).toContain("approveRequest('aaaaaaaa-0000-0000-0000-000000000001')");
    expect(html).toContain("rejectRequest('aaaaaaaa-0000-0000-0000-000000000001')");
    expect(html).not.toContain('withdrawRequest');
  });
  it('shows an editor only withdraw on their own requests, and the outcome + note of past ones', async () => {
    const { w } = admin({ isAdmin: false, me: 'u-vic', rows: [request(), request({ id: 'aaaaaaaa-0000-0000-0000-000000000003', status: 'rejected', decided_by: 'pastor@x.org', decision_note: 'Fix the date', decided_at: '2026-10-03T16:00:00Z' })] });
    const html = await w.VIEWS.approvals();
    expect(html).toContain('Your changes waiting for approval (1)');
    expect(html).toContain("withdrawRequest('aaaaaaaa-0000-0000-0000-000000000001')");
    expect(html).not.toContain('approveRequest(');
    expect(html).toContain('Rejected');
    expect(html).toContain('Note: Fix the date');
  });
  it('escapes editor-controlled text', async () => {
    const { w } = admin({ rows: [request({ requested_by_name: '<img src=x onerror=alert(1)>', new_data: { edits: { text: { k: '<script>alert(1)</script>x' } } } })] });
    const html = await w.VIEWS.approvals();
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>');
  });
  it('points to the right (non-destructive) SQL file when the tables are missing', async () => {
    const html = await admin({ listError: new Error('relation "change_requests" does not exist') }).w.VIEWS.approvals();
    expect(html).toContain('migrations-2026-10-change-approval.sql');
    expect(html).not.toContain('supabase-setup.sql');
  });
});

describe('Approval actions', () => {
  it('approves through the database function and refreshes', async () => {
    const { w, rpc } = admin();
    await w.approveRequest('aaaaaaaa-0000-0000-0000-000000000001');
    expect(rpc).toHaveBeenCalledWith('approve_change_request', { p_id: 'aaaaaaaa-0000-0000-0000-000000000001', p_force: false });
    expect(w.go).toHaveBeenCalledWith('approvals');
    await tick();
    expect(w.document.getElementById('approvals-badge').textContent).toBe('3');
  });
  it('asks before replacing newer edits, then forces', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'row_changed_since' } }).mockResolvedValue({ data: { ok: true }, error: null });
    const { w } = admin({ rpc });
    await w.approveRequest('aaaaaaaa-0000-0000-0000-000000000001');
    expect(w.document.getElementById('confirm-modal').classList.contains('open')).toBe(true);
    w.runConfirm(); await tick();
    expect(rpc).toHaveBeenLastCalledWith('approve_change_request', { p_id: 'aaaaaaaa-0000-0000-0000-000000000001', p_force: true });
  });
  it('sends the reject note', async () => {
    const { w, rpc } = admin();
    w.document.body.insertAdjacentHTML('beforeend', '<input id="rq-note-r9" value=" Not this week ">');
    await w.rejectRequest('r9');
    expect(rpc).toHaveBeenCalledWith('reject_change_request', { p_id: 'r9', p_note: 'Not this week' });
  });
  it('will not switch approval on without an approver email', async () => {
    const { w } = admin();
    w.document.body.insertAdjacentHTML('beforeend', '<input type="checkbox" id="approval-required" checked><textarea id="approval-recipients"></textarea>');
    await w.saveApprovalSettings();
    expect(w.DB.saveFormSettings).not.toHaveBeenCalled();
    w.document.getElementById('approval-recipients').value = 'pastor@x.org';
    await w.saveApprovalSettings();
    expect(w.DB.saveFormSettings).toHaveBeenCalledWith({ require_change_approval: true, change_alert_recipients: 'pastor@x.org' });
  });
});

describe('Change History screen', () => {
  it('lists what went live with who approved it, and offers Undo only where it makes sense', async () => {
    const { w } = admin({ rows: [
      revision({ id: 4, source: 'request:abc', approved_by: 'pastor@x.org' }),
      revision({ id: 5, reverted_at: '2026-10-03T16:00:00Z', reverted_by_name: 'Alice' }),
      revision({ id: 6, source: 'restore:5' }),
      revision({ id: 7, table_name: 'profiles', old_data: { role: 'editor' }, new_data: { role: 'admin' } }),
    ] });
    const html = await w.VIEWS.history();
    expect(html).toContain('approved by pastor@x.org');
    expect(html).toContain('undoChange(4)');
    expect(html).toContain('Undone by Alice');
    expect(html).toContain('Undo of #5');
    ['undoChange(5)', 'undoChange(6)', 'undoChange(7)'].forEach((x) => expect(html).not.toContain(x));
  });
  it('is admin-only', async () => {
    expect(await admin({ isAdmin: false }).w.VIEWS.history()).toContain('Only administrators');
  });
  it('undoes via the database function, asking first if a later change would be lost', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'row_changed_since' } }).mockResolvedValue({ data: { ok: true }, error: null });
    const { w } = admin({ rpc });
    await w.undoChange(42);
    expect(rpc).toHaveBeenCalledWith('restore_content_revision', { p_id: 42, p_force: false });
    w.runConfirm(); await tick();
    expect(rpc).toHaveBeenLastCalledWith('restore_content_revision', { p_id: 42, p_force: true });
  });
});

// The real data layer, with a stubbed Supabase client: does it notice a held write?
describe('Admin data layer when a write is held for approval', () => {
  function layer({ needApproval, returned }) {
    const dom = new JSDOM('', { url: 'https://example.com/admin', runScripts: 'outside-only' });
    const w = dom.window;
    const chain = { update: () => chain, insert: () => chain, delete: () => chain, eq: () => chain, single: async () => ({ data: { id: 'u1', role: 'editor', active: true, full_name: 'Vic' } }),
      select: () => chain, then: (res) => Promise.resolve({ data: returned, error: null }).then(res) };
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'v@x.org' }, access_token: 'jwt' } } }) },
      from: () => chain, rpc: vi.fn(async () => ({ data: needApproval, error: null })),
    };
    w.OASIS_CONFIG = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'k' };
    w.supabase = { createClient: () => client };
    w.fetch = vi.fn(async () => ({ json: async () => ({ ok: true }) }));
    w.toast = vi.fn();
    w.eval(dbjs);
    return w;
  }
  it('tells the editor it was sent for approval and asks the server to email approvers (once)', async () => {
    vi.useFakeTimers();
    const w = layer({ needApproval: true, returned: [] });
    await w.DB.loadProfile();
    expect(w.DB.gated).toBe(true);
    await w.DB.save('events', { id: 'e1', title: 'x' }, 'event.update', 'x');
    await w.DB.del('events', 'e1');
    await vi.advanceTimersByTimeAsync(2000);
    expect(w.toast).toHaveBeenCalledWith(expect.stringContaining('Sent for approval'));
    expect(w.fetch).toHaveBeenCalledTimes(1);
    expect(w.fetch).toHaveBeenCalledWith('/api/change-requests/notify', { method: 'POST', headers: { Authorization: 'Bearer jwt' } });
    vi.useRealTimers();
  });
  it('stays quiet for a normal save (approval off, or the row was written)', async () => {
    vi.useFakeTimers();
    const off = layer({ needApproval: false, returned: [] });
    await off.DB.loadProfile(); await off.DB.save('events', { id: 'e1' });
    const written = layer({ needApproval: true, returned: [{ id: 'e1' }] });   // e.g. a reorder, which is not held
    await written.DB.loadProfile(); await written.DB.save('events', { id: 'e1', sort_order: 2 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(off.fetch).not.toHaveBeenCalled(); expect(off.toast).not.toHaveBeenCalled();
    expect(written.fetch).not.toHaveBeenCalled(); expect(written.toast).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
