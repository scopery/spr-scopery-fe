'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { Button, ConfirmDialog, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { UsagePolicyStatus, UsagePolicyTargetType } from '../../domain/enums/usage-policy.enum'
import { useUsagePolicyDetail } from '../hooks/useUsagePolicies'
import { useUsagePolicyMutations } from '../hooks/useUsagePolicyMutations'
import { UsagePolicyFormModal } from './UsagePolicyFormModal'
import { useUsagePolicyTargetOptions } from '../hooks/useUsagePolicyTargetOptions'

export function UsagePolicyDetailView() {
  const { policyId } = useParams<{ policyId: string }>()
  const canManage = useCanManageAiConfig()
  const { policy, loading, error, refetch } = useUsagePolicyDetail(policyId)
  const { options: targetOptions } = useUsagePolicyTargetOptions(
    policy?.targetType ?? UsagePolicyTargetType.Global
  )
  const { saving, activate, deactivate } = useUsagePolicyMutations(refetch)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const targetLabel = policy?.targetId
    ? (targetOptions.find((option) => option.value === policy.targetId)?.label ?? '—')
    : null

  if (loading && !policy) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !policy) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Usage policy not found'}</Typography>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.aiControlUsagePolicies}
          size="sm"
          variant="outline"
        >
          Back to policies
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button
            as={NextLink}
            href={ADMIN_ROUTES.aiControlUsagePolicies}
            size="sm"
            variant="ghost"
          >
            ← Usage policies
          </Button>
          <Typography variant="h2" className="mt-sm">
            {policy.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {policy.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {policy.status !== UsagePolicyStatus.Active ? (
                <Button size="sm" disabled={saving} onClick={() => void activate(policy.id)}>
                  Activate
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setDeactivateOpen(true)}>
                  Deactivate
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Status
          </Typography>
          <div className="mt-1">
            <AiLifecycleStatusBadge status={policy.status} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Target
          </Typography>
          <Typography className="mt-1">
            {policy.targetType}
            {policy.targetId ? ` · ${targetLabel}` : ''}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Period / action / priority
          </Typography>
          <Typography className="mt-1">
            {policy.period || '—'} · {policy.action || '—'} · {policy.priority ?? '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Requests / tokens / cost
          </Typography>
          <Typography className="mt-1">
            {policy.maxRequestsPerPeriod ?? '—'} / {policy.maxTokensPerPeriod ?? '—'} /{' '}
            {policy.maxCostPerPeriod ?? '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Concurrent / daily budget
          </Typography>
          <Typography className="mt-1">
            {policy.maxConcurrentRequests ?? '—'} / {policy.dailyBudget ?? '—'}
          </Typography>
        </div>
        <div className="sm:col-span-2">
          <Typography variant="caption" tone="muted">
            Description
          </Typography>
          <Typography className="mt-1">{policy.description || '—'}</Typography>
        </div>
      </dl>

      <UsagePolicyFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        policy={policy}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate usage policy"
        message={`Deactivate “${policy.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(policy.id).then(() => setDeactivateOpen(false))}
      />
    </Stack>
  )
}
