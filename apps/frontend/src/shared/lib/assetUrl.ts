/** Public or app asset under Vite `base` (e.g. `/` or `/showcase/`). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (path.startsWith(base)) {
    return path;
  }
  if (base === '/' && path.startsWith('/')) {
    return path;
  }
  return `${base}${path.replace(/^\/+/, '')}`;
}
