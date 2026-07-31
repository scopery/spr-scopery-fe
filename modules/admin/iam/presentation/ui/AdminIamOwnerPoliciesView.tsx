'use client'

import NextLink from 'next/link'
import { Typography, PageSkeleton, DataTable } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamOwnerPolicies } from '../hooks/useIamOwnerPolicies'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function AdminIamOwnerPoliciesView() {
  const { items, loading, error } = useIamOwnerPolicies()
  const policies = Array.isArray(items) ? items : []

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Owner policies
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Define owner defaults and whether owners can delegate access per resource type.
          </Typography>
        </div>
        <NextLink
          href={ADMIN_ROUTES.iamOwnerPolicyNew}
          className="inline-flex items-center bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          New policy
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
            ariaLabel="Admin Iam Owner Policies"
            rows={policies}
            rowKey={(policy) => String(policy.id)}
            emptyMessage="No items."
            columns={[
              { id: 'name', header: 'Name', accessor: 'name' },
              {
                id: 'resource-type',
                header: 'Resource type',
                accessor: 'resourceType',
                cellClassName: 'text-xs',
              },
              {
                id: 'can-delegate',
                header: 'Can delegate',
                cell: (policy) => <>{policy.canDelegate ? 'Yes' : 'No'}</>,
              },
              {
                id: 'status',
                header: 'Status',
                cell: (policy) => (
                  <>
                    <IamStatusBadge status={policy.status} />
                  </>
                ),
              },
              {
                id: 'version',
                header: 'Version',
                accessor: 'version',
                cellClassName: 'text-neutral-600',
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
