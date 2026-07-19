'use client'

import { Calculator, Search } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Input, Select, Stack, Typography, Skeleton } from '@/shared/ui'
import { useRateResolution } from '../hooks/useRateResolution'
import { RateType } from '../../domain/enums/rate-card.enum'

const RATE_TYPE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: RateType.Cost, label: 'Cost' },
  { value: RateType.Billing, label: 'Billing' },
]

const MODE_OPTIONS = [
  { value: 'resolve', label: 'Resolve rate' },
  { value: 'task-preview', label: 'Task cost preview' },
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Admin-only diagnostic view — resolve rate snapshot or preview task labor cost. */
export function RateResolutionView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { result, preview, loading, error, resolve, previewTask } = useRateResolution()
  const [mode, setMode] = useState<'resolve' | 'task-preview'>('resolve')

  const [form, setForm] = useState({
    organizationId: '',
    projectId: '',
    costRoleId: '',
    costRoleCode: '',
    targetDate: todayIso(),
    currencyCode: '',
    rateType: '',
  })

  const [taskForm, setTaskForm] = useState({
    taskId: '',
    costRoleId: '',
    costRoleCode: '',
    targetDate: todayIso(),
    currencyCode: '',
  })

  const canResolve =
    Boolean(form.targetDate) &&
    (Boolean(form.costRoleId.trim()) || Boolean(form.costRoleCode.trim()))

  const canPreview =
    Boolean(taskForm.taskId.trim()) &&
    (Boolean(taskForm.costRoleId.trim()) || Boolean(taskForm.costRoleCode.trim()))

  const handleResolve = async () => {
    try {
      await resolve({
        workspaceId,
        organizationId: form.organizationId.trim() || undefined,
        projectId: form.projectId.trim() || undefined,
        costRoleId: form.costRoleId.trim() || undefined,
        costRoleCode: form.costRoleCode.trim() || undefined,
        targetDate: form.targetDate,
        currencyCode: form.currencyCode.trim() || undefined,
        rateType: form.rateType || undefined,
      })
    } catch {
      // toast already shown by the hook
    }
  }

  const handlePreview = async () => {
    try {
      await previewTask({
        taskId: taskForm.taskId.trim(),
        workspaceId,
        costRoleId: taskForm.costRoleId.trim() || undefined,
        costRoleCode: taskForm.costRoleCode.trim() || undefined,
        targetDate: taskForm.targetDate || undefined,
        currencyCode: taskForm.currencyCode.trim() || undefined,
      })
    } catch {
      // toast already shown by the hook
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Rate Resolution — Diagnostics
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Resolve a rate snapshot or preview estimated labor cost for a task.
        </Typography>
      </div>

      <div className="mb-4 w-64">
        <Select
          value={mode}
          onValueChange={(v: string) => setMode(v as 'resolve' | 'task-preview')}
          options={MODE_OPTIONS}
        />
      </div>

      {mode === 'resolve' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-4">
              Context
            </Typography>
            <Stack direction="vertical" spacing="md">
              <Input label="Workspace ID" value={workspaceId} disabled readOnly />
              <Input
                label="Organization ID (optional)"
                value={form.organizationId}
                onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
              />
              <Input
                label="Project ID (optional)"
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              />
              <Input
                label="Cost role ID (optional)"
                value={form.costRoleId}
                onChange={(e) => setForm((f) => ({ ...f, costRoleId: e.target.value }))}
              />
              <Input
                label="Cost role code (optional)"
                value={form.costRoleCode}
                onChange={(e) => setForm((f) => ({ ...f, costRoleCode: e.target.value }))}
                placeholder="SWE"
              />
              <Input
                label="Target date"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                required
              />
              <Input
                label="Currency code (optional)"
                value={form.currencyCode}
                onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}
                placeholder="USD"
              />
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Rate type (optional)
                </Typography>
                <Select
                  value={form.rateType}
                  onValueChange={(v: string) => setForm((f) => ({ ...f, rateType: v }))}
                  options={RATE_TYPE_OPTIONS}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => void handleResolve()}
                disabled={!canResolve || loading}
                loading={loading}
                icon={<Search size={16} />}
              >
                Resolve rate
              </Button>
            </Stack>
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-4">
              Result
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" width="100%" height={80} />
            ) : error ? (
              <Typography variant="small" className="text-red-700">
                {error}
              </Typography>
            ) : result ? (
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-all bg-neutral-50 p-3 text-xs text-neutral-800">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <Typography tone="muted" variant="small">
                Run a resolution to see the full rate snapshot.
              </Typography>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-4">
              Task cost preview
            </Typography>
            <Stack direction="vertical" spacing="md">
              <Input label="Workspace ID" value={workspaceId} disabled readOnly />
              <Input
                label="Task ID"
                value={taskForm.taskId}
                onChange={(e) => setTaskForm((f) => ({ ...f, taskId: e.target.value }))}
                required
              />
              <Input
                label="Cost role ID (optional)"
                value={taskForm.costRoleId}
                onChange={(e) => setTaskForm((f) => ({ ...f, costRoleId: e.target.value }))}
              />
              <Input
                label="Cost role code (optional)"
                value={taskForm.costRoleCode}
                onChange={(e) => setTaskForm((f) => ({ ...f, costRoleCode: e.target.value }))}
                placeholder="SWE"
              />
              <Input
                label="Target date (optional)"
                type="date"
                value={taskForm.targetDate}
                onChange={(e) => setTaskForm((f) => ({ ...f, targetDate: e.target.value }))}
              />
              <Input
                label="Currency code (optional)"
                value={taskForm.currencyCode}
                onChange={(e) => setTaskForm((f) => ({ ...f, currencyCode: e.target.value }))}
                placeholder="USD"
              />
              <Button
                variant="primary"
                onClick={() => void handlePreview()}
                disabled={!canPreview || loading}
                loading={loading}
                icon={<Calculator size={16} />}
              >
                Preview task cost
              </Button>
            </Stack>
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-4">
              Preview result
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" width="100%" height={80} />
            ) : error ? (
              <Typography variant="small" className="text-red-700">
                {error}
              </Typography>
            ) : preview ? (
              <div className="space-y-3">
                <div>
                  <Typography variant="small" tone="muted">
                    {preview.label}
                  </Typography>
                  <Typography size="lg" weight="bold">
                    {preview.estimatedLaborCostPreview.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{' '}
                    {preview.rateSnapshot.currencyCode}
                  </Typography>
                </div>
                <Typography variant="small" tone="muted">
                  Estimate hours: {preview.estimateHours} · Role {preview.rateSnapshot.costRoleCode}
                </Typography>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all bg-neutral-50 p-3 text-xs text-neutral-800">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            ) : (
              <Typography tone="muted" variant="small">
                Enter a task ID and role to preview estimated labor cost.
              </Typography>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
