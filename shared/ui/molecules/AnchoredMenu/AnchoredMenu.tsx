'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

export interface AnchoredMenuProps {
  open: boolean
  onClose: () => void
  /** Anchor element (usually the trigger button wrapper or the button itself). */
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
  /** Min width in px */
  minWidth?: number
}

/**
 * Fixed-position menu portaled to document.body so it is not clipped by
 * overflow:hidden ancestors (common in catalog toolbars).
 */
export function AnchoredMenu({
  open,
  onClose,
  anchorRef,
  children,
  className,
  minWidth = 180,
}: AnchoredMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }

    const update = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const width = Math.max(minWidth, menuRef.current?.offsetWidth ?? minWidth)
      const height = menuRef.current?.offsetHeight ?? 0
      // Align menu's right edge with anchor's right edge
      let left = rect.right - width
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      let top = rect.bottom + 4
      if (height > 0 && top + height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - height - 4)
      }
      setPos({ top, left })
    }

    update()
    // Remeasure after paint once menu has real size (flyout width/height).
    const raf = window.requestAnimationFrame(update)
    const menuEl = menuRef.current
    const ro =
      typeof ResizeObserver !== 'undefined' && menuEl
        ? new ResizeObserver(() => update())
        : null
    if (menuEl && ro) ro.observe(menuEl)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef, minWidth])

  useEffect(() => {
    if (!open) return

    // Prefer `click` over `mousedown` so menuitem onClick runs before outside-close.
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    // Defer so the opening click doesn't immediately close.
    const id = window.setTimeout(() => {
      document.addEventListener('click', onDocClick)
      document.addEventListener('keydown', onKey)
    }, 0)

    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, anchorRef])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        minWidth,
        visibility: pos ? 'visible' : 'hidden',
      }}
      className={cn(
        'fixed z-[200] border border-neutral-200 bg-white py-1 shadow-md',
        className
      )}
    >
      {children}
    </div>,
    document.body
  )
}

export const anchoredMenuItemClassName =
  'block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50'
