const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getFullUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return `${API_URL}${path}`;
  }
  return `${API_URL}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAvatarUrl(avatar: string | undefined): string {
  if (!avatar) return '';
  return getFullUrl(avatar);
}
