'use client'

import NextLink from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Link as DesignLink, Typography } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'
import { useAdminOrganizationDetail } from '../hooks/useAdminOrganizationDetail'
import { AdminOrganizationStatusBadge } from './AdminOrganizationStatusBadge'

const TABS = [
  { id: 'overview', label: 'Overview', href: (orgId: string) => ADMIN_ROUTES.organization(orgId) },
  {
    id: 'members',
    label: 'Members',
    href: (orgId: string) => ADMIN_ROUTES.organizationMembers(orgId),
  },
  {
    id: 'invitations',
    label: 'Invitations',
    href: (orgId: string) => ADMIN_ROUTES.organizationInvitations(orgId),
  },
  {
    id: 'teams',
    label: 'Teams',
    href: (orgId: string) => ADMIN_ROUTES.organizationTeams(orgId),
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    href: (orgId: string) => ADMIN_ROUTES.organizationWorkspaces(orgId),
  },
  {
    id: 'activity',
    label: 'Activity',
    href: (orgId: string) => ADMIN_ROUTES.organizationActivity(orgId),
  },
] as const

export function AdminOrganizationDetailShell({ children }: { children: React.ReactNode }) {
  const { orgId } = useParams<{ orgId: string }>()
  const pathname = usePathname()
  const { data, loading } = useAdminOrganizationDetail(orgId)

  const activeTab =
    TABS.find((t) => {
      const href = t.href(orgId)
      if (t.id === 'overview') return pathname === href
      return pathname === href || pathname?.startsWith(`${href}/`)
    })?.id ?? 'overview'

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.organizations}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Organizations
      </NextLink>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Typography as="h1" size="lg" weight="semibold">
            {loading ? '…' : (data?.name ?? 'Organization')}
          </Typography>
          {data && <AdminOrganizationStatusBadge status={data.status} />}
        </div>
        {data && (
          <Typography as="p" variant="small" tone="muted" className="mt-1 font-mono">
            {data.code}
          </Typography>
        )}
      </div>

      <nav
        aria-label="Organization sections"
        className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200"
      >
        {TABS.map((tab) => {
          const href = tab.href(orgId)
          const active = tab.id === activeTab
          return (
            <DesignLink
              key={tab.id}
              as={NextLink}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'border-b-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-primary text-neutral-900'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              )}
            >
              {tab.label}
            </DesignLink>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
