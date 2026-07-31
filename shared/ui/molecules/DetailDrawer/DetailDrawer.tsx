'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '../../atoms/Button'
import { Typography } from '../../atoms/Typography'
import { cn } from '@/utils/cn'

export interface DetailDrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Accessible name when title is not a string. */
  ariaLabel?: string
  className?: string
  backdropClassName?: string
  panelClassName?: string
  /** Desktop max width — default 560px (spec 560–640). */
  size?: 'md' | 'lg'
}

/**
 * Right-edge detail panel — design-system only (no domain knowledge).
 * Portals to `document.body` so backdrop covers the full viewport.
 * Enter: opacity + translateX(24px→0) over ~220ms.
 * Mobile: full-screen; desktop: 560–640px.
 */
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  ariaLabel,
  className,
  backdropClassName,
  panelClassName,
  size = 'md',
}: DetailDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
    <div className={cn('drawer', className)}>
      <div
        className={cn(
          'bg-neutral-900/50 motion-drawer-backdrop fixed inset-0 z-[100] backdrop-blur-sm',
          backdropClassName
        )}
        aria-hidden
        onClick={onClose}
      />
      <aside
        className={cn(
          'motion-drawer-panel fixed inset-y-0 right-0 z-[101] flex w-full flex-col border-l border-neutral-200 bg-white shadow-xl',
          'max-sm:inset-0 max-sm:border-l-0',
          size === 'lg' ? 'sm:max-w-[640px]' : 'sm:max-w-[560px]',
          panelClassName
        )}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === 'string' ? title : 'Detail')}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-4">
          <div className="min-w-0">
            {subtitle ? (
              <Typography variant="small" tone="muted" className="mb-0.5">
                {subtitle}
              </Typography>
            ) : null}
            {title ? (
              <Typography as="h2" weight="semibold" className="truncate">
                {title}
              </Typography>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={16} />}
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white px-5 py-3">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body
  )
}
