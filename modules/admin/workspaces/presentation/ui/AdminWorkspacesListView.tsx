'use client'

import { Archive, Check, Plus } from 'lucide-react'

import React from 'react'
import NextLink from 'next/link'
import { Typography, Button, Stack, Select, Input, PageSkeleton } from '@/shared/ui'
import { useAdminWorkspaces } from '../hooks/useAdminWorkspaces'
import { AdminWorkspaceStatusBadge } from './AdminWorkspaceStatusBadge'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { WorkspaceStatus } from '../../domain/enums/workspace.enum'

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
          <Input
            fullWidth
            placeholder="Filter organization ID…"
            value={organizationId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrganizationId(e.target.value)}
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3 font-medium">Join policy</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    No workspaces found
                  </td>
                </tr>
              ) : (
                items.map((ws) => (
                  <tr key={ws.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <NextLink
                        href={ADMIN_ROUTES.workspace(ws.id)}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {ws.name}
                      </NextLink>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{ws.code}</td>
                    <td className="px-4 py-3">
                      <NextLink
                        href={ADMIN_ROUTES.organization(ws.organizationId)}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {ws.organizationId.slice(0, 8)}…
                      </NextLink>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{ws.defaultVisibility}</td>
                    <td className="px-4 py-3 text-neutral-600">{ws.joinPolicy}</td>
                    <td className="px-4 py-3">
                      <AdminWorkspaceStatusBadge status={ws.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(ws.createdAt)}</td>
                    <td className="px-4 py-3">
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
                            onClick={() => void runAction(ws.id, 'activate')} icon={<Check size={16} />}>
                            Activate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            disabled={actingId === ws.id}
                            onClick={() => void runAction(ws.id, 'archive')} icon={<Archive size={16} />}>
                            Archive
                          </Button>
                        )}
                      </Stack>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
