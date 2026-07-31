'use client'

import NextLink from 'next/link'
import { CircleArrowRight } from 'lucide-react'
import { Typography, Stack, PageSkeleton, DataTable } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamGrants } from '../hooks/useIamGrants'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function AdminIamDelegationsView() {
  const { items, loading, error } = useIamGrants()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Delegations
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Browse grants that can be used as delegation sources, or create a new delegation.
          </Typography>
        </div>
        <NextLink
          href={ADMIN_ROUTES.iamDelegationNew}
          className="inline-flex items-center bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Create delegation
        </NextLink>
      </div>

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
            ariaLabel="Admin Iam Delegations"
            rows={items}
            rowKey={(grant) => String(grant.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'grant-id',
                header: 'Grant ID',
                accessor: () => '—',
                kind: 'reference',
                cellClassName: 'text-xs',
              },
              {
                id: 'subject',
                header: 'Subject',
                cell: (grant) => (
                  <>
                    <Typography as="span" variant="small" tone="muted">
                      {grant.subjectType}
                    </Typography>
                  </>
                ),
              },
              {
                id: 'resource',
                header: 'Resource',
                accessor: () => '—',
                kind: 'reference',
                cellClassName: 'text-xs',
              },
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
                      <NextLink
                        href={`${ADMIN_ROUTES.iamDelegationNew}?resourceRefId=${encodeURIComponent(grant.resourceId)}`}
                        className="inline-flex items-center px-2 py-1 text-sm text-primary hover:bg-neutral-100"
                      >
                        Delegate
                      </NextLink>
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
