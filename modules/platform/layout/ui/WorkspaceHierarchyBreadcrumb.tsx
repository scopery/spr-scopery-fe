'use client'

import NextLink from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Link as DesignLink, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { cn } from '@/utils/cn'

export interface WorkspaceHierarchyBreadcrumbProps {
  workspaceId: string
  project?: { id: string; name: string }
  /** Current page label (workspace- or project-scoped). */
  current?: string
  className?: string
}

export function WorkspaceHierarchyBreadcrumb({
  workspaceId,
  project,
  current,
  className,
}: WorkspaceHierarchyBreadcrumbProps) {
  const { workspaces } = useAuth()
  const workspace = workspaces.find((w) => w.id === workspaceId) ?? null

  const organizationLabel = workspace?.organizationName ?? 'Organization'
  const workspaceLabel = workspace?.name ?? 'Workspace'
  const workspaceHref = ROUTES.workspace.root(workspaceId)
  const projectsHref = ROUTES.workspace.projects(workspaceId)

  type Crumb = { label: string; href?: string; muted?: boolean }

  const crumbs: Crumb[] = [
    { label: organizationLabel, muted: true },
    {
      label: workspaceLabel,
      href: project || current ? workspaceHref : undefined,
    },
  ]

  // Only show Projects crumb when inside a project context
  if (project) {
    crumbs.push({
      label: 'Projects',
      href: projectsHref,
    })
    crumbs.push({
      label: project.name,
      href: current ? ROUTES.workspace.project(workspaceId, project.id) : undefined,
    })
  }

  if (current) {
    crumbs.push({ label: current })
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-3 flex flex-wrap items-center gap-1', className)}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <span key={`${crumb.label}-${index}`} className="inline-flex min-w-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight size={14} className="shrink-0 text-neutral-400" aria-hidden />
            )}
            {crumb.href && !isLast ? (
              <DesignLink
                as={NextLink}
                href={crumb.href}
                variant="muted"
                size="sm"
                className={cn('max-w-[12rem] truncate text-sm hover:text-neutral-900')}
              >
                {crumb.label}
              </DesignLink>
            ) : (
              <Typography
                as="span"
                variant="small"
                className={cn(
                  'max-w-[14rem] truncate',
                  isLast ? 'font-medium text-neutral-900' : 'text-neutral-500',
                  crumb.muted && !isLast && 'text-neutral-500'
                )}
              >
                {crumb.label}
              </Typography>
            )}
          </span>
        )
      })}
    </nav>
  )
}
