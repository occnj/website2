'use client';

function loadScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === '1') return Promise.resolve();
    // Already appended (e.g. by a concurrent call) but not done loading yet —
    // wait for the same tag's load event instead of resolving prematurely.
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load ' + src)));
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => {
      s.dataset.loaded = '1';
      resolve();
    };
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.body.appendChild(s);
  });
}

export function loadScriptSequence(srcs) {
  return srcs.reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve());
}
