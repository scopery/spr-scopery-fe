'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge, Typography, Link as DesignLink, Skeleton } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useNotifications } from '@/modules/notifications'
import { getTypeBadge } from '@/modules/notifications/lib/notificationBadge'
import { cn } from '@/utils/cn'

export interface NotificationsQuickPanelProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  anchorRef: React.RefObject<HTMLElement>
}

export function NotificationsQuickPanel({
  open,
  onClose,
  workspaceId,
  anchorRef,
}: NotificationsQuickPanelProps) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const { items, loading, markRead, refetch } = useNotifications()

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = 320
    let left = rect.right + 8
    if (left + width > window.innerWidth - 8) left = Math.max(8, rect.left - width - 8)
    setPosition({ top: rect.top, left })
  }, [anchorRef])

  useEffect(() => {
    if (!open) return
    void refetch()
    updatePosition()
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, onClose, refetch, updatePosition, anchorRef])

  if (!open || !position || typeof document === 'undefined') return null

  const preview = items.slice(0, 8)
  const inboxHref = ROUTES.workspace.notifications(workspaceId)

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[100] w-80 border border-neutral-200 bg-white shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
        <Typography weight="medium" className="text-sm">
          Notifications
        </Typography>
        <DesignLink
          as={NextLink}
          href={inboxHref}
          className="text-sm text-neutral-600 hover:text-neutral-900"
          onClick={onClose}
        >
          View all
        </DesignLink>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading && preview.length === 0 ? (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading notifications">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton variant="text" width="75%" height={14} />
                <Skeleton variant="text" width="45%" height={12} />
              </div>
            ))}
          </div>
        ) : preview.length === 0 ? (
          <Typography variant="small" tone="muted" className="px-3 py-6 text-center">
            No notifications
          </Typography>
        ) : (
          <ul>
            {preview.map((n) => {
              const isUnread = n.status === 'UNREAD'
              const badge = getTypeBadge(n.title)
              return (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-2 border-b border-neutral-50 px-3 py-2.5 text-left motion-colors hover:bg-neutral-50',
                    isUnread && 'bg-neutral-50/80'
                  )}
                  onClick={() => {
                    if (isUnread) void markRead(n.id)
                    onClose()
                    router.push(inboxHref)
                  }}
                >
                  <span className="min-w-0 flex-1 flex-col gap-0.5">
                    {badge ? (
                      <span className="mb-1 block">
                        <Badge variant="solid" tone={badge.tone} size="sm">
                          {badge.label}
                        </Badge>
                      </span>
                    ) : null}
                    <Typography
                      as="span"
                      weight={isUnread ? 'medium' : 'normal'}
                      className="line-clamp-2 text-sm"
                    >
                      {n.title}
                    </Typography>
                    {n.bodyPreview ? (
                      <Typography as="span" variant="small" tone="muted" className="line-clamp-2">
                        {n.bodyPreview}
                      </Typography>
                    ) : null}
                  </span>
                </button>
              </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body
  )
}
