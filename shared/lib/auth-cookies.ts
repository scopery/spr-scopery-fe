/** Cookie names shared between middleware, BFF proxy, and client session helpers. */
export const SCOPERY_TOKEN_COOKIE = 'scopery_token'
export const SCOPERY_SESSION_COOKIE = 'scopery_session'

export function hasAuthCookies(cookies: { has: (name: string) => boolean }): boolean {
  return cookies.has(SCOPERY_TOKEN_COOKIE) || cookies.has(SCOPERY_SESSION_COOKIE)
}
