'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { ADMIN_ROUTES } from '@/modules/admin'
import {
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import {
  USAGE_TARGET_TYPE_OPTIONS,
  UsagePolicyStatus,
  UsagePolicyTargetType,
  type UsagePolicyTargetType as TargetType,
} from '../../domain/enums/usage-policy.enum'
import type { AiUsagePolicy } from '../../domain/model/usage-policy'
import { useUsagePolicies } from '../hooks/useUsagePolicies'
import { useUsagePolicyMutations } from '../hooks/useUsagePolicyMutations'
import { UsagePolicyFormModal } from './UsagePolicyFormModal'

const PAGE_SIZE = 20

export function UsagePoliciesListView() {
  const canManage = useCanManageAiConfig()
  const [keyword, setKeyword] = useState('')
  const [targetType, setTargetType] = useState<TargetType | ''>('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiUsagePolicy | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiUsagePolicy | null>(null)

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      targetType,
      status: (status || '') as '' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED',
      page,
      size: PAGE_SIZE,
    }),
    [keyword, targetType, status, page]
  )

  const { items, totalElements, loading, error, refetch } = useUsagePolicies(params)
  const { saving, activate, deactivate } = useUsagePolicyMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Usage policies</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Rate limits and budget controls for AI executions
          </Typography>
        </div>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Create policy
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[160px] flex-1">
          <Input
            placeholder="Search…"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-44">
          <Select
            value={targetType}
            onValueChange={(v: string) => {
              setTargetType((v || '') as TargetType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All targets' },
              ...USAGE_TARGET_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus(v)
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: UsagePolicyStatus.Active, label: 'Active' },
              { value: UsagePolicyStatus.Inactive, label: 'Inactive' },
              { value: UsagePolicyStatus.Deprecated, label: 'Deprecated' },
            ]}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Requests</th>
              <th className="px-4 py-3 font-medium">Tokens</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-neutral-500">
                  No usage policies found.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-xs">
                    {p.targetType}
                    {p.targetType !== UsagePolicyTargetType.Global && p.targetId
                      ? ` · ${p.targetId.slice(0, 8)}…`
                      : ''}
                  </td>
                  <td className="px-4 py-3">{p.period || '—'}</td>
                  <td className="px-4 py-3">{p.maxRequestsPerPeriod ?? '—'}</td>
                  <td className="px-4 py-3">{p.maxTokensPerPeriod ?? '—'}</td>
                  <td className="px-4 py-3">{p.maxCostPerPeriod ?? '—'}</td>
                  <td className="px-4 py-3">{p.action || '—'}</td>
                  <td className="px-4 py-3">{p.priority ?? '—'}</td>
                  <td className="px-4 py-3">
                    <AiLifecycleStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        as={NextLink}
                        href={ADMIN_ROUTES.aiControlUsagePolicy(p.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Open
                      </Button>
                      {canManage ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(p)
                              setFormOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          {p.status !== UsagePolicyStatus.Active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => void activate(p.id)}
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeactivateTarget(p)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalElements > PAGE_SIZE ? (
        <div className="flex items-center justify-between">
          <Typography variant="caption" tone="muted">
            {totalElements} total · page {page + 1} / {totalPages}
          </Typography>
          <div className="flex gap-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <UsagePolicyFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        policy={editing}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate usage policy"
        message={deactivateTarget ? `Deactivate “${deactivateTarget.name}”?` : ''}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => {
          if (!deactivateTarget) return
          void deactivate(deactivateTarget.id).then(() => setDeactivateTarget(null))
        }}
      />
    </Stack>
  )
}
