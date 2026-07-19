type LoadingListener = (busyCount: number) => void

let inFlightCount = 0
let routeTransitionCount = 0
const listeners = new Set<LoadingListener>()

function busyCount(): number {
  return inFlightCount + routeTransitionCount
}

function notify(): void {
  const count = busyCount()
  for (const listener of listeners) {
    listener(count)
  }
}

export function getGlobalLoadingCount(): number {
  return busyCount()
}

export function getApiLoadingCount(): number {
  return inFlightCount
}

export function subscribeGlobalLoading(listener: LoadingListener): () => void {
  listeners.add(listener)
  listener(busyCount())
  return () => {
    listeners.delete(listener)
  }
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

/** Start top-bar feedback immediately on in-app navigation click. */
export function beginRouteTransition(): void {
  routeTransitionCount += 1
  notify()
}

/** Clear one route-transition mark (pathname settled / cancelled). */
export function endRouteTransition(): void {
  routeTransitionCount = Math.max(0, routeTransitionCount - 1)
  notify()
}

/** Force-clear navigation marks (e.g. same-route click cancelled). */
export function clearRouteTransitions(): void {
  if (routeTransitionCount === 0) return
  routeTransitionCount = 0
  notify()
}
