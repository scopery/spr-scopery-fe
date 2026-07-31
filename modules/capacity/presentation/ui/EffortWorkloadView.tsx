'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { PersonReferenceSelect } from '@/modules/platform'
import { ROUTES } from '@/constants/routes'
import { useProjectEffort } from '../hooks/useProjectEffort'
import { formatHours } from '../../domain/rules/capacity.rules'
import { ActualEffortStatus } from '../../domain/model/effort'

export function EffortWorkloadView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const {
    tab,
    setTab,
    estimates,
    actuals,
    snapshots,
    memberOptions,
    loading,
    error,
    saving,
    createEstimate,
    createActual,
    cancelActual,
    takeSnapshot,
    memberLabel,
  } = useProjectEffort(projectId, workspaceId)

  const [estimateOpen, setEstimateOpen] = useState(false)
  const [actualOpen, setActualOpen] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [estimateForm, setEstimateForm] = useState({
    workspaceMemberId: '',
    estimatedHours: '',
    estimationMethod: 'MANUAL',
  })
  const [actualForm, setActualForm] = useState({
    workspaceMemberId: '',
    effortHours: '',
    effortDate: new Date().toISOString().slice(0, 10),
  })

  if (loading && estimates.length === 0 && actuals.length === 0) {
    return <PageSkeleton variant="list" />
  }
  if (error) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-md">
        <div>
          <NextLink
            href={ROUTES.workspace.projectResources(workspaceId, projectId)}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            ← Resource Plan
          </NextLink>
          <Typography as="h1" size="md" weight="medium" className="mt-2">
            Effort & Workload
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Compare estimates and actuals. Cancelled actuals stay in history for audit.
          </Typography>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {(
          [
            { id: 'register' as const, label: 'Effort Register' },
            { id: 'snapshots' as const, label: 'Workload Snapshots' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'register' ? (
        <div className="space-y-6">
          <Card as="section" className="border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <Typography weight="semibold" variant="small">
                Estimates ({estimates.length})
              </Typography>
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus size={14} />}
                onClick={() => setEstimateOpen(true)}
              >
                Add estimate
              </Button>
            </div>
            <DataTable
              ariaLabel="Effort estimates"
              rows={estimates}
              rowKey={(estimate) => estimate.id}
              emptyMessage="No effort estimates yet."
              columns={[
                {
                  id: 'resource',
                  header: 'Resource',
                  accessor: (e) => {
                    const label = memberLabel(e.workspaceMemberId)
                    return label === e.workspaceMemberId.slice(0, 8) ? '—' : label || '—'
                  },
                  kind: 'reference',
                },
                { id: 'task', header: 'Task', accessor: () => '—', kind: 'reference' },
                { id: 'hours', header: 'Hours', accessor: (e) => formatHours(e.estimatedHours) },
                { id: 'method', header: 'Method', accessor: (e) => e.estimationMethod ?? '—' },
              ]}
            />
          </Card>

          <Card as="section" className="border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <Typography weight="semibold" variant="small">
                Actual effort ({actuals.length})
              </Typography>
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus size={14} />}
                onClick={() => setActualOpen(true)}
              >
                Log actual
              </Button>
            </div>
            <DataTable
              ariaLabel="Actual effort"
              rows={actuals}
              rowKey={(actual) => actual.id}
              emptyMessage="No actual effort records yet."
              columns={[
                { id: 'date', header: 'Date', accessor: (a) => a.effortDate },
                {
                  id: 'resource',
                  header: 'Resource',
                  accessor: (a) => {
                    const label = memberLabel(a.workspaceMemberId)
                    return label === a.workspaceMemberId.slice(0, 8) ? '—' : label || '—'
                  },
                  kind: 'reference',
                },
                { id: 'hours', header: 'Hours', accessor: (a) => formatHours(a.effortHours) },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (a) => (
                    <Badge
                      size="sm"
                      tone={a.status === ActualEffortStatus.Cancelled ? 'neutral' : 'success'}
                    >
                      {a.status}
                    </Badge>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (a) =>
                    a.status !== ActualEffortStatus.Cancelled ? (
                      <Button size="sm" variant="ghost" onClick={() => setCancelId(a.id)}>
                        Cancel
                      </Button>
                    ) : (
                      '—'
                    ),
                },
              ]}
            />
            <Typography variant="caption" tone="muted" className="block px-4 py-2">
              To correct a mistake: cancel the old record, then create a replacement. Records are
              not deleted.
            </Typography>
          </Card>
        </div>
      ) : (
        <Card as="section" className="border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Snapshots ({snapshots.length})
            </Typography>
            <Button
              size="sm"
              variant="primary"
              loading={saving}
              onClick={() => void takeSnapshot()}
            >
              Take snapshot
            </Button>
          </div>
          <DataTable
            ariaLabel="Workload snapshots"
            rows={snapshots}
            rowKey={(snapshot) => snapshot.id}
            emptyMessage="No workload snapshots yet."
            columns={[
              { id: 'date', header: 'Date', accessor: (s) => s.snapshotDate },
              {
                id: 'allocated',
                header: 'Allocated',
                accessor: (s) => formatHours(s.totalAllocatedHours),
              },
              { id: 'actual', header: 'Actual', accessor: (s) => formatHours(s.totalActualHours) },
              {
                id: 'utilization',
                header: 'Utilization',
                accessor: (s) => `${s.utilizationPercent}%`,
              },
            ]}
          />
        </Card>
      )}

      <Modal
        open={estimateOpen}
        onClose={() => setEstimateOpen(false)}
        title="Add effort estimate"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setEstimateOpen(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: saving,
            onClick: async () => {
              await createEstimate({
                workspaceMemberId: estimateForm.workspaceMemberId,
                estimatedHours: Number(estimateForm.estimatedHours),
                estimationMethod: estimateForm.estimationMethod,
              })
              setEstimateOpen(false)
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <PersonReferenceSelect
            label="Resource"
            value={estimateForm.workspaceMemberId}
            onChange={(v: string) => setEstimateForm((f) => ({ ...f, workspaceMemberId: v }))}
            options={memberOptions}
            placeholder="Select member"
          />
          <Input
            label="Estimated hours"
            type="number"
            value={estimateForm.estimatedHours}
            onChange={(e) => setEstimateForm((f) => ({ ...f, estimatedHours: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={actualOpen}
        onClose={() => setActualOpen(false)}
        title="Log actual effort"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setActualOpen(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: saving,
            onClick: async () => {
              await createActual({
                workspaceMemberId: actualForm.workspaceMemberId,
                effortHours: Number(actualForm.effortHours),
                effortDate: actualForm.effortDate,
              })
              setActualOpen(false)
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <PersonReferenceSelect
            label="Resource"
            value={actualForm.workspaceMemberId}
            onChange={(v: string) => setActualForm((f) => ({ ...f, workspaceMemberId: v }))}
            options={memberOptions}
            placeholder="Select member"
          />
          <Input
            label="Date"
            type="date"
            value={actualForm.effortDate}
            onChange={(e) => setActualForm((f) => ({ ...f, effortDate: e.target.value }))}
          />
          <Input
            label="Hours"
            type="number"
            value={actualForm.effortHours}
            onChange={(e) => setActualForm((f) => ({ ...f, effortHours: e.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelId != null}
        onClose={() => setCancelId(null)}
        title="Cancel actual effort?"
        message="The record stays in history with Cancelled status. Create a new record to replace it."
        confirmLabel="Cancel record"
        variant="danger"
        onConfirm={async () => {
          if (cancelId) await cancelActual(cancelId)
          setCancelId(null)
        }}
      />
    </div>
  )
}
