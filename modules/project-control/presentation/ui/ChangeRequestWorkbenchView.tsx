'use client'

import { useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import {
  Badge,
  Button,
  CurrencyAmount,
  Input,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'

import NextLink from 'next/link'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { FEATURES } from '@/config/features'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import {
  useChangeRequestWorkbench,
  type CrWorkbenchTab,
} from '../hooks/useChangeRequests'
import {
  canApplyChangeRequest,
  canApproveChangeRequest,
  canEditChangeRequest,
  canRejectChangeRequest,
  canSubmitChangeRequest,
  changeTypeLabel,
  crStatusLabel,
  crStatusTone,
  priorityTone,
} from '../../domain/rules/project-control.rules'
import { ChangeItemOperation, ScopeImpact, RiskImpact } from '../../domain/enums/project-control.enum'

const TABS: { id: CrWorkbenchTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'items', label: 'Items' },
  { id: 'impact', label: 'Impact' },
  { id: 'orders', label: 'Change orders' },
]

export function ChangeRequestWorkbenchView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const changeRequestId = params.changeRequestId as string

  const { project } = useProject(workspaceId, projectId)
  const h = useChangeRequestWorkbench(projectId, changeRequestId)

  const [itemSummary, setItemSummary] = useState('')
  const [itemOp, setItemOp] = useState<string>(ChangeItemOperation.Add)
  const [itemTargetType, setItemTargetType] = useState('TASK')
  const [orderCode, setOrderCode] = useState('')
  const [orderTitle, setOrderTitle] = useState('')

  const run = async (ok: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success(ok)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (h.loading && !h.cr) return <PageSkeleton variant="list" />
  if (h.forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this change request</Typography>
      </div>
    )
  }
  if (h.error || !h.cr) {
    return (
      <div className="border border-error/30 bg-error/5 p-4">
        <Typography variant="small" tone="error">
          {h.error ?? 'Change request not found'}
        </Typography>
        <NextLink
          href={ROUTES.workspace.projectChangeRequests(workspaceId, projectId)}
          className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          Back to Change Requests
        </NextLink>
      </div>
    )
  }

  const cr = h.cr
  const editable = canEditChangeRequest(cr)
  const currency = h.impact?.currencyCode ?? 'USD'

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current={cr.code}
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <NextLink
            href={ROUTES.workspace.projectChangeRequests(workspaceId, projectId)}
            className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            ← Change Requests
          </NextLink>
          <Typography as="h1" size="lg" weight="semibold">
            {cr.code} · {cr.title}
          </Typography>
          <div className="mt-2 flex flex-wrap items-center gap-sm">
            <Badge tone={crStatusTone(cr.status)}>{crStatusLabel(cr.status)}</Badge>
            <Badge size="sm" tone={priorityTone(cr.priority)}>
              {cr.priority}
            </Badge>
            <Typography variant="small" tone="muted">
              {changeTypeLabel(cr.changeType)}
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmitChangeRequest(cr) ? (
            <Button
              variant="secondary"
              onClick={() => void run('Submitted', () => h.lifecycle('submit'))}
            >
              Submit
            </Button>
          ) : null}
          {canApproveChangeRequest(cr) ? (
            <Button
              variant="primary"
              onClick={() => void run('Approved', () => h.lifecycle('approve'))}
            >
              Approve
            </Button>
          ) : null}
          {canRejectChangeRequest(cr) ? (
            <Button
              variant="ghost"
              onClick={() => {
                const reason = window.prompt('Rejection reason') ?? ''
                if (!reason.trim()) return
                void run('Rejected', () => h.lifecycle('reject', reason.trim()))
              }}
            >
              Reject
            </Button>
          ) : null}
          {canApplyChangeRequest(cr) ? (
            <Button
              variant="primary"
              disabled={!FEATURES.wave3CrApply}
              title={
                FEATURES.wave3CrApply
                  ? undefined
                  : 'Apply gated until atomic apply contract is confirmed'
              }
              onClick={() => {
                if (!FEATURES.wave3CrApply) {
                  toast.message('CR apply is gated (`wave3CrApply`) until BE confirms atomic apply')
                  return
                }
                if (!window.confirm('Apply this change request to the baseline?')) return
                void run('Applied', () => h.lifecycle('apply'))
              }}
            >
              Apply
            </Button>
          ) : null}
          {cr.status === 'DRAFT' || cr.status === 'SUBMITTED' ? (
            <Button
              variant="ghost"
              onClick={() => {
                if (!window.confirm('Cancel this change request?')) return
                void run('Cancelled', () => h.lifecycle('cancel'))
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {!FEATURES.wave3CrApply && canApplyChangeRequest(cr) ? (
        <div className="mb-4 border border-neutral-200 bg-neutral-50 px-3 py-2">
          <Typography variant="caption" tone="muted">
            Apply is disabled until `wave3CrApply` is enabled (atomic apply contract).
          </Typography>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => h.setTab(t.id)}
            className={
              h.tab === t.id
                ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary'
                : 'px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {h.tab === 'overview' ? (
        <div className="max-w-2xl space-y-3">
          <Typography variant="small" tone="muted">
            Baseline: <span className="font-mono text-xs">{cr.baselineId}</span>
          </Typography>
          <Typography variant="small">{cr.reason}</Typography>
          {cr.description ? (
            <Typography variant="small" tone="muted">
              {cr.description}
            </Typography>
          ) : null}
          {cr.rejectionReason ? (
            <Typography variant="small" tone="error">
              Rejected: {cr.rejectionReason}
            </Typography>
          ) : null}
          <Typography variant="caption" tone="muted">
            Items {h.items.length} · Orders {h.orders.length}
          </Typography>
        </div>
      ) : null}

      {h.tab === 'items' ? (
        <div>
          {editable ? (
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Select
                value={itemOp}
                onValueChange={setItemOp}
                options={[
                  { value: ChangeItemOperation.Add, label: 'Add' },
                  { value: ChangeItemOperation.Modify, label: 'Modify' },
                  { value: ChangeItemOperation.Remove, label: 'Remove' },
                ]}
              />
              <Input
                label="Target type"
                value={itemTargetType}
                onChange={(e) => setItemTargetType(e.target.value)}
              />
              <Input
                label="Summary"
                value={itemSummary}
                onChange={(e) => setItemSummary(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() =>
                  void run('Item added', async () => {
                    await h.addItem({
                      targetType: itemTargetType.trim() || 'TASK',
                      operation: itemOp as typeof ChangeItemOperation.Add,
                      summary: itemSummary.trim(),
                    })
                    setItemSummary('')
                  })
                }
              >
                Add item
              </Button>
            </div>
          ) : null}
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Operation</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {h.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No items
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  h.items.map((item) => (
                    <tr key={item.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">{item.operation}</td>
                      <td className="px-4 py-3">
                        {item.targetType}
                        {item.targetId ? (
                          <span className="ml-1 font-mono text-xs text-neutral-500">
                            {item.targetId.slice(0, 8)}…
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">{item.summary}</td>
                      <td className="px-4 py-3">
                        {editable ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void run('Item deleted', () => h.removeItem(item.id))
                            }
                          >
                            Delete
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {h.tab === 'impact' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void run('Impact calculated', () => h.calculateImpact())}
            >
              Calculate impact
            </Button>
            {editable ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void run('Impact saved', () =>
                    h.saveImpact({
                      currencyCode: currency,
                      scopeImpact: ScopeImpact.Increase,
                      scheduleImpactDays: h.impact?.scheduleImpactDays ?? 0,
                      estimateHoursImpact: h.impact?.estimateHoursImpact ?? 0,
                      laborCostImpact: h.impact?.laborCostImpact ?? 0,
                      revenueImpact: h.impact?.revenueImpact ?? 0,
                      grossMarginImpact: h.impact?.grossMarginImpact ?? 0,
                      riskImpact: (h.impact?.riskImpact as typeof RiskImpact.Medium) ?? RiskImpact.Medium,
                    })
                  )
                }
              >
                Save stub impact
              </Button>
            ) : null}
          </div>
          {h.impact ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ImpactCard label="Scope" value={String(h.impact.scopeImpact)} />
              <ImpactCard
                label="Schedule days"
                value={String(h.impact.scheduleImpactDays ?? '—')}
              />
              <ImpactCard
                label="Hours"
                value={String(h.impact.estimateHoursImpact ?? '—')}
              />
              <ImpactCard
                label="Labor cost"
                value={
                  h.impact.laborCostImpact != null ? (
                    <CurrencyAmount
                      amount={h.impact.laborCostImpact}
                      currency={currency}
                      size="sm"
                    />
                  ) : (
                    '—'
                  )
                }
              />
              <ImpactCard
                label="Revenue"
                value={
                  h.impact.revenueImpact != null ? (
                    <CurrencyAmount
                      amount={h.impact.revenueImpact}
                      currency={currency}
                      size="sm"
                    />
                  ) : (
                    '—'
                  )
                }
              />
              <ImpactCard label="Risk" value={String(h.impact.riskImpact)} />
            </div>
          ) : (
            <Typography variant="small" tone="muted">
              No impact yet — calculate or enter values.
            </Typography>
          )}
        </div>
      ) : null}

      {h.tab === 'orders' ? (
        <div>
          {editable || cr.status === 'APPROVED' ? (
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Input
                label="Code"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="CO-001"
              />
              <Input
                label="Title"
                value={orderTitle}
                onChange={(e) => setOrderTitle(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  void run('Change order created', async () => {
                    await h.addOrder({
                      code: orderCode.trim(),
                      title: orderTitle.trim(),
                    })
                    setOrderCode('')
                    setOrderTitle('')
                  })
                }
              >
                Create order
              </Button>
            </div>
          ) : null}
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {h.orders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No change orders
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  h.orders.map((o) => (
                    <tr key={o.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">{o.code}</td>
                      <td className="px-4 py-3">{o.title}</td>
                      <td className="px-4 py-3">
                        <Badge size="sm" tone="info">
                          {o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ImpactCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-neutral-200 p-3">
      <Typography variant="overline" tone="muted">
        {label}
      </Typography>
      <div className="mt-1">{value}</div>
    </div>
  )
}
