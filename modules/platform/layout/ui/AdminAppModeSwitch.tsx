'use client'

import NextLink from 'next/link'
import { LayoutGrid, Shield } from 'lucide-react'
import { Link as DesignLink } from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { usePlatformAdminAccess } from '@/modules/auth/iam'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

export type AdminAppMode = 'admin' | 'app'

export interface AdminAppModeSwitchProps {
  mode: AdminAppMode
  className?: string
  onNavigate?: () => void
}

export function AdminAppModeSwitch({ mode, className, onNavigate }: AdminAppModeSwitchProps) {
  const { currentWorkspaceId } = useAuth()
  const { canAccessAdmin, loading } = usePlatformAdminAccess()

  if (loading || !canAccessAdmin) return null

  const workspaceHref = currentWorkspaceId
    ? ROUTES.workspace.projects(currentWorkspaceId)
    : ROUTES.onboarding

  if (mode === 'admin') {
    return (
      <DesignLink
        as={NextLink}
        href={workspaceHref}
        className={cn(
          'flex items-center gap-2 rounded-none px-4 py-2 text-sm hover:bg-neutral-50',
          className
        )}
        onClick={onNavigate}
      >
        <LayoutGrid size={14} className="shrink-0 text-neutral-500" />
        Workspace app
      </DesignLink>
    )
  }

  return (
    <DesignLink
      as={NextLink}
      href={ROUTES.admin.templates}
      className={cn(
        'flex items-center gap-2 rounded-none px-4 py-2 text-sm hover:bg-neutral-50',
        className
      )}
      onClick={onNavigate}
    >
      <Shield size={14} className="shrink-0 text-neutral-500" />
      Admin Control
    </DesignLink>
  )
}
