'use client'

import { useMemo } from 'react'
import { Typography, Stack, PageSkeleton, DataTable, Card } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { IamSearchField } from './IamSearchField'
import { useIamPermissions } from '../hooks/useIamPermissions'
import type { IamRight } from '@/modules/auth/iam'

function groupByModule(items: IamRight[]): [string, IamRight[]][] {
  const map = new Map<string, IamRight[]>()
  for (const right of items) {
    const key = right.module ?? 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(right)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function AdminIamPermissionsView() {
  const { items, loading, error, keyword, setKeyword, moduleFilter, setModuleFilter, refetch } =
    useIamPermissions()

  const grouped = useMemo(() => groupByModule(items), [items])

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Permission Catalog
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Read-only dictionary of all platform permissions. Use this as a reference when configuring
          roles or granting access.
        </Typography>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-6 flex-wrap items-center">
        <IamSearchField
          placeholder="Search permissions…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <IamSearchField
          placeholder="Filter by module…"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="w-40"
        />
      </Stack>

      {loading ? (
        <PageSkeleton variant="list" />
      ) : error ? (
        <div className="border-error-200 bg-error-50 border p-4">
          <Typography tone="error" variant="small">
            {error}
          </Typography>
        </div>
      ) : grouped.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center">
          <Typography tone="muted" variant="small">
            No permissions found
          </Typography>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([module, rights]) => (
            <Card key={module}>
              <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
                <Typography as="h2" size="sm" weight="semibold" className="uppercase tracking-wide">
                  {module}
                </Typography>
              </div>
              <div className="overflow-x-auto">
                <DataTable
                  ariaLabel="Admin Iam Permissions"
                  rows={rights}
                  rowKey={(right) => String(right.id)}
                  emptyMessage="No items."
                  columns={[
                    {
                      id: 'code',
                      header: 'Code',
                      accessor: 'code',
                      kind: 'code',
                      cellClassName: 'text-xs text-neutral-700',
                    },
                    { id: 'name', header: 'Name', accessor: 'name' },
                    {
                      id: 'description',
                      header: 'Description',
                      cell: (right) => <>{right.description ?? '—'}</>,
                      cellClassName: 'text-neutral-500',
                    },
                    {
                      id: 'status',
                      header: 'Status',
                      cell: (right) => (
                        <>
                          <IamStatusBadge status={right.status} />
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 text-right">
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-xs text-neutral-400 underline hover:text-neutral-600"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
