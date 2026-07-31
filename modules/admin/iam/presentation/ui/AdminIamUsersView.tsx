'use client'

import React from 'react'
import NextLink from 'next/link'
import { Ban, Check, CheckCircle2, CircleArrowRight, MinusCircle } from 'lucide-react'
import { Typography, Button, Stack, Select, PageSkeleton, DataTable } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { IamSearchField } from './IamSearchField'
import { useIamUsers } from '../hooks/useIamUsers'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export function AdminIamUsersView() {
  const {
    items,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    actingId,
    runAction,
  } = useIamUsers()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Users
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            View and manage platform users, their status, and access.
          </Typography>
        </div>
        <NextLink
          href={ADMIN_ROUTES.iamUserNew}
          className="inline-flex items-center bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Create user
        </NextLink>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-6 flex-wrap items-center">
        <IamSearchField
          placeholder="Search by name or email…"
          value={keyword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
        />
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
            ariaLabel="Admin Iam Users"
            rows={items}
            rowKey={(user) => String(user.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'name',
                header: 'Name',
                cell: (user) => (
                  <>
                    <NextLink
                      href={ADMIN_ROUTES.iamUser(user.id)}
                      className="text-primary hover:underline"
                    >
                      {user.fullName || '—'}
                    </NextLink>
                  </>
                ),
              },
              {
                id: 'username',
                header: 'Username',
                accessor: 'username',
                cellClassName: 'text-neutral-600',
              },
              {
                id: 'email',
                header: 'Email',
                accessor: 'email',
                cellClassName: 'text-neutral-600',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (user) => (
                  <>
                    <IamStatusBadge status={user.status} />
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (user) => (
                  <>
                    <Stack direction="horizontal" spacing="xs" className="flex-wrap">
                      {user.status.toUpperCase() !== 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          disabled={actingId === user.id}
                          onClick={() => void runAction(user.id, 'activate')}
                          className="gap-1 text-emerald-600 hover:text-emerald-700"
                          icon={<Check size={16} />}
                        >
                          <CheckCircle2 size={14} />
                          Activate
                        </Button>
                      )}
                      {user.status.toUpperCase() === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          disabled={actingId === user.id}
                          onClick={() => void runAction(user.id, 'deactivate')}
                          className="gap-1 text-amber-600 hover:text-amber-700"
                          icon={<Ban size={16} />}
                        >
                          <MinusCircle size={14} />
                          Deactivate
                        </Button>
                      )}
                      {user.status.toUpperCase() !== 'SUSPENDED' && (
                        <Button
                          variant="ghost"
                          disabled={actingId === user.id}
                          onClick={() => void runAction(user.id, 'suspend')}
                          className="gap-1 text-orange-600 hover:text-orange-700"
                        >
                          <Ban size={14} />
                          Suspend
                        </Button>
                      )}
                      <NextLink
                        href={ADMIN_ROUTES.iamUser(user.id)}
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
