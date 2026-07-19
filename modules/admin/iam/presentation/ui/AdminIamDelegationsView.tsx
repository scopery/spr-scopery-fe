'use client'

import React from 'react'
import NextLink from 'next/link'
import { CircleArrowRight, Search } from 'lucide-react'
import { Typography, Button, Stack, PageSkeleton } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { IamSearchField } from './IamSearchField'
import { useIamGrants } from '../hooks/useIamGrants'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function AdminIamDelegationsView() {
  const {
    items,
    loading,
    error,
    subjectId,
    setSubjectId,
    resourceId,
    setResourceId,
    refetch,
  } = useIamGrants()

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

      <Stack direction="horizontal" spacing="sm" className="mb-6 flex-wrap items-center">
        <IamSearchField
          placeholder="Subject ID"
          value={subjectId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubjectId(e.target.value)}
        />
        <IamSearchField
          placeholder="Resource ID"
          value={resourceId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResourceId(e.target.value)}
        />
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Grant ID</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((grant) => (
                <tr key={grant.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <NextLink
                      href={ADMIN_ROUTES.iamGrant(grant.id)}
                      className="text-primary hover:underline"
                    >
                      {grant.id}
                    </NextLink>
                  </td>
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" tone="muted">
                      {grant.subjectType}
                    </Typography>
                    <br />
                    <Typography as="span" variant="small" className="font-mono">
                      {grant.subjectId}
                    </Typography>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{grant.resourceId}</td>
                  <td className="px-4 py-3">
                    <IamStatusBadge status={grant.status} />
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Typography variant="small" tone="muted">
                      No grants found
                    </Typography>
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
