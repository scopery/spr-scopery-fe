/** Basic http(s) URL check — empty/null is allowed. */
export function isValidApiBaseUrl(value: string | null | undefined): boolean {
  if (value == null || value.trim() === '') return true
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeProviderCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '_')
}
