'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button, Checkbox, Typography } from '@/shared/ui'
import { apiClient } from '@/shared/lib/apiClient'
import { getApiOrigin } from '@/shared/lib/api-paths'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { ActionPlanSummary } from '../hooks/aiMessageStream.reducer'

// ─── Tool config ──────────────────────────────────────────────────────────────

interface ToolConfig {
  cardTitle: string
  itemLabel: string
  badge: string
  extraFields: (hints: Record<string, string>) => Array<{ label: string; value: string }>
}

const TOOL_CONFIG: Record<string, ToolConfig> = {
  create_task: {
    cardTitle: 'Suggested tasks',
    itemLabel: 'Task',
    badge: 'Task',
    extraFields: (h) => [
      h.phaseTitle ? { label: 'Phase', value: h.phaseTitle } : null,
      h.priority ? { label: 'Priority', value: h.priority } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  update_task_status: {
    cardTitle: 'Update task status',
    itemLabel: 'Task',
    badge: 'Task',
    extraFields: (h) => [
      h.currentStatus ? { label: 'Current', value: h.currentStatus } : null,
      h.newStatus ? { label: 'New status', value: h.newStatus } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_functional_item: {
    cardTitle: 'Suggested functional items',
    itemLabel: 'Functional item',
    badge: 'FR',
    extraFields: (h) => [
      h.type ? { label: 'Type', value: h.type } : null,
      h.priority ? { label: 'Priority', value: h.priority } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_non_functional_item: {
    cardTitle: 'Suggested NFRs',
    itemLabel: 'NFR',
    badge: 'NFR',
    extraFields: (h) => [
      h.category ? { label: 'Category', value: h.category } : null,
      h.targetMetric ? { label: 'Target', value: h.targetMetric } : null,
      h.priority ? { label: 'Priority', value: h.priority } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_requirement: {
    cardTitle: 'Suggested requirements',
    itemLabel: 'Requirement',
    badge: 'REQ',
    extraFields: (h) => [
      h.requirementType ? { label: 'Type', value: h.requirementType } : null,
      h.priority ? { label: 'Priority', value: h.priority } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_scope_item: {
    cardTitle: 'Suggested scope items',
    itemLabel: 'Scope item',
    badge: 'Scope',
    extraFields: (h) => [
      h.type ? { label: 'Type', value: h.type } : null,
      h.priority ? { label: 'Priority', value: h.priority } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_screen: {
    cardTitle: 'Suggested screens',
    itemLabel: 'Screen',
    badge: 'Screen',
    extraFields: (h) => [
      (h.routePath ?? h.screenPath ?? h.path) ? { label: 'Path', value: h.routePath ?? h.screenPath ?? h.path } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_api_endpoint: {
    cardTitle: 'Suggested API endpoints',
    itemLabel: 'Endpoint',
    badge: 'API',
    extraFields: (h) => [
      h.method ? { label: 'Method', value: h.method } : null,
      h.pathPattern ? { label: 'Path', value: h.pathPattern } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_app_module: {
    cardTitle: 'Suggested modules',
    itemLabel: 'Module',
    badge: 'Module',
    extraFields: (h) => [
      (h.name ?? h.title) ? { label: 'Name', value: h.name ?? h.title } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_data_entity: {
    cardTitle: 'Suggested data entities',
    itemLabel: 'Data entity',
    badge: 'Entity',
    extraFields: (h) => [
      h.tableName ? { label: 'Table', value: h.tableName } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_app_component: {
    cardTitle: 'Suggested components',
    itemLabel: 'Component',
    badge: 'Comp',
    extraFields: (h) => [
      h.componentType ? { label: 'Type', value: h.componentType } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_wbs_node: {
    cardTitle: 'Suggested planning elements',
    itemLabel: 'Planning element',
    badge: 'Plan',
    extraFields: (h) => [
      h.nodeType ? { label: 'Type', value: h.nodeType } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
  create_project_phase: {
    cardTitle: 'Suggested project phases',
    itemLabel: 'Phase',
    badge: 'Phase',
    extraFields: (h) => [
      (h.name ?? h.title) ? { label: 'Name', value: h.name ?? h.title } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  },
}

function getToolConfig(toolCode: string | undefined): ToolConfig {
  return TOOL_CONFIG[toolCode ?? ''] ?? {
    cardTitle: 'Suggested actions',
    itemLabel: 'Item',
    badge: toolCode ?? 'Action',
    extraFields: () => [],
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskState = 'streaming' | 'ready' | 'creating' | 'created' | 'failed'

interface TaskItem {
  plan: ActionPlanSummary
  state: TaskState
  selected: boolean
  errorMsg?: string
}

// ─── Progressive reveal ───────────────────────────────────────────────────────

function useProgressiveReveal(text: string, active: boolean): string {
  const [revealed, setRevealed] = useState('')
  const rafRef = useRef<number | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!active || !text) { setRevealed(text); return }
    indexRef.current = 0
    setRevealed('')
    const CHARS_PER_FRAME = 4
    const tick = () => {
      indexRef.current = Math.min(indexRef.current + CHARS_PER_FRAME, text.length)
      setRevealed(text.slice(0, indexRef.current))
      if (indexRef.current < text.length) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [text, active])

  return active ? revealed : text
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({
  item,
  index,
  onToggle,
  isAnimating,
}: {
  item: TaskItem
  index: number
  onToggle: () => void
  isAnimating: boolean
}) {
  const hints = item.plan.displayHints ?? {}
  const config = getToolConfig(item.plan.toolCode)
  const title = hints.title ?? item.plan.summary
  const description = hints.description ?? ''
  const extraFields = config.extraFields(hints)
  const revealedDesc = useProgressiveReveal(description, isAnimating)

  const isStreaming = item.state === 'streaming'
  const isCreating = item.state === 'creating'
  const isDone = item.state === 'created'
  const isFailed = item.state === 'failed'

  return (
    <div
      className="px-4 py-3 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDuration: `${140 + index * 30}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          {isDone ? (
            <CheckCircle2 size={16} className="text-success" />
          ) : isFailed ? (
            <XCircle size={16} className="text-error" />
          ) : isCreating ? (
            <Loader2 size={14} className="animate-spin text-neutral-400" />
          ) : isStreaming ? (
            <span className="text-sm text-neutral-400 select-none">◌</span>
          ) : (
            <Checkbox
              size="md"
              checked={item.selected}
              onChange={onToggle}
              aria-label={item.selected ? 'Deselect' : 'Select'}
              className="shadow-none [&_input]:shadow-none [&_input]:focus:shadow-none [&_input]:focus:ring-0"
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {isStreaming ? (
            <Typography variant="small" tone="muted" className="animate-pulse">
              Generating…
            </Typography>
          ) : (
            <>
              {/* Badge + title */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                  {config.badge}
                </span>
                <Typography
                  variant="small"
                  className="font-semibold leading-snug"
                  style={isDone ? { opacity: 0.5 } : undefined}
                >
                  {title}
                </Typography>
              </div>

              {/* Type-specific fields */}
              {extraFields.length > 0 && (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  {extraFields.map((f) => (
                    <Typography key={f.label} variant="caption" tone="muted">
                      {f.label}: <span className="font-medium">{f.value}</span>
                    </Typography>
                  ))}
                </div>
              )}

              {/* Description */}
              {description && !isDone && (
                <Typography
                  variant="small"
                  tone="muted"
                  className="mt-1 leading-relaxed whitespace-pre-wrap"
                  style={{ fontSize: 12, lineHeight: 1.5 }}
                >
                  {revealedDesc}
                </Typography>
              )}

              {/* Error */}
              {isFailed && item.errorMsg && (
                <Typography variant="caption" tone="error" className="mt-1">
                  {item.errorMsg}
                </Typography>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface ActionConfirmationCardProps {
  plans: ActionPlanSummary[]
  isStreaming: boolean
  onDismiss: (planId: string) => void
}

export function ActionConfirmationCard({ plans, isStreaming, onDismiss }: ActionConfirmationCardProps) {
  const base = `${getApiOrigin()}/api/ai-actions/plans`

  const [items, setItems] = useState<TaskItem[]>([])
  const [creating, setCreating] = useState(false)
  const [completionSummary, setCompletionSummary] = useState<string | null>(null)
  const [totalToCreate, setTotalToCreate] = useState(0)
  const prevPlanIdsRef = useRef<Set<string>>(new Set())

  // Sync plans → items
  useEffect(() => {
    setItems((prev) => {
      const prevMap = new Map(prev.map((i) => [i.plan.planId, i]))
      const updated = plans.map((plan) => {
        if (prevMap.has(plan.planId)) return prevMap.get(plan.planId)!
        return { plan, state: 'streaming' as TaskState, selected: true }
      })
      const result = updated.map((item) => {
        if (item.state === 'streaming' && prevPlanIdsRef.current.has(item.plan.planId)) {
          return { ...item, state: 'ready' as TaskState }
        }
        return item
      })
      prevPlanIdsRef.current = new Set(plans.map((p) => p.planId))
      return result
    })
  }, [plans])

  // Transition streaming → ready after short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => item.state === 'streaming' ? { ...item, state: 'ready' } : item)
      )
    }, 600)
    return () => clearTimeout(timer)
  }, [plans.length])

  const toggle = useCallback((planId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.plan.planId === planId && item.state === 'ready'
          ? { ...item, selected: !item.selected }
          : item
      )
    )
  }, [])

  const selectedItems = items.filter((i) => i.state === 'ready' && i.selected)
  const readyCount = items.filter((i) => i.state === 'ready').length
  const streamingCount = items.filter((i) => i.state === 'streaming').length
  const doneCount = items.filter((i) => i.state === 'created').length

  const handleCreate = async () => {
    if (selectedItems.length === 0 || creating) return
    setCreating(true)
    setTotalToCreate(selectedItems.length)

    let successCount = 0
    let failCount = 0

    for (const item of selectedItems) {
      setItems((prev) =>
        prev.map((i) => i.plan.planId === item.plan.planId ? { ...i, state: 'creating' } : i)
      )
      try {
        const confirmResult = await apiClient.post<{ id: string }>(
          `${base}/${item.plan.planId}/confirm`,
          { planHash: item.plan.planHash, expectedPlanVersion: item.plan.planVersion ?? 1 }
        )
        await apiClient.post(
          `${base}/${item.plan.planId}/execute`,
          { planHash: item.plan.planHash, confirmationId: confirmResult?.id ?? null },
          { parseJson: false }
        )
        successCount++
        setItems((prev) =>
          prev.map((i) =>
            i.plan.planId === item.plan.planId ? { ...i, state: 'created', selected: false } : i
          )
        )
      } catch (err) {
        failCount++
        const msg = getProblemToastMessage(err)
        setItems((prev) =>
          prev.map((i) =>
            i.plan.planId === item.plan.planId ? { ...i, state: 'failed', errorMsg: msg } : i
          )
        )
      }
    }

    setCreating(false)
    setTotalToCreate(0)

    // Show completion summary
    const parts: string[] = []
    if (successCount > 0) parts.push(`${successCount} created`)
    if (failCount > 0) parts.push(`${failCount} failed`)
    if (parts.length > 0) setCompletionSummary(parts.join(' · '))

    // Dismiss created items after showing summary
    setTimeout(() => {
      setCompletionSummary(null)
      setItems((prev) => {
        const toRemove = prev.filter((i) => i.state === 'created').map((i) => i.plan.planId)
        toRemove.forEach((id) => onDismiss(id))
        return prev.filter((i) => i.state !== 'created')
      })
    }, 2500)
  }

  const handleDismissAll = async () => {
    const toCancel = items.filter((i) => i.state === 'ready' || i.state === 'failed')
    for (const item of toCancel) {
      try {
        await apiClient.post(`${base}/${item.plan.planId}/cancel`, {}, { parseJson: false })
      } catch { /* best-effort */ }
      onDismiss(item.plan.planId)
    }
  }

  if (items.length === 0) return null
  if (items.every((i) => i.state === 'created') && !completionSummary) return null

  const isBusy = creating || items.some((i) => i.state === 'creating')

  // Determine card title from toolCodes
  const toolCodes = [...new Set(plans.map((p) => p.toolCode).filter(Boolean))]
  const cardTitle =
    toolCodes.length === 1 ? getToolConfig(toolCodes[0]).cardTitle : 'Suggested actions'

  const cardSubtitle =
    toolCodes.length === 1
      ? `Review and select the items you want to create.`
      : `Review and select the actions you want to execute.`

  return (
    <div className="border border-neutral-500 bg-card overflow-hidden mb-3">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-neutral-500">
        <Typography className="font-semibold" style={{ fontSize: 13 }}>
          {cardTitle}
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          {cardSubtitle}
        </Typography>
      </div>

      {/* Item list */}
      <div className="divide-y divide-border">
        {items.map((item, index) => (
          <TaskRow
            key={item.plan.planId}
            item={item}
            index={index}
            onToggle={() => toggle(item.plan.planId)}
            isAnimating={index === items.length - 1 && item.state === 'streaming'}
          />
        ))}

        {isStreaming && streamingCount === 0 && (
          <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground animate-pulse">
            <span className="text-sm">◌</span>
            <Typography variant="caption" tone="muted">Generating…</Typography>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-border bg-card px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {completionSummary ? (
            <Typography variant="caption" className="font-medium text-success">
              {completionSummary}
            </Typography>
          ) : isBusy && totalToCreate > 0 ? (
            <Typography variant="caption" tone="muted">
              Creating {doneCount + 1} of {totalToCreate}…
            </Typography>
          ) : readyCount > 0 ? (
            <>
              <Typography variant="caption" tone="muted">{readyCount} ready</Typography>
              {streamingCount > 0 && (
                <Typography variant="caption" tone="muted">· {streamingCount} generating</Typography>
              )}
              <Typography variant="caption" tone="muted" className="font-medium">
                · {selectedItems.length} selected
              </Typography>
            </>
          ) : streamingCount > 0 ? (
            <Typography variant="caption" tone="muted">{streamingCount} generating…</Typography>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isBusy && items.some((i) => i.state === 'ready' || i.state === 'failed') ? (
            <button
              type="button"
              onClick={() => void handleDismissAll()}
              className="text-[11px] text-muted-foreground hover:text-foreground underline"
            >
              Dismiss all
            </button>
          ) : null}

          <Button
            size="sm"
            variant="default"
            disabled={isBusy || selectedItems.length === 0}
            onClick={() => void handleCreate()}
            className="h-7 px-3 text-xs"
          >
            {isBusy ? <Loader2 size={11} className="mr-1 animate-spin" /> : null}
            {isBusy
              ? 'Creating…'
              : selectedItems.length > 0
                ? `Create ${selectedItems.length}`
                : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
