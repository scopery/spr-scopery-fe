'use client'

import React from 'react'
import NextLink from 'next/link'
import { Ban, Check, CheckCircle2, CircleArrowRight, MinusCircle, Trash2 } from 'lucide-react'
import { Typography, Button, Badge, Stack, Select, PageSkeleton, DataTable } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { IamSearchField } from './IamSearchField'
import { useIamRoles } from '../hooks/useIamRoles'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

const SCOPE_OPTIONS = [
  { value: '', label: 'All scopes' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'WORKSPACE', label: 'Workspace' },
]

export function AdminIamRolesView() {
  const {
    items,
    loading,
    error,
    keyword,
    setKeyword,
    scopeFilter,
    setScopeFilter,
    actingId,
    runAction,
  } = useIamRoles()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Roles
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Manage system and workspace roles. Roles bundle permissions for assignment to users.
          </Typography>
        </div>
        <NextLink
          href={ADMIN_ROUTES.iamRoleNew}
          className="inline-flex items-center bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          New system role
        </NextLink>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-6 flex-wrap items-center">
        <IamSearchField
          placeholder="Search roles…"
          value={keyword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
        />
        <Select
          value={scopeFilter}
          onValueChange={(v: string) => setScopeFilter(v)}
          options={SCOPE_OPTIONS}
          className="w-36"
          placeholder="All scopes"
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
            ariaLabel="Admin Iam Roles"
            rows={items}
            rowKey={(role) => String(role.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'code',
                header: 'Code',
                cell: (role) => (
                  <>
                    <span className="text-xs font-normal text-neutral-700">{role.code}</span>
                    {role.isSystem && (
                      <Badge tone="info" className="ml-2">
                        System
                      </Badge>
                    )}
                  </>
                ),
                kind: 'code',
              },
              {
                id: 'name',
                header: 'Name',
                cell: (role) => (
                  <>
                    <NextLink
                      href={ADMIN_ROUTES.iamRole(role.id)}
                      className="text-primary hover:underline"
                    >
                      {role.name}
                    </NextLink>
                  </>
                ),
              },
              {
                id: 'scope',
                header: 'Scope',
                cell: (role) => <>{role.roleScope ?? '—'}</>,
                cellClassName: 'text-neutral-600',
              },
              {
                id: 'source',
                header: 'Source',
                cell: (role) => <>{role.roleSource ?? '—'}</>,
                cellClassName: 'text-neutral-600',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (role) => (
                  <>
                    <IamStatusBadge status={role.status} />
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (role) => (
                  <>
                    <Stack direction="horizontal" spacing="xs" className="flex-wrap">
                      {role.status.toUpperCase() !== 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          disabled={actingId === role.id}
                          onClick={() => void runAction(role.id, 'activate')}
                          className="gap-1 text-emerald-600 hover:text-emerald-700"
                          icon={<Check size={16} />}
                        >
                          <CheckCircle2 size={14} />
                          Activate
                        </Button>
                      )}
                      {role.status.toUpperCase() === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          disabled={actingId === role.id}
                          onClick={() => void runAction(role.id, 'deactivate')}
                          className="gap-1 text-amber-600 hover:text-amber-700"
                          icon={<Ban size={16} />}
                        >
                          <MinusCircle size={14} />
                          Deactivate
                        </Button>
                      )}
                      {!role.isSystem && !role.deletedAt && (
                        <Button
                          variant="ghost"
                          disabled={actingId === role.id}
                          onClick={() => void runAction(role.id, 'softDelete')}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      )}
                      <NextLink
                        href={ADMIN_ROUTES.iamRole(role.id)}
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
