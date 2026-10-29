/**
 * Ammi Express Admin API Client
 * Ensures all admin requests carry persistent Bearer token and headers
 */

export function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('ammi_admin_token') || '';
}

export function getAdminHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }
  return headers;
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('x-admin-token')) {
      headers.set('x-admin-token', token);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401) {
    console.warn(`Admin API returned 401 for ${url}`);
  }

  return response;
}
