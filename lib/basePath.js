// Must match next.config.js's `basePath`. Used to manually prefix raw
// <img>/<script>/<a> references — next/link and next/image handle this
// automatically, but plain string src/href attributes do not.
export const BASE_PATH = '/website';

export function asset(path) {
  return BASE_PATH + path;
}
