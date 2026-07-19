'use client'

import NextLink from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Link as DesignLink, Typography } from '@/shared/ui'
import { ShellSidebar, type ShellSidebarSection } from './ShellSidebar'
import { cn } from '@/utils/cn'

export interface SettingsNavigationProps {
  collapsed: boolean
  sections: ShellSidebarSection[]
  backHref: string
  backLabel: string
  onBack: () => void
}

export function SettingsNavigation({
  collapsed,
  sections,
  backHref,
  backLabel,
  onBack,
}: SettingsNavigationProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={cn('shrink-0 border-b border-neutral-100', collapsed ? 'px-1 py-2' : 'px-2 py-2')}>
        <DesignLink
          as={NextLink}
          href={backHref}
          onClick={onBack}
          title={collapsed ? backLabel : undefined}
          className={cn(
            'flex items-center gap-2 rounded-none px-2 py-2 text-sm text-neutral-700 motion-colors hover:bg-neutral-50 hover:text-neutral-900',
            collapsed && 'justify-center px-1'
          )}
        >
          <ArrowLeft size={16} className="shrink-0 text-neutral-500" aria-hidden />
          {!collapsed ? (
            <Typography as="span" variant="small" className="truncate">
              {backLabel}
            </Typography>
          ) : null}
        </DesignLink>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 py-2">
        <ShellSidebar
          ariaLabel="Settings navigation"
          collapsed={collapsed}
          contextKey="settings"
          sections={sections}
        />
      </div>
    </div>
  )
}
