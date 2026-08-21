import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('preserves safe editor text-size classes and removes executable markup', async () => {
    const html = '<p>Make <span class="rt-text-large">this</span>' +
      '<img src="x" onerror="alert(1)"><script>alert(2)</script></p>';

    await expect(sanitizeHtml(html)).resolves.toBe(
      '<p>Make <span class="rt-text-large">this</span><img src="x"></p>',
    );
  });
});
