export function withDebugQuery(path: string): string {
  try {
    const current = new URLSearchParams(window.location.search);
    if (current.get('debug') !== '1') {
      return path;
    }

    const url = new URL(path, window.location.origin);
    url.searchParams.set('debug', '1');
    return `${url.pathname}${url.search}`;
  } catch {
    return path;
  }
}
