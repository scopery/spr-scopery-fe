'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  beginRouteTransition,
  clearRouteTransitions,
  endRouteTransition,
  subscribeGlobalLoading,
} from '@/shared/lib/globalLoading'

/**
 * Show immediately on click / in-flight requests — delayed show feels like a frozen UI.
 * Ultra-fast requests still exit smoothly via MIN_VISIBLE_MS.
 */
const SHOW_DELAY_MS = 0
/** Once shown, keep visible briefly so hide is not a one-frame blink. */
const MIN_VISIBLE_MS = 250
/** Keep bar briefly after pathname settles so content skeleton can paint. */
const ROUTE_SETTLE_MS = 120

/** Shells where a fixed top line fights the page chrome. */
const HIDE_LOADING_BAR_PREFIXES = ['/onboarding', '/auth/'] as const

function shouldHideLoadingBar(pathname: string | null): boolean {
  if (!pathname) return false
  return HIDE_LOADING_BAR_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  )
}

function isInternalNavigationAnchor(anchor: HTMLAnchorElement, currentPath: string | null): boolean {
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false
  }
  if (/^(https?:|\/\/)/i.test(href)) {
    try {
      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return false
      const next = `${url.pathname}${url.search}`
      const current = currentPath ?? window.location.pathname
      return next !== current && next !== `${current}${window.location.search}`
    } catch {
      return false
    }
  }
  if (!href.startsWith('/')) return false
  const current = currentPath ?? window.location.pathname
  return href !== current && href !== `${current}${window.location.search}`
}

/**
 * Thin top indeterminate bar driven by:
 * - apiClient `trackGlobalLoading` (in-flight requests)
 * - immediate route-transition marks on internal link clicks
 *
 * Pass `{ skipGlobalLoading: true }` on requests that should not toggle the API portion.
 */
export function GlobalLoadingBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const hidden = shouldHideLoadingBar(pathname)
  const visibleRef = useRef(false)
  const shownAtRef = useRef<number | null>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const routeSettleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingRouteRef = useRef(false)

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  // Immediate feedback on in-app link clicks (before the destination page mounts / API runs).
  useEffect(() => {
    if (hidden) return

    const onPointerDown = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (!isInternalNavigationAnchor(anchor, pathname)) return
      if (!pendingRouteRef.current) {
        pendingRouteRef.current = true
        beginRouteTransition()
      }
    }

    document.addEventListener('click', onPointerDown, true)
    return () => document.removeEventListener('click', onPointerDown, true)
  }, [hidden, pathname])

  // Pathname settled → drop the click mark shortly after paint.
  useEffect(() => {
    if (!pendingRouteRef.current) return
    if (routeSettleTimerRef.current) clearTimeout(routeSettleTimerRef.current)
    routeSettleTimerRef.current = setTimeout(() => {
      routeSettleTimerRef.current = undefined
      if (pendingRouteRef.current) {
        pendingRouteRef.current = false
        endRouteTransition()
      }
    }, ROUTE_SETTLE_MS)
    return () => {
      if (routeSettleTimerRef.current) clearTimeout(routeSettleTimerRef.current)
    }
  }, [pathname])

  useEffect(() => {
    const clearTimers = () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      showTimerRef.current = undefined
      hideTimerRef.current = undefined
    }

    if (hidden) {
      clearTimers()
      shownAtRef.current = null
      visibleRef.current = false
      pendingRouteRef.current = false
      clearRouteTransitions()
      setVisible(false)
      return
    }

    return subscribeGlobalLoading((count) => {
      if (count > 0) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current)
          hideTimerRef.current = undefined
        }
        if (visibleRef.current || showTimerRef.current) return
        if (SHOW_DELAY_MS <= 0) {
          shownAtRef.current = Date.now()
          visibleRef.current = true
          setVisible(true)
          return
        }
        showTimerRef.current = setTimeout(() => {
          showTimerRef.current = undefined
          shownAtRef.current = Date.now()
          visibleRef.current = true
          setVisible(true)
        }, SHOW_DELAY_MS)
        return
      }

      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
        showTimerRef.current = undefined
      }

      if (!shownAtRef.current && !visibleRef.current) {
        setVisible(false)
        return
      }

      const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : MIN_VISIBLE_MS
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = undefined
        shownAtRef.current = null
        visibleRef.current = false
        setVisible(false)
      }, remaining)
    })
  }, [hidden])

  if (hidden || !visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 overflow-hidden"
      role="progressbar"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="global-top-loading-bar h-full w-1/3 bg-primary" />
    </div>
  )
}
