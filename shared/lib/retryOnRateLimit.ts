import { ApiError } from './api-types'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Retry when the platform returns 429. Does not change rate-limit policy. */
export async function retryOnRateLimit<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; baseDelayMs?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 5
  const baseDelayMs = options?.baseDelayMs ?? 1500
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      const is429 = err instanceof ApiError && err.status === 429
      if (!is429 || attempt >= maxRetries) throw err
      attempt += 1
      await sleep(baseDelayMs * attempt)
    }
  }
}
