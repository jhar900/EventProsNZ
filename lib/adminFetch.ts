/**
 * Wrapper around fetch for admin API calls.
 * Ensures session cookies are sent with every request for cookie-based auth.
 * Replaces the old pattern of sending x-admin-token headers from client code.
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, { ...options, credentials: 'include' });
}
