// Must match next.config.js's `basePath`. The app is served at the site root
// (e.g. oasisnj.net/admin), so there is no path prefix. Kept as a function so
// call sites don't need to change if a prefix is ever reintroduced.
export const BASE_PATH = '';

export function asset(path) {
  return BASE_PATH + path;
}
