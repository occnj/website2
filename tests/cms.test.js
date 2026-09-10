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

describe('orphan recovery across redesigns', () => {
  it('heals a text edit onto a moved/re-nested element via its saved signature', () => {
    const dom = page(fixture), { OASIS, document } = dom.window;
    const p = document.querySelectorAll('p')[1]; // "Second paragraph."
    const key = OASIS.keyFor(p);
    const edits = { text: { [key]: 'Second, edited.' }, sig: { [key]: 'Second paragraph.' } };
    // Redesigned page: an extra wrapper div is inserted and paragraph order shifts,
    // so the original DOM-path key no longer resolves.
    const redesigned = page('<section><div class="wrap"><div class="inner"><p>Welcome to Oasis. Everyone belongs!</p><p>Second paragraph.</p></div></div></section>');
    expect((edits.text[key] && redesigned.window.OASIS.keyFor(redesigned.window.document.querySelectorAll('p')[1]))).not.toBe(key);
    redesigned.window.OASIS.applyEdits(edits);
    const healed = [...redesigned.window.document.querySelectorAll('p')].find(n => n.textContent === 'Second, edited.');
    expect(healed).toBeTruthy();
    dom.window.close(); redesigned.window.close();
  });

  it('does not heal when the signature is ambiguous (two elements share the text)', () => {
    const key = 'section>p:9'; // deliberately non-resolving key
    const edits = { text: { [key]: 'CHANGED' }, sig: { [key]: 'Repeated' } };
    const dom = page('<section><p>Repeated</p><p>Repeated</p></section>');
    dom.window.OASIS.applyEdits(edits);
    expect([...dom.window.document.querySelectorAll('p')].filter(n => n.textContent === 'CHANGED')).toHaveLength(0);
    dom.window.close();
  });

  it('prefers an exact key match and never double-applies to a signature sibling', () => {
    const dom = page('<section><p>Alpha</p><p>Beta</p></section>');
    const { OASIS, document } = dom.window;
    const beta = document.querySelectorAll('p')[1];
    const key = OASIS.keyFor(beta);
    // Same signature present, but the exact key still resolves — heal must be a no-op.
    const edits = { text: { [key]: 'Beta edited' }, sig: { [key]: 'Beta' } };
    OASIS.applyEdits(edits);
    expect(document.querySelectorAll('p')[0].textContent).toBe('Alpha');
    expect(document.querySelectorAll('p')[1].textContent).toBe('Beta edited');
    dom.window.close();
  });

  it('legacy published rows without signatures keep working unchanged', () => {
    const dom = page(fixture), { OASIS, document } = dom.window;
    const p = document.querySelector('p');
    const edits = { text: { [OASIS.keyFor(p)]: 'No sig, still applies.' } };
    const fresh = page(fixture);
    fresh.window.OASIS.applyEdits(edits);
    expect(fresh.window.document.querySelector('p').textContent).toBe('No sig, still applies.');
    dom.window.close(); fresh.window.close();
  });

  it('heals an orphaned copy (direct-text) edit by signature', () => {
    const key = 'section>div>span::text:0';
    const edits = { copy: { [key]: 'Recovered copy.' }, sig: { [key]: 'Find me' } };
    const dom = page('<section><article><span>Find me</span></article></section>');
    dom.window.OASIS.applyEdits(edits);
    expect(dom.window.document.querySelector('span').textContent).toBe('Recovered copy.');
    dom.window.close();
  });
});

describe('applyEdits report', () => {
  it('returns healed and orphaned entries with previews and reasons', () => {
    const key1 = 'section>p:1', key2 = 'section>p:9';
    const edits = {
      text: { [key1]: 'Healed value', [key2]: 'Lost value' },
      sig: { [key1]: 'Movable', [key2]: 'Gone from page' },
    };
    // Only the first signature's text still exists (moved into a wrapper).
    const dom = page('<section><div class="w"><p>Movable</p></div></section>');
    const report = dom.window.OASIS.applyEdits(edits);
    expect(report.healed.map(h => h.key)).toContain(key1);
    expect(report.healed[0].preview).toBe('Healed value');
    expect(report.orphaned.map(o => o.key)).toContain(key2);
    expect(report.orphaned.find(o => o.key === key2).reason).toBe('not-found');
    dom.window.close();
  });

  it('reports ambiguous matches as orphaned, not healed', () => {
    const key = 'x>y:5';
    const edits = { text: { [key]: 'CHANGED' }, sig: { [key]: 'Repeated' } };
    const dom = page('<section><p>Repeated</p><p>Repeated</p></section>');
    const report = dom.window.OASIS.applyEdits(edits);
    expect(report.healed).toHaveLength(0);
    expect(report.orphaned[0].reason).toBe('ambiguous');
    dom.window.close();
  });

  it('reports an edit with no signature as no-signature when its key is gone', () => {
    const edits = { text: { 'gone>p:2': 'Value' } }; // no sig map at all
    const dom = page('<section><p>Something else</p></section>');
    const report = dom.window.OASIS.applyEdits(edits);
    expect(report.orphaned[0].reason).toBe('no-signature');
    dom.window.close();
  });

  it('an empty edits object yields an empty report and does not throw', () => {
    const dom = page('<section><p>Hi</p></section>');
    const report = dom.window.OASIS.applyEdits({});
    expect(report).toEqual({ healed: [], orphaned: [] });
    dom.window.close();
  });
});

