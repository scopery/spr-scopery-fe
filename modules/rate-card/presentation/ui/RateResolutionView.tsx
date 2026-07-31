'use client'

import { Calculator, Search } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Input, Select, Stack, Typography, Skeleton, Card } from '@/shared/ui'
import { useRateResolution } from '../hooks/useRateResolution'
import { RateType } from '../../domain/enums/rate-card.enum'
import { ProjectSearchSelect, TaskSearchSelect } from '@/modules/projects'
import { AdminOrganizationSearchSelect } from '@/modules/admin/organizations'
import { useCostingSetup } from '../hooks/useCostingSetup'

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
  const { costRoles } = useCostingSetup(workspaceId)
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
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2">
        <Typography as="h1" size="md" weight="medium">
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
          <Card className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-4">
              Context
            </Typography>
            <Stack direction="vertical" spacing="md">
              <Input label="Workspace context" value="Current workspace" disabled readOnly />
              <AdminOrganizationSearchSelect
                optional
                value={form.organizationId}
                onChange={(organizationId) =>
                  setForm((current) => ({ ...current, organizationId }))
                }
              />
              <ProjectSearchSelect
                workspaceId={workspaceId}
                optional
                value={form.projectId}
                onChange={(projectId) => setForm((current) => ({ ...current, projectId }))}
              />
              <Select
                label="Cost role (optional)"
                value={form.costRoleId}
                options={[
                  { value: '', label: 'Use role code instead' },
                  ...costRoles.map((role) => ({
                    value: role.id,
                    label: `${role.code} · ${role.name}`,
                  })),
                ]}
                onValueChange={(costRoleId: string) =>
                  setForm((current) => ({ ...current, costRoleId }))
                }
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
          </Card>

          <Card className="border border-neutral-200 bg-white p-4">
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
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-4">
              Task cost preview
            </Typography>
            <Stack direction="vertical" spacing="md">
              <Input label="Workspace context" value="Current workspace" disabled readOnly />
              <ProjectSearchSelect
                workspaceId={workspaceId}
                value={form.projectId}
                onChange={(projectId) => {
                  setForm((current) => ({ ...current, projectId }))
                  setTaskForm((current) => ({ ...current, taskId: '' }))
                }}
              />
              <TaskSearchSelect
                projectId={form.projectId}
                value={taskForm.taskId}
                onChange={(taskId) => setTaskForm((current) => ({ ...current, taskId }))}
              />
              <Select
                label="Cost role (optional)"
                value={taskForm.costRoleId}
                options={[
                  { value: '', label: 'Use role code instead' },
                  ...costRoles.map((role) => ({
                    value: role.id,
                    label: `${role.code} · ${role.name}`,
                  })),
                ]}
                onValueChange={(costRoleId: string) =>
                  setTaskForm((current) => ({ ...current, costRoleId }))
                }
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
          </Card>

          <Card className="border border-neutral-200 bg-white p-4">
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
                  <Typography size="md" weight="medium">
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
                Select a task and role to preview estimated labor cost.
              </Typography>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
