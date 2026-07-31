'use client'

import { useParams } from 'next/navigation'
import { Button, Input, PageSkeleton, Typography, Card } from '@/shared/ui'
import { useUtilizationPolicy } from '../hooks/useUtilizationPolicy'
import type { UpdateUtilizationThresholdPolicyPayload } from '../../domain/model/utilization-threshold-policy'

const FIELDS: {
  key: keyof UpdateUtilizationThresholdPolicyPayload
  label: string
}[] = [
  { key: 'underAllocatedPercent', label: 'Under-allocated' },
  { key: 'healthyMinPercent', label: 'Healthy minimum' },
  { key: 'healthyMaxPercent', label: 'Healthy maximum' },
  { key: 'watchMaxPercent', label: 'Watch maximum' },
  { key: 'overloadedPercent', label: 'Overloaded' },
  { key: 'criticalOverloadPercent', label: 'Critical overload' },
]

export function UtilizationPolicyView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { policy, form, loading, saving, error, validationError, updateField, save } =
    useUtilizationPolicy(workspaceId)

  if (loading) return <PageSkeleton variant="detail" />
  if (error) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  const previewStops = [
    { label: 'Under', value: form.underAllocatedPercent },
    { label: 'Healthy', value: form.healthyMaxPercent },
    { label: 'Watch', value: form.watchMaxPercent },
    { label: 'Overloaded', value: form.overloadedPercent },
    { label: 'Critical', value: form.criticalOverloadPercent },
  ]

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Utilization Policies
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Workspace default thresholds. Projects may override later from the project resource
            plan.
          </Typography>
        </div>
        <Button variant="primary" loading={saving} onClick={() => void save()}>
          Save policy
        </Button>
      </div>

      {validationError ? (
        <div className="border-warning/40 bg-warning/10 mb-4 border p-3">
          <Typography variant="small" tone="warning">
            {validationError}
          </Typography>
        </div>
      ) : null}

      <Card className="mb-6 border border-neutral-200 bg-white p-md">
        <Typography variant="small" weight="semibold" className="mb-sm">
          Threshold preview
        </Typography>
        <Typography variant="caption" tone="muted" className="mb-md block">
          0 — Under — Healthy — Watch — Overloaded — Critical
        </Typography>
        <div className="flex flex-wrap gap-md">
          {previewStops.map((stop) => (
            <div key={stop.label} className="min-w-[5rem]">
              <Typography variant="caption" tone="muted">
                {stop.label}
              </Typography>
              <Typography weight="medium">{stop.value}%</Typography>
            </div>
          ))}
        </div>
        {policy?.updatedAt ? (
          <Typography variant="caption" tone="muted" className="mt-md block">
            Last updated {new Date(policy.updatedAt).toLocaleString()}
          </Typography>
        ) : null}
      </Card>

      <Card className="grid max-w-xl gap-3 border border-neutral-200 bg-white p-md">
        {FIELDS.map((field) => (
          <Input
            key={field.key}
            label={`${field.label} (%)`}
            type="number"
            value={String(form[field.key])}
            onChange={(e) => updateField(field.key, Number(e.target.value))}
          />
        ))}
      </Card>
    </div>
  )
}
