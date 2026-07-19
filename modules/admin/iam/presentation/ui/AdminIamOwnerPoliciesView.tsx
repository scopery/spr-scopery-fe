'use client'

import NextLink from 'next/link'
import { Typography, PageSkeleton } from '@/shared/ui'
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Resource type</th>
                <th className="px-4 py-3 font-medium">Can delegate</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Version</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium">{policy.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{policy.resourceType}</td>
                  <td className="px-4 py-3">{policy.canDelegate ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <IamStatusBadge status={policy.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{policy.version}</td>
                </tr>
              ))}
              {!policies.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                    No owner policies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
