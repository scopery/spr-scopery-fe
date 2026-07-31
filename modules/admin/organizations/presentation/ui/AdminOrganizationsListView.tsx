'use client'

import { Archive, Check, Plus } from 'lucide-react'

import React from 'react'
import NextLink from 'next/link'
import { Typography, Button, DataTable, Stack, Select, Input, PageSkeleton } from '@/shared/ui'
import { useAdminOrganizations } from '../hooks/useAdminOrganizations'
import { AdminOrganizationStatusBadge } from './AdminOrganizationStatusBadge'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { OrganizationStatus } from '../../domain/enums/organization.enum'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: OrganizationStatus.Active, label: 'Active' },
  { value: OrganizationStatus.Inactive, label: 'Inactive' },
  { value: OrganizationStatus.Archived, label: 'Archived' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminOrganizationsListView() {
  const {
    items,
    totalElements,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    actingId,
    runAction,
  } = useAdminOrganizations()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Organizations
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Search and manage platform organizations.
            {totalElements > 0 ? ` ${totalElements} total.` : ''}
          </Typography>
        </div>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.organizationNew}
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
        >
          Create organization
        </Button>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-6 flex-wrap items-center">
        <div className="w-56 shrink-0">
          <Input
            fullWidth
            placeholder="Search by name or code…"
            value={keyword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v: string) => setStatusFilter(v)}
          options={STATUS_OPTIONS}
          className="w-40"
          placeholder="All statuses"
        />
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
        <DataTable
          className="border border-neutral-200"
          ariaLabel="Organizations"
          rows={items}
          rowKey={(org) => org.id}
          emptyMessage="No organizations found"
          columns={[
            {
              id: 'name',
              header: 'Name',
              cell: (org) => (
                <NextLink
                  href={ADMIN_ROUTES.organization(org.id)}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {org.name}
                </NextLink>
              ),
            },
            { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
            {
              id: 'status',
              header: 'Status',
              cell: (org) => <AdminOrganizationStatusBadge status={org.status} />,
            },
            { id: 'created', header: 'Created', accessor: (org) => formatDate(org.createdAt) },
            {
              id: 'actions',
              header: 'Actions',
              cellClassName: 'min-w-[12rem] whitespace-nowrap',
              cell: (org) => (
                <Stack direction="horizontal" spacing="sm" className="items-center">
                  <NextLink
                    href={ADMIN_ROUTES.organization(org.id)}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </NextLink>
                  {org.status === OrganizationStatus.Archived ? (
                    <Button
                      variant="ghost"
                      disabled={actingId === org.id}
                      onClick={() => void runAction(org.id, 'activate')}
                      icon={<Check size={16} />}
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      disabled={actingId === org.id}
                      onClick={() => void runAction(org.id, 'archive')}
                      icon={<Archive size={16} />}
                    >
                      Archive
                    </Button>
                  )}
                </Stack>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
