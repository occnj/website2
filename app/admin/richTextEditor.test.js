// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { createRichTextEditor, runRichTextCommand } from './richTextEditor';

const instances = [];

function createHarness(content = '<p>Editor text</p>', promptForLink) {
  document.body.innerHTML = `
    <div data-toolbar>
      <button type="button" data-rt-cmd="bold">Bold</button>
      <button type="button" data-rt-cmd="textSize:large">Large</button>
      <button type="button" data-rt-cmd="textSize:normal">Normal</button>
      <button type="button" data-rt-cmd="formatBlock:h2">Heading 2</button>
      <button type="button" data-rt-cmd="insertUnorderedList">List</button>
      <button type="button" data-rt-cmd="createLink">Link</button>
    </div>
    <div data-editor></div>
  `;

  const instance = createRichTextEditor({
    element: document.querySelector('[data-editor]'),
    toolbar: document.querySelector('[data-toolbar]'),
    content,
    label: 'Post content',
    promptForLink,
  });
  instances.push(instance);
  return instance;
}

afterEach(() => {
  while (instances.length) instances.pop().destroy();
  document.body.innerHTML = '';
});

describe('Tiptap rich-text editor', () => {
  it('loads existing HTML and returns empty content consistently', () => {
    const populated = createHarness('<h2>Hello</h2><p>World</p>');
    expect(populated.getHTML()).toBe('<h2>Hello</h2><p>World</p>');
    populated.destroy();
    instances.pop();

    const empty = createHarness('');
    expect(empty.getHTML()).toBe('');
  });

  it('toggles bold off as well as on and updates accessible button state', () => {
    const instance = createHarness();
    instance.editor.commands.setTextSelection({ from: 1, to: 12 });
    const button = document.querySelector('[data-rt-cmd="bold"]');

    button.click();
    expect(instance.getHTML()).toBe('<p><strong>Editor text</strong></p>');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    expect(instance.getHTML()).toBe('<p>Editor text</p>');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('supports headings, lists, and keyboard-style click activation', () => {
    const instance = createHarness();
    instance.editor.commands.setTextSelection(1);

    document.querySelector('[data-rt-cmd="formatBlock:h2"]').click();
    expect(instance.getHTML()).toBe('<h2>Editor text</h2>');

    document.querySelector('[data-rt-cmd="insertUnorderedList"]').click();
    expect(instance.getHTML()).toBe('<ul><li><p>Editor text</p></li></ul>');
  });

  it('changes only the selected text size without converting the paragraph', () => {
    const instance = createHarness('<p>Make this bigger</p>');
    instance.editor.commands.setTextSelection({ from: 6, to: 10 });

    document.querySelector('[data-rt-cmd="textSize:large"]').click();
    expect(instance.getHTML()).toBe('<p>Make <span class="rt-text-large">this</span> bigger</p>');

    document.querySelector('[data-rt-cmd="textSize:normal"]').click();
    expect(instance.getHTML()).toBe('<p>Make this bigger</p>');
  });

  it('creates and removes links without relying on a DOM selection range', () => {
    const prompts = ['https://example.com', ''];
    const instance = createHarness('<p>Example</p>', () => prompts.shift());
    instance.editor.commands.setTextSelection({ from: 1, to: 8 });
    const button = document.querySelector('[data-rt-cmd="createLink"]');

    button.click();
    expect(instance.getHTML()).toBe('<p><a href="https://example.com">Example</a></p>');

    button.click();
    expect(instance.getHTML()).toBe('<p>Example</p>');
  });

  it('keeps commands scoped to their own editor instance', () => {
    const first = createHarness('<p>First</p>');
    const firstEditor = first.editor;
    firstEditor.commands.setTextSelection({ from: 1, to: 6 });

    const secondElement = document.createElement('div');
    const secondToolbar = document.createElement('div');
    document.body.append(secondToolbar, secondElement);
    const second = createRichTextEditor({
      element: secondElement,
      toolbar: secondToolbar,
      content: '<p>Second</p>',
    });
    instances.push(second);

    second.editor.commands.setTextSelection({ from: 1, to: 7 });
    runRichTextCommand(firstEditor, 'bold');

    expect(first.getHTML()).toBe('<p><strong>First</strong></p>');
    expect(second.getHTML()).toBe('<p>Second</p>');
  });
});
