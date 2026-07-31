'use client'

import { Archive, Check, Plus } from 'lucide-react'

import React from 'react'
import NextLink from 'next/link'
import { Typography, Button, Stack, Select, Input, PageSkeleton, DataTable } from '@/shared/ui'
import { useAdminWorkspaces } from '../hooks/useAdminWorkspaces'
import { AdminWorkspaceStatusBadge } from './AdminWorkspaceStatusBadge'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { WorkspaceStatus } from '../../domain/enums/workspace.enum'
import { AdminOrganizationSearchSelect } from '@/modules/admin/organizations'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: WorkspaceStatus.Active, label: 'Active' },
  { value: WorkspaceStatus.Inactive, label: 'Inactive' },
  { value: WorkspaceStatus.Archived, label: 'Archived' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminWorkspacesListView() {
  const {
    items,
    totalElements,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    organizationId,
    setOrganizationId,
    actingId,
    runAction,
  } = useAdminWorkspaces()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Workspaces
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Search and manage workspaces across organizations.
            {totalElements > 0 ? ` ${totalElements} total.` : ''}
          </Typography>
        </div>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.workspaceNew}
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
        >
          Create workspace
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
        <div className="w-64 shrink-0">
          <AdminOrganizationSearchSelect
            optional
            label="Filter organization"
            value={organizationId}
            onChange={setOrganizationId}
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
        <div className="overflow-x-auto border border-neutral-200">
          <DataTable
            ariaLabel="Admin Workspaces List"
            rows={items}
            rowKey={(ws) => String(ws.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'name',
                header: 'Name',
                cell: (ws) => (
                  <>
                    <NextLink
                      href={ADMIN_ROUTES.workspace(ws.id)}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {ws.name}
                    </NextLink>
                  </>
                ),
              },
              {
                id: 'code',
                header: 'Code',
                accessor: 'code',
                kind: 'code',
                cellClassName: 'text-xs text-neutral-600',
              },
              {
                id: 'organization',
                header: 'Organization',
                cell: (ws) => (
                  <>
                    <NextLink
                      href={ADMIN_ROUTES.organization(ws.organizationId)}
                      className="text-xs font-normal text-primary hover:underline"
                    >
                      —
                    </NextLink>
                  </>
                ),
              },
              {
                id: 'visibility',
                header: 'Visibility',
                accessor: 'defaultVisibility',
                cellClassName: 'text-neutral-600',
              },
              {
                id: 'join-policy',
                header: 'Join policy',
                accessor: 'joinPolicy',
                cellClassName: 'text-neutral-600',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (ws) => (
                  <>
                    <AdminWorkspaceStatusBadge status={ws.status} />
                  </>
                ),
              },
              {
                id: 'created',
                header: 'Created',
                cell: (ws) => <>{formatDate(ws.createdAt)}</>,
                cellClassName: 'text-neutral-600',
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (ws) => (
                  <>
                    <Stack direction="horizontal" spacing="sm" className="items-center">
                      <NextLink
                        href={ADMIN_ROUTES.workspace(ws.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </NextLink>
                      <NextLink
                        href={ADMIN_ROUTES.workspaceAccess(ws.id)}
                        className="text-sm text-neutral-600 hover:underline"
                      >
                        Access
                      </NextLink>
                      {ws.status === WorkspaceStatus.Archived ? (
                        <Button
                          variant="ghost"
                          disabled={actingId === ws.id}
                          onClick={() => void runAction(ws.id, 'activate')}
                          icon={<Check size={16} />}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          disabled={actingId === ws.id}
                          onClick={() => void runAction(ws.id, 'archive')}
                          icon={<Archive size={16} />}
                        >
                          Archive
                        </Button>
                      )}
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
