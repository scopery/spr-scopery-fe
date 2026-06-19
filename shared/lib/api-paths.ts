/**
 * Shared API path builder for v2 endpoints.
 */
const getBaseUrl = () =>
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
    : ''

export const v2 = (path: string) => `${getBaseUrl()}/api/v2${path}`
