'use client'

import NextLink from 'next/link'
import { Typography } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

const CARDS: { title: string; description: string; href: string }[] = [
  {
    title: 'Users',
    description: 'Search, create, and manage platform users and account status.',
    href: ADMIN_ROUTES.iamUsers,
  },
  {
    title: 'Roles',
    description: 'Manage system and workspace roles that bundle permissions.',
    href: ADMIN_ROUTES.iamRoles,
  },
  {
    title: 'Role assignments',
    description: 'Assign roles to users and control assignment lifecycle.',
    href: ADMIN_ROUTES.iamRoleAssignments,
  },
  {
    title: 'Permissions',
    description: 'Browse the permission catalog available for grants and roles.',
    href: ADMIN_ROUTES.iamPermissions,
  },
  {
    title: 'Grants',
    description: 'Create, inspect, and revoke direct access grants.',
    href: ADMIN_ROUTES.iamGrants,
  },
  {
    title: 'Authorization check',
    description: 'Check whether a user is allowed a right on a resource.',
    href: ADMIN_ROUTES.iamAuthorizationCheck,
  },
  {
    title: 'Authorization explain',
    description: 'Explain why access is allowed or denied, including sources.',
    href: ADMIN_ROUTES.iamAuthorizationExplain,
  },
  {
    title: 'Owner policies',
    description: 'Define owner defaults and delegation rules per resource type.',
    href: ADMIN_ROUTES.iamOwnerPolicies,
  },
  {
    title: 'Delegations',
    description: 'Delegate parts of an existing grant to another subject.',
    href: ADMIN_ROUTES.iamDelegations,
  },
  {
    title: 'Audit',
    description: 'Read-only history of IAM access changes across the platform.',
    href: ADMIN_ROUTES.platformAuditEvents,
  },
  {
    title: 'Resources',
    description: 'Registry of IAM resources that can receive grants.',
    href: ADMIN_ROUTES.iamResources,
  },
]

export function AdminIamOverviewView() {
  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          IAM overview
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Identity and access administration for users, roles, grants, and authorization tools.
        </Typography>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <NextLink
            key={card.href}
            href={card.href}
            className="border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <Typography as="h2" size="sm" weight="semibold" className="mb-1">
              {card.title}
            </Typography>
            <Typography as="p" variant="small" tone="muted">
              {card.description}
            </Typography>
          </NextLink>
        ))}
      </div>
    </div>
  )
}