describe('editor surfaces orphans on load', () => {
  it('shows a clickable warning and lists un-placed edits in a panel', async () => {
    const dom = page(fixture), { document } = dom.window;
    const key = 'ghost>p:3';
    const loaded = { text: { [key]: 'This copy moved away' }, sig: { [key]: 'Nonexistent original wording' } };
    const sb = {
      auth: { getSession: async () => ({ data: { session: null } }) },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { edits: loaded }, error: null }) }) }) }),
    };
    await boot(dom, sb);
    const status = document.querySelector('#cms-stmsg');
    expect(status.textContent).toContain('could not be placed');
    status.click();
    const panel = document.querySelector('#cms-text-panel');
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain('This copy moved away');
    expect(panel.textContent).toContain('no longer on the page');
    dom.window.close();
  });
});

describe('deleting editor-added blocks', () => {
  it('removes the block, its saved entry and its text override so it stays gone', async () => {
    const dom = page(fixture), { document, OASIS, localStorage } = dom.window;
    const host = document.querySelector('.container');
    const saved = { added: { [OASIS.keyFor(host)]: [{ id: 'add-1', type: 'text' }] }, text: { 'add-1': 'Delete me.' } };
    localStorage.setItem('oasis_draft:about', JSON.stringify(saved));
    await boot(dom);
    const block = document.querySelector('[data-cms="add-1"]');
    expect(block).toBeTruthy();

    // Select the block, then use the toolbar's Delete action.
    dom.window.confirm = () => true;
    block.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }));
    const del = [...document.querySelectorAll('#cms-hover button')].find(b => b.getAttribute('data-a') === 'delete');
    expect(del).toBeTruthy();
    del.click();

    expect(document.querySelector('[data-cms="add-1"]')).toBeNull();
    const after = JSON.parse(localStorage.getItem('oasis_draft:about'));
    expect(after.text && after.text['add-1']).toBeUndefined();
    // Re-applying the saved edits must not resurrect the block.
    const fresh = page(fixture);
    fresh.window.OASIS.applyEdits(after);
    expect(fresh.window.document.querySelector('[data-cms="add-1"]')).toBeNull();
    dom.window.close(); fresh.window.close();
  });

  it('offers no delete action on ordinary coded content', async () => {
    const dom = page(fixture), { document } = dom.window;
    await boot(dom);
    const p = document.querySelector('p');
    p.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }));
    const del = [...document.querySelectorAll('#cms-hover button')].find(b => b.getAttribute('data-a') === 'delete');
    expect(del).toBeUndefined();
    dom.window.close();
  });
});

describe('hidden sections stay reachable', () => {
  it('keeps a hidden section visible-but-ghosted in the editor so it can be unhidden', async () => {
    const dom = page(fixture), { document, OASIS, localStorage } = dom.window;
    const sec = document.querySelector('section');
    localStorage.setItem('oasis_draft:about', JSON.stringify({ hidden: { [OASIS.keyFor(sec)]: true } }));
    await boot(dom);
    // Not display:none in the editor, and clearly marked.
    expect(sec.style.display).not.toBe('none');
    expect(sec.classList.contains('cms-hidden-preview')).toBe(true);
    dom.window.close();
  });

  it('still hides the section on the public site', () => {
    const dom = page(fixture), { OASIS, document } = dom.window;
    const sec = document.querySelector('section');
    OASIS.applyEdits({ hidden: { [OASIS.keyFor(sec)]: true } });
    expect(sec.style.display).toBe('none');
    dom.window.close();
  });
});
