import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const core = readFileSync(new URL('../public/cms-core.js', import.meta.url), 'utf8');
const editor = readFileSync(new URL('../public/editor.js', import.meta.url), 'utf8');
function page(html) {
  const dom = new JSDOM(html, { url: 'https://example.com/about?edit=1', runScripts: 'outside-only' });
  dom.window.eval(core);
  return dom;
}
const fixture = '<header><div>Welcome <nav><a href="/about">About</a></nav></div></header><section><div class="container"><p>Welcome to Oasis. Everyone belongs!</p><p>Second paragraph.</p><button>Question?<svg><path /></svg></button><div hidden>Hidden answer.</div><label>Name<input placeholder="Your name"></label><select><option value="">Select a reason</option><option value="prayer">Prayer Request</option></select></div></section>';
describe('visual content round trips', () => {
  it('edits paragraphs independently without selecting layout containers', () => {
    const dom = page(fixture), { document, OASIS } = dom.window;
    const p = document.querySelector('p');
    expect(OASIS.collect().texts).toContain(p);
    expect(OASIS.collect().texts).not.toContain(document.querySelector('.container'));
    const edits = { text: { [OASIS.keyFor(p)]: 'Hello, Oasis — welcome.' } };
    const fresh = page(fixture);
    fresh.window.OASIS.applyEdits(edits);
    expect(fresh.window.document.querySelector('p').textContent).toBe('Hello, Oasis — welcome.');
    expect(fresh.window.document.querySelectorAll('p')).toHaveLength(2);
    dom.window.close(); fresh.window.close();
  });
  it('round trips mixed text, punctuation, hidden copy, placeholders and options without replacing controls', () => {
    const dom = page(fixture), { OASIS, document } = dom.window;
    const select = document.querySelector('select');
    const targets = OASIS.copyTargets();
    const edits = { copy: Object.fromEntries(targets.map(t => [t.key, t.get() + ', edited.'])) };
    OASIS.applyEdits(edits);
    expect(document.querySelector('select')).toBe(select);
    expect(select.options[1].value).toBe('prayer');
    const fresh = page(fixture); fresh.window.OASIS.applyEdits(edits);
    expect(fresh.window.document.querySelector('input').placeholder).toBe('Your name, edited.');
    expect(fresh.window.document.querySelector('[hidden]').textContent).toBe('Hidden answer., edited.');
    expect(fresh.window.document.querySelector('header div').firstChild.nodeValue).toBe('Welcome , edited.');
    dom.window.close(); fresh.window.close();
  });
  it('restores added blocks and their edits into ordinary container divs, only once', () => {
    const dom = page(fixture), { OASIS, document } = dom.window;
    const host = document.querySelector('.container');
    const edits = { added: { [OASIS.keyFor(host)]: [{ id: 'add-1', type: 'text' }] }, text: { 'add-1': 'Added, saved!' } };
    OASIS.applyEdits(edits); OASIS.applyEdits(edits);
    expect(document.querySelectorAll('[data-cms="add-1"]')).toHaveLength(1);
    expect(document.querySelector('[data-cms="add-1"]').textContent).toBe('Added, saved!');
    dom.window.close();
  });
  it('excludes editor UI and keeps keys stable after adding chrome', () => {
    const dom = page('<div><p>Hello</p></div>'), { OASIS, document } = dom.window;
    const key = OASIS.keyFor(document.querySelector('p'));
    document.body.insertAdjacentHTML('beforeend', '<div id="cms-bar">Publish</div>');
    expect(OASIS.keyFor(document.querySelector('p'))).toBe(key);
    expect(OASIS.copyTargets().map(t => t.get())).toEqual(['Hello']);
    dom.window.close();
  });
});
async function boot(dom, sb) {
  dom.window.OASIS_SUPABASE = sb;
  dom.window.eval(editor);
  await new Promise(r => setTimeout(r, 500));
}
describe('editor persistence', () => {
  it('recovers a draft and saves unsigned edits to the same draft key', async () => {
    const dom = page(fixture), { document, OASIS, localStorage } = dom.window;
    const key = OASIS.keyFor(document.querySelector('p'));
    localStorage.setItem('oasis_draft:about', JSON.stringify({ text: { [key]: 'Recovered draft.' } }));
    await boot(dom);
    expect(document.querySelector('p').textContent).toBe('Recovered draft.');
    expect(document.querySelector('#cms-stmsg').textContent).toBe('Recovered unpublished draft');
    document.querySelector('#cms-all-text').click();
    const field = [...document.querySelectorAll('#cms-text-panel textarea')].find(x => x.value === 'Recovered draft.');
    field.value = 'Every comma, every period.'; field.dispatchEvent(new dom.window.Event('input'));
    document.querySelector('#cms-pub').click();
    await new Promise(r => setTimeout(r, 10));
    const edits = JSON.parse(localStorage.getItem('oasis_draft:about'));
    const fresh = page(fixture); fresh.window.OASIS.applyEdits(edits);
    expect(fresh.window.document.querySelector('p').textContent).toBe('Every comma, every period.');
    dom.window.close(); fresh.window.close();
  });
  it('blocks publishing on load failure instead of overwriting saved content', async () => {
    const dom = page(fixture);
    const sb = { auth: { getSession: async () => ({ data: { session: null } }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ error: new Error('Offline') }) }) }) }) };
    await boot(dom, sb);
    expect(dom.window.document.querySelector('#cms-pub').disabled).toBe(true);
    expect(dom.window.document.querySelector('#cms-stmsg').textContent).toContain('Could not load');
    dom.window.close();
  });
});

describe('publishing and dynamic records', () => {
  it('keeps edits on the same record after filtering changes its position', () => {
    const dom = page('<div><article data-cms-scope="event-a"><p>First</p></article><article data-cms-scope="event-b"><p>Second</p></article></div>');
    const key = dom.window.OASIS.keyFor(dom.window.document.querySelectorAll('p')[1]);
    const fresh = page('<div><article data-cms-scope="event-b"><p>Second</p></article></div>');
    fresh.window.OASIS.applyEdits({ text: { [key]: 'Second, edited.' } });
    expect(fresh.window.document.querySelector('p').textContent).toBe('Second, edited.');
    dom.window.close(); fresh.window.close();
  });
  it('publishes a snapshot and retains edits made while the request is pending', async () => {
    const dom = page(fixture), { document, localStorage } = dom.window;
    let complete, payload;
    const sb = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'staff' } } } }) },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { edits: {} } }) }) }),
        upsert: value => { payload = value; return new Promise(resolve => { complete = resolve; }); },
      }),
    };
    await boot(dom, sb);
    document.querySelector('#cms-all-text').click();
    const field = document.querySelector('#cms-text-panel textarea');
    field.value = 'First edit'; field.dispatchEvent(new dom.window.Event('input'));
    document.querySelector('#cms-pub').click();
    await new Promise(r => setTimeout(r, 10));
    field.value = 'Second edit'; field.dispatchEvent(new dom.window.Event('input'));
    expect(Object.values(payload.edits.copy)).toContain('First edit');
    complete({ error: null });
    await new Promise(r => setTimeout(r, 10));
    expect(document.querySelector('#cms-stmsg').textContent).toContain('still need publishing');
    expect(localStorage.getItem('oasis_draft:about')).toContain('Second edit');
    dom.window.close();
  });
});
