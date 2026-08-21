import { Editor } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';

const STATEFUL_COMMANDS = new Set([
  'bold',
  'italic',
  'underline',
  'formatBlock:h1',
  'formatBlock:h2',
  'formatBlock:h3',
  'formatBlock:p',
  'insertUnorderedList',
  'insertOrderedList',
  'createLink',
]);

function commandIsActive(editor, command) {
  switch (command) {
    case 'bold': return editor.isActive('bold');
    case 'italic': return editor.isActive('italic');
    case 'underline': return editor.isActive('underline');
    case 'formatBlock:h1': return editor.isActive('heading', { level: 1 });
    case 'formatBlock:h2': return editor.isActive('heading', { level: 2 });
    case 'formatBlock:h3': return editor.isActive('heading', { level: 3 });
    case 'formatBlock:p': return editor.isActive('paragraph');
    case 'insertUnorderedList': return editor.isActive('bulletList');
    case 'insertOrderedList': return editor.isActive('orderedList');
    case 'createLink': return editor.isActive('link');
    default: return false;
  }
}

export function syncRichTextToolbar(editor, toolbar) {
  toolbar.querySelectorAll('[data-rt-cmd]').forEach((button) => {
    const command = button.getAttribute('data-rt-cmd');
    if (!STATEFUL_COMMANDS.has(command)) return;

    const active = commandIsActive(editor, command);
    button.classList.toggle('rt-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

export function runRichTextCommand(editor, command, promptForLink = window.prompt) {
  switch (command) {
    case 'bold': return editor.chain().focus().toggleBold().run();
    case 'italic': return editor.chain().focus().toggleItalic().run();
    case 'underline': return editor.chain().focus().toggleUnderline().run();
    case 'formatBlock:h1': return editor.chain().focus().toggleHeading({ level: 1 }).run();
    case 'formatBlock:h2': return editor.chain().focus().toggleHeading({ level: 2 }).run();
    case 'formatBlock:h3': return editor.chain().focus().toggleHeading({ level: 3 }).run();
    case 'formatBlock:p': return editor.chain().focus().setParagraph().run();
    case 'insertUnorderedList': return editor.chain().focus().toggleBulletList().run();
    case 'insertOrderedList': return editor.chain().focus().toggleOrderedList().run();
    case 'insertHorizontalRule': return editor.chain().focus().setHorizontalRule().run();
    case 'createLink': {
      const currentUrl = editor.getAttributes('link').href || '';
      const url = promptForLink('Link URL (leave empty to remove):', currentUrl);
      if (url === null) return false;
      if (!url.trim()) return editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
    default: return false;
  }
}

export function createRichTextEditor({ element, toolbar, content, label, promptForLink }) {
  if (!element || !toolbar) throw new Error('Rich-text editor requires an editor element and toolbar.');

  let editor;
  const updateToolbar = () => {
    if (editor && !editor.isDestroyed) syncRichTextToolbar(editor, toolbar);
  };

  editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: { rel: null, target: null },
          openOnClick: false,
        },
        trailingNode: false,
      }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: content || '<p></p>',
    editorProps: {
      attributes: {
        'aria-label': label || 'Rich text editor',
        class: 'tiptap-editor',
      },
    },
    onBlur: updateToolbar,
    onFocus: updateToolbar,
    onSelectionUpdate: updateToolbar,
    onTransaction: updateToolbar,
    onUpdate: updateToolbar,
  });

  const onToolbarClick = (event) => {
    const button = event.target.closest('[data-rt-cmd]');
    if (!button || !toolbar.contains(button)) return;

    runRichTextCommand(editor, button.getAttribute('data-rt-cmd'), promptForLink);
    updateToolbar();
  };

  toolbar.addEventListener('click', onToolbarClick);
  updateToolbar();

  return {
    editor,
    getHTML() {
      return editor.isEmpty ? '' : editor.getHTML();
    },
    destroy() {
      toolbar.removeEventListener('click', onToolbarClick);
      if (!editor.isDestroyed) editor.destroy();
    },
  };
}
