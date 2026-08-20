// Ministry post bodies are entered by trusted admins, but we still sanitize
// before rendering with dangerouslySetInnerHTML so that a compromised or
// careless account can never introduce stored XSS on a public page.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
  'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
  'hr', 'span', 'code', 'pre',
];
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height'];

export async function sanitizeHtml(dirty) {
  if (!dirty) return '';
  const DOMPurify = (await import('isomorphic-dompurify')).default;
  return DOMPurify.sanitize(String(dirty), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  });
}
