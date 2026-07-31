'use client'

import NextLink from 'next/link'
import { Ban, CircleArrowRight, Search } from 'lucide-react'
import { Typography, Button, Stack, PageSkeleton, DataTable } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamGrants } from '../hooks/useIamGrants'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'
import { IamEntityIdentityCard } from './IamEntityIdentityCard'
import { UserSearchSelect } from '@/modules/platform'
import { IamResourceSearchSelect } from './IamResourceSearchSelect'

export function AdminIamGrantsView() {
  const {
    items,
    loading,
    error,
    subjectId,
    setSubjectId,
    resourceId,
    setResourceId,
    actingId,
    refetch,
    revoke,
  } = useIamGrants()
  const { usersById, rolesById, resourcesById } = useIamIdentityDirectory({
    userIds: items.filter((grant) => grant.subjectType === 'USER').map((grant) => grant.subjectId),
    roleIds: [
      ...items.filter((grant) => grant.subjectType === 'ROLE').map((grant) => grant.subjectId),
      ...items.map((grant) => grant.roleId),
    ],
    resourceIds: items.map((grant) => grant.resourceId),
  })

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Grants
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Search, inspect, and revoke direct access grants.
          </Typography>
        </div>
        <NextLink
          href={ADMIN_ROUTES.iamGrantNew}
          className="inline-flex items-center bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Create grant
        </NextLink>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-6 flex-wrap items-center">
        <div className="min-w-56">
          <UserSearchSelect label="Filter by user" value={subjectId} onChange={setSubjectId} />
        </div>
        <div className="min-w-64">
          <IamResourceSearchSelect
            label="Filter by resource"
            value={resourceId}
            onChange={setResourceId}
          />
        </div>
        <Button variant="primary" onClick={() => void refetch()} icon={<Search size={16} />}>
          Search
        </Button>
      </Stack>

      {loading ? (
        <PageSkeleton variant="list" />
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <DataTable
            ariaLabel="Admin Iam Grants"
            rows={items}
            rowKey={(grant) => String(grant.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'subject',
                header: 'Subject',
                cell: (grant) => (
                  <>
                    <NextLink
                      href={ADMIN_ROUTES.iamGrant(grant.id)}
                      className="block hover:opacity-90"
                    >
                      {grant.subjectType === 'USER' && usersById[grant.subjectId] ? (
                        <IamEntityIdentityCard
                          title={
                            usersById[grant.subjectId].fullName ||
                            usersById[grant.subjectId].username
                          }
                          subtitle={`@${usersById[grant.subjectId].username}`}
                          meta={usersById[grant.subjectId].email}
                          id={grant.subjectId}
                          avatarFallback={
                            usersById[grant.subjectId].fullName ||
                            usersById[grant.subjectId].username
                          }
                          badge={grant.subjectType}
                        />
                      ) : grant.subjectType === 'ROLE' && rolesById[grant.subjectId] ? (
                        <IamEntityIdentityCard
                          title={rolesById[grant.subjectId].name}
                          subtitle={rolesById[grant.subjectId].code}
                          meta={rolesById[grant.subjectId].roleScope}
                          id={grant.subjectId}
                          badge={grant.subjectType}
                        />
                      ) : (
                        <IamEntityIdentityCard
                          title="—"
                          subtitle={grant.subjectType}
                          id={grant.subjectId}
                          badge={grant.subjectType}
                        />
                      )}
                    </NextLink>
                  </>
                ),
              },
              {
                id: 'resource',
                header: 'Resource',
                cell: (grant) => (
                  <>
                    {resourcesById[grant.resourceId] ? (
                      <IamEntityIdentityCard
                        title={resourcesById[grant.resourceId].name}
                        subtitle={resourcesById[grant.resourceId].code}
                        meta={resourcesById[grant.resourceId].resourceType}
                        id={grant.resourceId}
                      />
                    ) : (
                      <IamEntityIdentityCard title="—" id={grant.resourceId} />
                    )}
                  </>
                ),
              },
              { id: 'effect', header: 'Effect', accessor: 'effect' },
              {
                id: 'status',
                header: 'Status',
                cell: (grant) => (
                  <>
                    <IamStatusBadge status={grant.status} />
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (grant) => (
                  <>
                    <Stack direction="horizontal" spacing="xs" className="flex-wrap">
                      <Button
                        variant="ghost"
                        tone="error"
                        disabled={actingId === grant.id || grant.status !== 'ACTIVE'}
                        onClick={() => void revoke(grant.id)}
                        icon={<Ban size={16} />}
                      >
                        Revoke
                      </Button>
                      <NextLink
                        href={ADMIN_ROUTES.iamGrant(grant.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
                      >
                        <CircleArrowRight size={14} />
                        View
                      </NextLink>
                    </Stack>
                  </>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
