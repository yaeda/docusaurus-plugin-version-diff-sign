export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/u, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function joinUrlSegments(...segments: Array<string | undefined>): string {
  const filtered = segments
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => segment.replace(/^\/+|\/+$/gu, ''))
    .filter(Boolean);

  if (filtered.length === 0) {
    return '/';
  }

  return normalizePathname(filtered.join('/'));
}
