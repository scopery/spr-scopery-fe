'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, LogOut, Settings } from 'lucide-react'
import { Avatar, Button, Typography, uiDropdownPanel } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { AdminAppModeSwitch } from './AdminAppModeSwitch'

export interface UserOrganizationMenuProps {
  collapsed: boolean
  displayName: string
  email?: string
  organizationName: string
  avatarFallback: string
  canAccessAdmin?: boolean
  onLogout: () => void
  onOpenHelp: () => void
  onOpenSettings: () => void
}

export function UserOrganizationMenu({
  collapsed,
  displayName,
  email,
  organizationName,
  avatarFallback,
  canAccessAdmin,
  onLogout,
  onOpenHelp,
  onOpenSettings,
}: UserOrganizationMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ bottom: number; left: number } | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const panelWidth = Math.min(240, window.innerWidth - 16)

    let left = rect.right + 8
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, rect.left - panelWidth - 8)
    }

    // Flush to the right of the avatar row — bottom of panel near bottom of trigger
    const bottom = Math.max(8, window.innerHeight - rect.bottom)

    setPosition({ bottom, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      close()
    }

    const onReposition = () => updatePosition()

    // Capture phase so we close even if something stops propagation
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, close, updatePosition])

  return (
    <div ref={anchorRef} className="relative z-30 shrink-0 border-t border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={collapsed ? `${displayName} — ${organizationName}` : undefined}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-3 text-left motion-colors hover:bg-neutral-50',
          collapsed && 'justify-center px-2',
          open && 'bg-neutral-50'
        )}
      >
        <Avatar size="sm" fallback={avatarFallback} alt={displayName} />
        {!collapsed ? (
          <span className="min-w-0 flex-1">
            <Typography as="span" weight="medium" className="block truncate text-sm">
              {displayName}
            </Typography>
            <Typography
              as="span"
              variant="small"
              tone="muted"
              className="block truncate text-[11px]"
            >
              {organizationName}
            </Typography>
          </span>
        ) : null}
      </button>

      {open && position && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              className={cn(
                uiDropdownPanel,
                'fixed z-[100] max-h-[min(24rem,calc(100vh-1rem))] w-60 overflow-y-auto shadow-xl'
              )}
              style={{ bottom: position.bottom, left: position.left }}
            >
              <div className="border-b border-neutral-100 px-3 py-2">
                <Typography weight="medium" className="truncate text-sm">
                  {displayName}
                </Typography>
                {email ? (
                  <Typography variant="small" tone="muted" className="truncate">
                    {email}
                  </Typography>
                ) : null}
              </div>
              <div className="border-b border-neutral-100 px-3 py-2">
                <Typography
                  as="p"
                  variant="small"
                  tone="muted"
                  weight="medium"
                  className="mb-1 text-[11px] uppercase tracking-wide"
                >
                  Current organization
                </Typography>
                <Typography variant="small" weight="medium">
                  {organizationName}
                </Typography>
              </div>
              <div className="flex flex-col py-1">
                <button
                  type="button"
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => {
                    close()
                    onOpenSettings()
                  }}
                >
                  <Settings size={14} className="text-neutral-500" />
                  Settings
                </button>
                <AdminAppModeSwitch
                  mode="app"
                  canAccessAdmin={canAccessAdmin}
                  loading={false}
                  onNavigate={close}
                  className="px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => {
                    close()
                    onOpenHelp()
                  }}
                >
                  <BookOpen size={14} className="text-neutral-500" />
                  Guideline
                </button>
                <Button
                  variant="ghost"
                  icon={<LogOut size={12} />}
                  onClick={() => {
                    close()
                    onLogout()
                  }}
                  className="w-full justify-start rounded-none px-3 py-2 text-sm"
                >
                  Sign out
                </Button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
