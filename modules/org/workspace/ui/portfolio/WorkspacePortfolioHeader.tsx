'use client'

import type { ReactNode } from 'react'
import NextLink from 'next/link'
import { MoreHorizontal, Plus, Users, FileText } from 'lucide-react'
import { Badge, Button, Typography } from '@/shared/ui'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import type { WorkspaceDetail } from '../../model'
import { cn } from '@/utils/cn'

interface WorkspacePortfolioHeaderProps {
  workspace: WorkspaceDetail
  projectCount: number
  memberCount: number | null
  canCreateProjects: boolean
  canUpdateWorkspace: boolean
  canManageMembers: boolean
  canInviteMembers: boolean
  onCreateProject: () => void
  actionsOpen: boolean
  onToggleActions: () => void
}

function statusLabel(status: string) {
  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function WorkspacePortfolioHeader({
  workspace,
  projectCount,
  memberCount,
  canCreateProjects,
  canUpdateWorkspace,
  canManageMembers,
  canInviteMembers,
  onCreateProject,
  actionsOpen,
  onToggleActions,
}: WorkspacePortfolioHeaderProps) {
  const visibility = String(workspace.defaultVisibility).replace(/_/g, ' ')
  const join = String(workspace.joinPolicy).replace(/_/g, ' ')

  return (
    <header className="mb-2 border-b border-neutral-200 pb-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Typography as="h1" size="md" weight="medium" className="text-neutral-900">
              {workspace.name}
            </Typography>
            <Badge
              variant="solid"
              tone={String(workspace.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
            >
              {statusLabel(workspace.status)}
            </Badge>
          </div>
          <Typography as="p" variant="small" tone="muted" className="mt-1 max-w-2xl">
            Workspace portfolio, project progress and operational signals.
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-2 font-mono text-xs">
            {workspace.code} · {visibility} · {join}
            {memberCount != null ? ` · ${memberCount} Members` : ''}
          </Typography>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          {canCreateProjects ? (
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={onCreateProject}>
              New Project
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            aria-label="Workspace actions"
            aria-expanded={actionsOpen}
            onClick={onToggleActions}
            icon={<MoreHorizontal size={16} />}
          />
          {actionsOpen ? (
            <div
              className={cn(
                'absolute right-0 top-full z-20 mt-1 min-w-[200px] border border-neutral-200 bg-white py-1 shadow-md'
              )}
              role="menu"
            >
              <MenuLink href={WORKSPACE_ROUTES.projects(workspace.id)} label="Open Projects" />
              <MenuLink
                href={WORKSPACE_ROUTES.documentHub(workspace.id)}
                label="Document Hub"
                icon={<FileText size={14} />}
              />
              <MenuLink
                href={WORKSPACE_ROUTES.directory(workspace.id)}
                label="Directory"
                icon={<Users size={14} />}
              />
              {canInviteMembers ? (
                <MenuLink
                  href={WORKSPACE_ROUTES.directory(workspace.id, 'invitations')}
                  label="Invitations"
                />
              ) : null}
              {canManageMembers ? (
                <MenuLink
                  href={WORKSPACE_ROUTES.directory(workspace.id, 'members')}
                  label="Manage Members"
                />
              ) : null}
              {canUpdateWorkspace ? (
                <MenuLink
                  href={WORKSPACE_ROUTES.settingsGeneral(workspace.id)}
                  label="Workspace Settings"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function MenuLink({ href, label, icon }: { href: string; label: string; icon?: ReactNode }) {
  return (
    <NextLink
      href={href}
      role="menuitem"
      className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
    >
      {icon}
      {label}
    </NextLink>
  )
}
