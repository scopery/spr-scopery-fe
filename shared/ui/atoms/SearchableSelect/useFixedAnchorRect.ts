'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'

export interface FixedAnchorRect {
  top: number
  left: number
  width: number
  maxHeight: number
}

const PANEL_MAX = 256
const GAP = 4

/** Viewport-fixed position for a dropdown, so overflow:hidden ancestors cannot clip it. */
export function useFixedAnchorRect(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>
): FixedAnchorRect | null {
  const [rect, setRect] = useState<FixedAnchorRect | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setRect(null)
      return
    }

    const update = () => {
      const el = anchorRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom - 8
      const spaceAbove = r.top - 8
      const openUp = spaceBelow < 140 && spaceAbove > spaceBelow
      const maxHeight = Math.max(120, Math.min(PANEL_MAX, openUp ? spaceAbove : spaceBelow))
      setRect({
        top: openUp ? r.top - maxHeight - GAP : r.bottom + GAP,
        left: r.left,
        width: r.width,
        maxHeight,
      })
    }

    update()
    const raf = window.requestAnimationFrame(update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef])

  return rect
}
