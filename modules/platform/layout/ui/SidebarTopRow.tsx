'use client'

import { useRef } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import { Button, Link as DesignLink, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import {
  WorkspaceProjectSwitcher,
  type WorkspaceProjectSwitcherProps,
} from './WorkspaceProjectSwitcher'

export interface SidebarTopRowProps {
  workspaceId: string
  primaryLabel: string
  secondaryLabel: string
  collapsed: boolean
  switcherOpen: boolean
  onToggleSwitcher: () => void
  onToggleCollapsed: () => void
  switcher: Omit<WorkspaceProjectSwitcherProps, 'anchorRef'>
}

export function SidebarTopRow({
  workspaceId,
  primaryLabel,
  secondaryLabel,
  collapsed,
  switcherOpen,
  onToggleSwitcher,
  onToggleCollapsed,
  switcher,
}: SidebarTopRowProps) {
  const anchorRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={anchorRef}
      className={cn(
        'relative z-30 flex shrink-0 border-b border-neutral-200',
        collapsed ? 'flex-col items-center gap-1 px-1 py-2' : 'h-16 items-center gap-1 px-2'
      )}
    >
      <DesignLink
        as={NextLink}
        href={ROUTES.workspace.projects(workspaceId)}
        className="flex h-10 w-10 shrink-0 items-center justify-center"
        aria-label="Scopery home"
        title="Scopery"
      >
        <Image
          src="/scopery_logo_v2.png"
          alt="Scopery"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          priority
        />
      </DesignLink>

      {collapsed ? null : (
        <button
          type="button"
          onClick={onToggleSwitcher}
          aria-expanded={switcherOpen}
          aria-haspopup="menu"
          title={`${secondaryLabel} / ${primaryLabel}`}
          className={cn(
            'flex min-w-0 flex-1 flex-col rounded-none px-2 py-1.5 text-left motion-colors hover:bg-neutral-50',
            switcherOpen && 'bg-neutral-50'
          )}
        >
          <Typography
            as="span"
            variant="small"
            tone="muted"
            className="truncate text-[11px] leading-tight"
          >
            {secondaryLabel}
          </Typography>
          <Typography as="span" weight="medium" className="truncate text-sm leading-tight">
            {primaryLabel}
          </Typography>
        </button>
      )}

      {!collapsed ? (
        <Button
          variant="ghost"
          size="sm"
          icon={<PanelLeftClose size={16} />}
          aria-label="Collapse navigation"
          title="Collapse navigation"
          onClick={onToggleCollapsed}
          className="shrink-0 motion-icon-hover"
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          icon={<PanelLeft size={14} />}
          aria-label="Expand navigation"
          title="Expand navigation"
          onClick={onToggleCollapsed}
          className="mt-1 h-8 w-8 shrink-0 p-0 motion-icon-hover"
        />
      )}

      {!collapsed ? (
        <WorkspaceProjectSwitcher {...switcher} anchorRef={anchorRef} />
      ) : null}
    </div>
  )
}
