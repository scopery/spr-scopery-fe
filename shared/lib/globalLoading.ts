type LoadingListener = (inFlightCount: number) => void

let inFlightCount = 0
const listeners = new Set<LoadingListener>()

function notify(): void {
  for (const listener of listeners) {
    listener(inFlightCount)
  }
}

export function getGlobalLoadingCount(): number {
  return inFlightCount
}

export function subscribeGlobalLoading(listener: LoadingListener): () => void {
  listeners.add(listener)
  listener(inFlightCount)
  return () => listeners.delete(listener)
}

/** Returns a cleanup fn — call in finally after the request completes. */
export function trackGlobalLoading(enabled = true): () => void {
  if (!enabled) return () => {}

  inFlightCount += 1
  notify()

  return () => {
    inFlightCount = Math.max(0, inFlightCount - 1)
    notify()
  }
}
