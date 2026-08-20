// Ministry post bodies are entered by trusted admins, but we still sanitize
// before rendering with dangerouslySetInnerHTML so that a compromised or
// careless account can never introduce stored XSS on a public page.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
  'hr', 'span', 'code', 'pre',
];
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height'];

export async function sanitizeHtml(dirty) {
  if (!dirty) return '';
  try {
    const DOMPurify = (await import('isomorphic-dompurify')).default;
    return DOMPurify.sanitize(String(dirty), {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
    });
  } catch (err) {
    // If the sanitizer itself fails to load or run (e.g. a jsdom/runtime issue
    // in the server environment), never take the whole page down with it.
    // Fall back to a conservative, tag-stripped plain-text rendering so the
    // post still loads. Log so the real cause is visible in the server log.
    console.error('[sanitizeHtml] falling back to text-only render:', err && err.message);
    return escapeToText(String(dirty));
  }
}

// Last-resort: strip all tags and escape entities. Loses formatting but is
// always safe and never throws.
function escapeToText(s) {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\s+/g, ' ')
    .trim();
}
