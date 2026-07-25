'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Checkbox,
  CurrencyAmount,
  Input,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import NextLink from 'next/link'
import { Check, Circle, Loader2, MoreHorizontal, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { FEATURES } from '@/config/features'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { cn } from '@/utils/cn'
import { useChangeRequestWorkbench } from '../hooks/useChangeRequests'
import {
  canApplyChangeRequest,
  canApproveChangeRequest,
  canEditChangeRequest,
  canRejectChangeRequest,
  canSubmitChangeRequest,
  changeItemOperationLabel,
  changeItemTargetLabel,
  affectedAreaLabel,
  changeTypeLabel,
  crStatusLabel,
  crStatusTone,
  getCrNextStepHint,
  getCrSubmitBlockers,
  getCrWorkflowPhase,
  isCrReadyToSubmit,
  priorityLabel,
  shouldShowImplementationPlan,
  type CrWorkflowPhase,
} from '../../domain/rules/project-control.rules'
import { ChangePriority } from '../../domain/enums/project-control.enum'
import type {
  ChangeImpact,
  ChangeOrder,
  ChangeRequest,
  ChangeRequestItem,
} from '../../domain/model/project-control'
import { AddChangeDrawer } from './AddChangeDrawer'

const STEPS: { id: CrWorkflowPhase; label: string; sectionId: string }[] = [
  { id: 'details', label: '1 Request', sectionId: 'cr-request-details' },
  { id: 'changes', label: '2 Changes', sectionId: 'cr-proposed-changes' },
  { id: 'impact', label: '3 Impact', sectionId: 'cr-impact-analysis' },
  { id: 'review', label: '4 Review', sectionId: 'cr-review-submit' },
]

const IMPACT_PROGRESS_STEPS = [
  'Compared proposed changes',
  'Mapped affected Functions and Tasks',
  'Checked schedule and effort impact',
  'Summarized overall risk',
]

function formatSavedLabel(lastSavedAt: Date | null, updatedAt: string): string {
  const ref = lastSavedAt ?? new Date(updatedAt)
  const seconds = Math.max(0, Math.round((Date.now() - ref.getTime()) / 1000))
  if (seconds < 20) return 'Saved just now'
  if (seconds < 60) return `Saved ${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `Saved ${minutes}m ago`
  return `Saved ${ref.toLocaleString()}`
}

export function ChangeRequestWorkbenchView() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const changeRequestId = params.changeRequestId as string

  const { project } = useProject(workspaceId, projectId)
  const h = useChangeRequestWorkbench(projectId, changeRequestId)

  const [title, setTitle] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>(ChangePriority.Medium)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [impactTick, setImpactTick] = useState(0)

  useEffect(() => {
    if (!h.cr) return
    setTitle(h.cr.title)
    setReason(h.cr.reason)
    setDescription(h.cr.description ?? '')
    setPriority(h.cr.priority)
  }, [h.cr])

  useEffect(() => {
    setSelectedItemIds(new Set(h.items.map((i) => i.id)))
  }, [h.items])

  useEffect(() => {
    if (!h.analyzingImpact) {
      setImpactTick(0)
      return
    }
    const id = window.setInterval(() => {
      setImpactTick((t) => Math.min(t + 1, IMPACT_PROGRESS_STEPS.length))
    }, 700)
    return () => window.clearInterval(id)
  }, [h.analyzingImpact])

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
  const listHref = ROUTES.workspace.projectChangeRequests(workspaceId, projectId)
  const blockers = getCrSubmitBlockers(cr, h.items, h.impact)
  const readyToSubmit = isCrReadyToSubmit(cr, h.items, h.impact)
  const phase = getCrWorkflowPhase(cr, h.items, h.impact)
  const nextHint = getCrNextStepHint(cr, h.items, h.impact)
  const showPlan = shouldShowImplementationPlan(cr)
  const currency = h.impact?.currencyCode ?? 'USD'
  const selectedCount = [...selectedItemIds].filter((id) =>
    h.items.some((i) => i.id === id)
  ).length

  const dirty =
    editable &&
    (title !== cr.title ||
      reason !== cr.reason ||
      description !== (cr.description ?? '') ||
      priority !== cr.priority)

  const saveDraft = async () => {
    if (!editable) return
    setSaving(true)
    try {
      await h.saveDraft({
        title: title.trim() || cr.title,
        reason: reason.trim() || cr.reason,
        description: description.trim() || null,
        priority: priority as typeof ChangePriority.Medium,
      })
      toast.success('Draft saved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const scrollTo = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pb-24">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current={cr.code}
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <NextLink
            href={listHref}
            className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            ← Change Requests
          </NextLink>
          <Typography as="h1" size="lg" weight="semibold">
            {cr.title}
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1 font-mono">
            {cr.code}
          </Typography>
          <div className="mt-2 flex flex-wrap items-center gap-sm">
            <Badge variant="solid" tone={crStatusTone(cr.status)}>
              {crStatusLabel(cr.status)}
            </Badge>
            <Typography variant="small" tone="muted">
              · {priorityLabel(cr.priority)} priority
            </Typography>
            <Typography variant="small" tone="muted">
              · {changeTypeLabel(cr.changeType)}
            </Typography>
          </div>
          <Typography variant="caption" tone="muted" className="mt-2 block">
            {formatSavedLabel(h.lastSavedAt, cr.updatedAt)}
            {dirty ? ' · Unsaved changes' : ''}
          </Typography>
          <Typography variant="small" className="mt-2">
            <span className="text-neutral-500">Next step</span> · {nextHint}
          </Typography>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => router.push(listHref)}>
            Close
          </Button>
          {editable ? (
            <Button
              variant="secondary"
              loading={saving}
              disabled={!dirty && !saving}
              onClick={() => void saveDraft()}
            >
              Save draft
            </Button>
          ) : null}
          {canSubmitChangeRequest(cr) ? (
            <Button
              variant="primary"
              disabled={!readyToSubmit}
              title={
                readyToSubmit
                  ? 'Submit this change request for review'
                  : `Missing: ${blockers.join(', ')}`
              }
              onClick={() => void run('Submitted for review', () => h.lifecycle('submit'))}
            >
              Submit for review
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
                const rejection = window.prompt('Rejection reason') ?? ''
                if (!rejection.trim()) return
                void run('Rejected', () => h.lifecycle('reject', rejection.trim()))
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
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                icon={<MoreHorizontal size={16} />}
                aria-label="More actions"
                onClick={() => setMoreOpen((o) => !o)}
              />
              {moreOpen ? (
                <div className="absolute right-0 z-20 mt-1 min-w-[220px] border border-neutral-200 bg-white py-1 shadow-md">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-neutral-50"
                    onClick={() => {
                      setMoreOpen(false)
                      if (!window.confirm('Cancel this change request?')) return
                      void run('Change request cancelled', () => h.lifecycle('cancel'))
                    }}
                  >
                    Cancel change request
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <nav
        className="mb-6 flex flex-wrap items-center gap-1 border border-neutral-200 bg-white px-3 py-2"
        aria-label="Change request workflow"
      >
        {STEPS.map((step, index) => {
          const activeIndex = STEPS.findIndex((s) => s.id === phase)
          const done = index < activeIndex
          const current = step.id === phase
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => scrollTo(step.sectionId)}
              className={cn(
                'px-3 py-1.5 text-sm',
                current && 'bg-primary text-white',
                done && !current && 'text-primary',
                !done && !current && 'text-neutral-500'
              )}
            >
              {step.label}
              {index < STEPS.length - 1 ? (
                <span className="ml-2 text-neutral-300" aria-hidden>
                  —
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-8">
          <section id="cr-request-details" className="scroll-mt-4 border border-neutral-200 bg-white p-5">
            <Typography as="h2" weight="semibold" className="mb-4">
              1. Request details
            </Typography>
            {editable ? (
              <div className="space-y-4">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  label="Reason for change"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                />
                <Textarea
                  label="Expected outcome"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What should be true after this change is applied?"
                />
                <div>
                  <Typography variant="caption" tone="muted" className="mb-1 block">
                    Priority
                  </Typography>
                  <Select
                    value={priority}
                    onValueChange={setPriority}
                    options={[
                      { value: ChangePriority.Low, label: 'Low' },
                      { value: ChangePriority.Medium, label: 'Medium' },
                      { value: ChangePriority.High, label: 'High' },
                      { value: ChangePriority.Critical, label: 'Critical' },
                    ]}
                  />
                </div>
                <div>
                  <Typography variant="caption" tone="muted" className="mb-1 block">
                    Source
                  </Typography>
                  <Typography variant="small">{changeTypeLabel(cr.changeType)}</Typography>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <DetailRow label="Reason" value={cr.reason} />
                {cr.description ? (
                  <DetailRow label="Expected outcome" value={cr.description} />
                ) : null}
                <DetailRow label="Priority" value={priorityLabel(cr.priority)} />
                <DetailRow label="Source" value={changeTypeLabel(cr.changeType)} />
                {cr.rejectionReason ? (
                  <DetailRow label="Rejection reason" value={cr.rejectionReason} />
                ) : null}
              </div>
            )}
            <details className="mt-4 border-t border-neutral-100 pt-3">
              <summary className="cursor-pointer text-sm text-neutral-500">
                More details
              </summary>
              <div className="mt-2 space-y-1">
                <Typography variant="caption" tone="muted" className="font-mono block">
                  Baseline ID: {cr.baselineId}
                </Typography>
                <Typography variant="caption" tone="muted" className="font-mono block">
                  CR ID: {cr.id}
                </Typography>
              </div>
            </details>
          </section>

          <section id="cr-proposed-changes" className="scroll-mt-4 border border-neutral-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Typography as="h2" weight="semibold">
                2. Proposed changes
              </Typography>
              <Typography variant="small" tone="muted">
                {h.items.length}
              </Typography>
            </div>
            {editable ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus size={14} />}
                className="mb-4"
                onClick={() => setDrawerOpen(true)}
              >
                Add change
              </Button>
            ) : null}
            {h.items.length === 0 ? (
              <EmptyState
                title="No proposed changes yet"
                body="Add the Functions, Tasks or schedule changes included in this request."
                action={
                  editable ? (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Plus size={14} />}
                      onClick={() => setDrawerOpen(true)}
                    >
                      Add first change
                    </Button>
                  ) : null
                }
              />
            ) : (
              <ul className="divide-y divide-neutral-100 border border-neutral-100">
                {h.items.map((item) => (
                  <ProposedChangeRow
                    key={item.id}
                    item={item}
                    editable={editable}
                    onRemove={() =>
                      void run('Change removed', () => h.removeItem(item.id))
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          <section id="cr-impact-analysis" className="scroll-mt-4 border border-neutral-200 bg-white p-5">
            <Typography as="h2" weight="semibold" className="mb-4">
              3. Impact analysis
            </Typography>

            {h.analyzingImpact ? (
              <ImpactProgress activeIndex={impactTick} />
            ) : null}

            {!h.analyzingImpact && !h.impact ? (
              <div className="space-y-4">
                {h.items.length === 0 ? (
                  <EmptyState
                    title="Impact has not been analyzed"
                    body="Add at least one proposed change, then run impact analysis."
                    action={
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => scrollTo('cr-proposed-changes')}
                      >
                        Go to Proposed changes
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <Typography variant="small" tone="muted">
                      Scopery will analyze:
                    </Typography>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                      <li>Affected Functions and versions</li>
                      <li>Related Tasks and effort</li>
                      <li>Schedule and completion date shifts</li>
                      <li>Cost, revenue and risk impact</li>
                    </ul>
                    <Button
                      variant="primary"
                      onClick={() =>
                        void run('Impact analyzed', () => h.calculateImpact())
                      }
                    >
                      Analyze impact
                    </Button>
                  </>
                )}
              </div>
            ) : null}

            {!h.analyzingImpact && h.impact ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Typography variant="small" tone="muted">
                    Overall impact · {String(h.impact.riskImpact)}
                  </Typography>
                  {editable ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void run('Impact recalculated', () => h.calculateImpact())
                      }
                    >
                      Recalculate
                    </Button>
                  ) : null}
                </div>
                <ImpactSummary impact={h.impact} currency={currency} />

                <div>
                  <Typography weight="medium" className="mb-2">
                    Suggested change review ({selectedCount} of {h.items.length} selected)
                  </Typography>
                  <Typography variant="caption" tone="muted" className="mb-3 block">
                    Confirm which proposed changes should stay in this request before
                    submitting. Detailed Task-level suggestions appear here when the
                    analysis returns them.
                  </Typography>
                  <ul className="divide-y divide-neutral-100 border border-neutral-100">
                    {h.items.map((item) => {
                      const checked = selectedItemIds.has(item.id)
                      return (
                        <li key={item.id} className="flex gap-3 px-3 py-3">
                          <Checkbox
                            checked={checked}
                            disabled={!editable}
                            onChange={(e) => {
                              const next = new Set(selectedItemIds)
                              if (e.target.checked) next.add(item.id)
                              else next.delete(item.id)
                              setSelectedItemIds(next)
                            }}
                          />
                          <div className="min-w-0">
                            <Typography variant="caption" className="uppercase tracking-wide">
                              {changeItemOperationLabel(item.operation)}{' '}
                              {changeItemTargetLabel(item.targetType)}
                            </Typography>
                            <Typography variant="small">{item.summary}</Typography>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>

          <section id="cr-review-submit" className="scroll-mt-4 border border-neutral-200 bg-white p-5">
            <Typography as="h2" weight="semibold" className="mb-4">
              4. Review and submit
            </Typography>
            <ReviewChecklist
              cr={cr}
              itemCount={h.items.length}
              impact={h.impact}
              blockers={blockers}
            />
            {canSubmitChangeRequest(cr) ? (
              <div className="mt-4 space-y-2">
                {!readyToSubmit ? (
                  <div className="border border-warning/40 bg-warning/5 px-3 py-2">
                    <Typography variant="small" weight="medium">
                      Submit for review is disabled
                    </Typography>
                    <ul className="mt-1 list-disc pl-5 text-sm text-neutral-700">
                      {blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Button
                  variant="primary"
                  disabled={!readyToSubmit}
                  onClick={() =>
                    void run('Submitted for review', () => h.lifecycle('submit'))
                  }
                >
                  Submit for review
                </Button>
              </div>
            ) : (
              <Typography variant="small" tone="muted" className="mt-2">
                Status: {crStatusLabel(cr.status)}. Use header actions for the next
                lifecycle step.
              </Typography>
            )}
          </section>

          {showPlan ? (
            <section className="border border-neutral-200 bg-white p-5">
              <Typography as="h2" weight="semibold" className="mb-4">
                Implementation plan
              </Typography>
              <ImplementationPlan orders={h.orders} />
            </section>
          ) : null}
        </div>

        <aside className="h-fit border border-neutral-200 bg-white p-4 lg:sticky lg:top-4">
          <Typography variant="overline" tone="muted" className="mb-3 block">
            Request summary
          </Typography>
          <dl className="space-y-2 text-sm">
            <SummaryRow label="Status" value={crStatusLabel(cr.status)} />
            <SummaryRow label="Priority" value={priorityLabel(cr.priority)} />
            <SummaryRow label="Source" value={changeTypeLabel(cr.changeType)} />
            <SummaryRow label="Changes" value={String(h.items.length)} />
            <SummaryRow
              label="Schedule"
              value={
                h.impact?.scheduleImpactDays != null
                  ? `${h.impact.scheduleImpactDays >= 0 ? '+' : ''}${h.impact.scheduleImpactDays} days`
                  : '—'
              }
            />
            <SummaryRow
              label="Risk"
              value={h.impact ? String(h.impact.riskImpact) : '—'}
            />
          </dl>
          {blockers.length > 0 && canSubmitChangeRequest(cr) ? (
            <div className="mt-4 border-t border-neutral-100 pt-3">
              <Typography variant="caption" tone="muted" className="mb-1 block">
                Missing
              </Typography>
              <ul className="list-disc space-y-1 pl-4 text-sm text-neutral-700">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {editable ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => router.push(listHref)}>
              Close
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                loading={saving}
                onClick={() => void saveDraft()}
              >
                Save draft
              </Button>
              <Button
                variant="primary"
                disabled={!readyToSubmit}
                title={
                  readyToSubmit ? undefined : `Missing: ${blockers.join(', ')}`
                }
                onClick={() =>
                  void run('Submitted for review', () => h.lifecycle('submit'))
                }
              >
                Submit for review
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AddChangeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (payload) => {
          await run('Change added', () => h.addItem(payload))
        }}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography variant="caption" tone="muted" className="block">
        {label}
      </Typography>
      <Typography variant="small">{value}</Typography>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{value}</dd>
    </div>
  )
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center">
      <Typography weight="medium">{title}</Typography>
      <Typography variant="small" tone="muted" className="mt-1">
        {body}
      </Typography>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

function ProposedChangeRow({
  item,
  editable,
  onRemove,
}: {
  item: ChangeRequestItem
  editable: boolean
  onRemove: () => void
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography
            variant="caption"
            className="uppercase tracking-wide text-neutral-500"
          >
            {changeItemOperationLabel(item.operation)}{' '}
            {changeItemTargetLabel(item.targetType)}
          </Typography>
          <Typography variant="small" className="mt-1">
            {item.summary}
          </Typography>
          {item.affectedAreas && item.affectedAreas.length > 0 ? (
            <Typography variant="caption" tone="muted" className="mt-2 block">
              Changed areas ·{' '}
              {item.affectedAreas.map(affectedAreaLabel).join(' · ')}
            </Typography>
          ) : null}
        </div>
        {editable ? (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </div>
    </li>
  )
}

function ImpactProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-primary" />
        <Typography weight="medium">Analyzing proposed changes…</Typography>
      </div>
      <ul className="space-y-2">
        {IMPACT_PROGRESS_STEPS.map((label, i) => {
          const done = i < activeIndex
          const current = i === activeIndex
          return (
            <li key={label} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check size={14} className="text-success" />
              ) : current ? (
                <Loader2 size={14} className="animate-spin text-primary" />
              ) : (
                <Circle size={14} className="text-neutral-300" />
              )}
              <span className={done || current ? 'text-neutral-900' : 'text-neutral-400'}>
                {label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ImpactSummary({
  impact,
  currency,
}: {
  impact: ChangeImpact
  currency: string
}) {
  const cards: { label: string; value: ReactNode }[] = [
    { label: 'Scope', value: String(impact.scopeImpact) },
    {
      label: 'Schedule',
      value:
        impact.scheduleImpactDays != null
          ? `${impact.scheduleImpactDays >= 0 ? '+' : ''}${impact.scheduleImpactDays} days`
          : '—',
    },
    {
      label: 'Hours',
      value:
        impact.estimateHoursImpact != null
          ? String(impact.estimateHoursImpact)
          : '—',
    },
    {
      label: 'Labor cost',
      value:
        impact.laborCostImpact != null ? (
          <CurrencyAmount amount={impact.laborCostImpact} currency={currency} size="sm" />
        ) : (
          '—'
        ),
    },
    {
      label: 'Revenue',
      value:
        impact.revenueImpact != null ? (
          <CurrencyAmount amount={impact.revenueImpact} currency={currency} size="sm" />
        ) : (
          '—'
        ),
    },
    { label: 'Risk', value: String(impact.riskImpact) },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="border border-neutral-200 p-3">
          <Typography variant="overline" tone="muted">
            {c.label}
          </Typography>
          <div className="mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  )
}

function ReviewChecklist({
  cr,
  itemCount,
  impact,
  blockers,
}: {
  cr: ChangeRequest
  itemCount: number
  impact: ChangeImpact | null
  blockers: string[]
}) {
  const rows = [
    { ok: Boolean(cr.reason.trim()), label: 'Request reason provided' },
    { ok: itemCount > 0, label: 'At least one proposed change' },
    { ok: impact != null, label: 'Impact analysis completed' },
    { ok: blockers.length === 0, label: 'Ready for review' },
  ]

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-2 text-sm">
          {row.ok ? (
            <Check size={14} className="text-success" />
          ) : (
            <Circle size={14} className="text-neutral-300" />
          )}
          {row.label}
        </li>
      ))}
    </ul>
  )
}

function ImplementationPlan({ orders }: { orders: ChangeOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No implementation plan yet"
        body="The plan will be generated after this Change Request is approved. Manual orders may appear here once created by the system or project control."
      />
    )
  }

  return (
    <ul className="divide-y divide-neutral-100 border border-neutral-100">
      {orders.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <Typography weight="medium">
              {o.code} · {o.title}
            </Typography>
            {o.description ? (
              <Typography variant="small" tone="muted">
                {o.description}
              </Typography>
            ) : null}
          </div>
          <Badge size="sm" variant="solid" tone="info">
            {o.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
