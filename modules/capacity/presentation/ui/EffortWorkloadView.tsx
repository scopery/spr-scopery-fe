'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
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
    members,
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
      <div className="border border-error/30 bg-error/5 p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-md">
        <div>
          <NextLink
            href={ROUTES.workspace.projectResources(workspaceId, projectId)}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            ← Resource Plan
          </NextLink>
          <Typography as="h1" size="lg" weight="semibold" className="mt-2">
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
          <section className="border border-neutral-200 bg-white">
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
            {estimates.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Typography tone="muted" variant="small">
                  No effort estimates yet.
                </Typography>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Resource</th>
                      <th className="px-3 py-2 font-medium">Task</th>
                      <th className="px-3 py-2 font-medium">Hours</th>
                      <th className="px-3 py-2 font-medium">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.map((e) => (
                      <tr key={e.id} className="border-t border-neutral-100">
                        <td className="px-3 py-2">{memberLabel(e.workspaceMemberId)}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {e.taskId ? `${e.taskId.slice(0, 8)}…` : '—'}
                        </td>
                        <td className="px-3 py-2">{formatHours(e.estimatedHours)}</td>
                        <td className="px-3 py-2">{e.estimationMethod ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-neutral-200 bg-white">
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
            {actuals.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Typography tone="muted" variant="small">
                  No actual effort records yet.
                </Typography>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Resource</th>
                      <th className="px-3 py-2 font-medium">Hours</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actuals.map((a) => (
                      <tr key={a.id} className="border-t border-neutral-100">
                        <td className="px-3 py-2">{a.effortDate}</td>
                        <td className="px-3 py-2">{memberLabel(a.workspaceMemberId)}</td>
                        <td className="px-3 py-2">{formatHours(a.effortHours)}</td>
                        <td className="px-3 py-2">
                          <Badge
                            size="sm"
                            tone={
                              a.status === ActualEffortStatus.Cancelled ? 'neutral' : 'success'
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {a.status !== ActualEffortStatus.Cancelled ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelId(a.id)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Typography variant="caption" tone="muted" className="block px-4 py-2">
              To correct a mistake: cancel the old record, then create a replacement. Records are
              not deleted.
            </Typography>
          </section>
        </div>
      ) : (
        <section className="border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Snapshots ({snapshots.length})
            </Typography>
            <Button size="sm" variant="primary" loading={saving} onClick={() => void takeSnapshot()}>
              Take snapshot
            </Button>
          </div>
          {snapshots.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Typography tone="muted" variant="small">
                No workload snapshots yet.
              </Typography>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Allocated</th>
                    <th className="px-3 py-2 font-medium">Actual</th>
                    <th className="px-3 py-2 font-medium">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2">{s.snapshotDate}</td>
                      <td className="px-3 py-2">{formatHours(s.totalAllocatedHours)}</td>
                      <td className="px-3 py-2">{formatHours(s.totalActualHours)}</td>
                      <td className="px-3 py-2">{s.utilizationPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Resource
            </Typography>
            <Select
              value={estimateForm.workspaceMemberId}
              onValueChange={(v: string) =>
                setEstimateForm((f) => ({ ...f, workspaceMemberId: v }))
              }
              options={members.map((m) => ({ value: m.id, label: memberLabel(m.id) }))}
              placeholder="Select member"
            />
          </div>
          <Input
            label="Estimated hours"
            type="number"
            value={estimateForm.estimatedHours}
            onChange={(e) =>
              setEstimateForm((f) => ({ ...f, estimatedHours: e.target.value }))
            }
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
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Resource
            </Typography>
            <Select
              value={actualForm.workspaceMemberId}
              onValueChange={(v: string) =>
                setActualForm((f) => ({ ...f, workspaceMemberId: v }))
              }
              options={members.map((m) => ({ value: m.id, label: memberLabel(m.id) }))}
              placeholder="Select member"
            />
          </div>
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
