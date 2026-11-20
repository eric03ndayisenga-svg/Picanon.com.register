export function buildInviteUrl(code?: string): string {
  const cleanCode = (code || 'PICANON').trim().toUpperCase();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://picanon.app';
  return `${origin}/picanon/${encodeURIComponent(cleanCode)}`;
}

export function extractInviteFromLocation(): {
  code: string;
  hasExplicitInvite: boolean;
} {
  try {
    if (typeof window === 'undefined') {
      return { code: 'PICANON', hasExplicitInvite: false };
    }

    const pathMatch = window.location.pathname.match(
      /^\/(?:picanon|invite|r)\/([A-Za-z0-9_-]+)/i
    );
    if (pathMatch && pathMatch[1]) {
      return {
        code: decodeURIComponent(pathMatch[1]).toUpperCase(),
        hasExplicitInvite: true,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const queryCode =
      params.get('picanon') ||
      params.get('ref') ||
      params.get('invite') ||
      params.get('code') ||
      params.get('r');

    if (queryCode && queryCode.trim()) {
      return {
        code: queryCode.trim().toUpperCase(),
        hasExplicitInvite: true,
      };
    }

    return { code: 'PICANON', hasExplicitInvite: false };
  } catch {
    return { code: 'PICANON', hasExplicitInvite: false };
  }
}
