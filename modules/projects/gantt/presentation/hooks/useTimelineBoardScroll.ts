'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  clampScrollLeft,
  columnScrollLeft,
  wheelDeltaToHorizontalPan,
} from '../../domain/rules/timeline-board-scroll.rules'

export type TimelineBoardScrollSource = 'left' | 'canvas'

export type TimelineBoardScrollSnapshot = {
  left: number
  top: number
}

type Options = {
  /**
   * When false, wheel listeners are not attached (e.g. empty Team Schedule).
   * Defaults to true.
   */
  enabled?: boolean
  /**
   * Re-bind listeners when geometry changes (columns × colWidth, day-load header, etc.).
   * Prefer a stable string/number derived from canvasWidth + column count.
   */
  layoutKey: string | number
  /** Optional: clear hover / mark scroll idle while gesturing. */
  onScrollActivity?: () => void
}

/**
 * Shared scroll contract for left-list + date-canvas timeline boards:
 * - left wheel/scroll → vertical only, canvas.scrollTop follows
 * - canvas wheel → horizontal pan when scrollWidth > clientWidth
 * - header.scrollLeft mirrors canvas.scrollLeft
 * - Alt+drag / middle-click drag pans horizontally
 */
export function useTimelineBoardScroll(options: Options) {
  const enabled = options.enabled ?? true
  const { layoutKey, onScrollActivity } = options

  const leftScrollRef = useRef<HTMLDivElement>(null)
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const canvasHeaderScrollRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)
  const panDragRef = useRef<{ startX: number; startScroll: number } | null>(null)
  const onScrollActivityRef = useRef(onScrollActivity)
  onScrollActivityRef.current = onScrollActivity

  const markActivity = useCallback(() => {
    onScrollActivityRef.current?.()
  }, [])

  const syncHeaderScroll = useCallback((scrollLeft: number) => {
    const header = canvasHeaderScrollRef.current
    if (header && header.scrollLeft !== scrollLeft) header.scrollLeft = scrollLeft
  }, [])

  const syncScroll = useCallback(
    (source: TimelineBoardScrollSource) => {
      if (syncingRef.current) return
      syncingRef.current = true
      markActivity()
      const left = leftScrollRef.current
      const canvas = canvasScrollRef.current
      if (left && canvas) {
        if (source === 'left') {
          if (canvas.scrollTop !== left.scrollTop) canvas.scrollTop = left.scrollTop
        } else if (left.scrollTop !== canvas.scrollTop) {
          left.scrollTop = canvas.scrollTop
        }
      }
      if (source === 'canvas' && canvas) syncHeaderScroll(canvas.scrollLeft)
      requestAnimationFrame(() => {
        syncingRef.current = false
      })
    },
    [markActivity, syncHeaderScroll]
  )

  const scrollCanvasToColumnIndex = useCallback(
    (columnIndex: number, colWidth: number) => {
      const canvas = canvasScrollRef.current
      if (!canvas || columnIndex < 0) return false
      const targetLeft = columnScrollLeft(
        columnIndex,
        colWidth,
        canvas.clientWidth
      )
      canvas.scrollTo({ left: targetLeft, behavior: 'smooth' })
      syncHeaderScroll(targetLeft)
      return true
    },
    [syncHeaderScroll]
  )

  const panCanvas = useCallback(
    (direction: -1 | 1, colWidth: number) => {
      const canvas = canvasScrollRef.current
      if (!canvas) return
      const step = Math.max(colWidth * 3, Math.round(canvas.clientWidth * 0.75))
      canvas.scrollBy({ left: direction * step, behavior: 'smooth' })
      requestAnimationFrame(() => syncHeaderScroll(canvas.scrollLeft))
    },
    [syncHeaderScroll]
  )

  const getScrollSnapshot = useCallback((): TimelineBoardScrollSnapshot => {
    const canvas = canvasScrollRef.current
    const left = leftScrollRef.current
    return {
      left: canvas?.scrollLeft ?? 0,
      top: canvas?.scrollTop ?? left?.scrollTop ?? 0,
    }
  }, [])

  const restoreScroll = useCallback(
    (snapshot: TimelineBoardScrollSnapshot) => {
      const canvas = canvasScrollRef.current
      const left = leftScrollRef.current
      if (canvas) {
        canvas.scrollLeft = snapshot.left
        canvas.scrollTop = snapshot.top
        syncHeaderScroll(snapshot.left)
      }
      if (left) left.scrollTop = snapshot.top
    },
    [syncHeaderScroll]
  )

  /** Canvas wheel → horizontal date pan (never steal when no H overflow). */
  useEffect(() => {
    const canvas = canvasScrollRef.current
    if (!canvas || !enabled) return

    const onWheel = (e: WheelEvent) => {
      const dx = wheelDeltaToHorizontalPan(e.deltaX, e.deltaY)
      if (dx === 0) return
      const maxLeft = canvas.scrollWidth - canvas.clientWidth
      if (maxLeft <= 0) return
      e.preventDefault()
      const next = clampScrollLeft(canvas.scrollLeft, maxLeft, dx)
      if (next !== canvas.scrollLeft) {
        canvas.scrollLeft = next
        syncHeaderScroll(next)
        markActivity()
      }
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [enabled, layoutKey, syncHeaderScroll, markActivity])

  /**
   * Re-check after layout settles (Day zoom, assignee day-load header, font load).
   * ResizeObserver alone does not attach wheel — layoutKey already rebinds — but
   * syncing header after size change avoids a stale header offset.
   */
  useEffect(() => {
    const canvas = canvasScrollRef.current
    if (!canvas || !enabled || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      syncHeaderScroll(canvas.scrollLeft)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [enabled, layoutKey, syncHeaderScroll])

  /** Left list: native vertical wheel; keep canvas rows aligned. */
  useEffect(() => {
    const left = leftScrollRef.current
    if (!left || !enabled) return
    const onWheel = () => {
      markActivity()
      requestAnimationFrame(() => syncScroll('left'))
    }
    left.addEventListener('wheel', onWheel, { passive: true })
    return () => left.removeEventListener('wheel', onWheel)
  }, [enabled, layoutKey, markActivity, syncScroll])

  const onCanvasPanMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 1 && !(e.button === 0 && e.altKey)) return
      e.preventDefault()
      const canvas = canvasScrollRef.current
      if (!canvas) return
      panDragRef.current = { startX: e.clientX, startScroll: canvas.scrollLeft }
      markActivity()
      const onMove = (ev: MouseEvent) => {
        const drag = panDragRef.current
        if (!drag || !canvasScrollRef.current) return
        const next = drag.startScroll - (ev.clientX - drag.startX)
        canvasScrollRef.current.scrollLeft = next
        syncHeaderScroll(canvasScrollRef.current.scrollLeft)
      }
      const onUp = () => {
        panDragRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [markActivity, syncHeaderScroll]
  )

  return {
    leftScrollRef,
    canvasScrollRef,
    canvasHeaderScrollRef,
    syncScroll,
    syncHeaderScroll,
    scrollCanvasToColumnIndex,
    panCanvas,
    getScrollSnapshot,
    restoreScroll,
    onCanvasPanMouseDown,
  }
}
