'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button, Checkbox, Typography } from '@/shared/ui'
import { apiClient } from '@/shared/lib/apiClient'
import { getApiOrigin } from '@/shared/lib/api-paths'
import type { ActionPlanSummary } from '../hooks/aiMessageStream.reducer'

interface ActionConfirmationCardProps {
  plans: ActionPlanSummary[]
  isStreaming: boolean
  onDismiss: (planId: string) => void
}

type TaskState = 'streaming' | 'ready' | 'creating' | 'created' | 'failed'

interface TaskItem {
  plan: ActionPlanSummary
  displayText: string
  state: TaskState
  selected: boolean
  errorMsg?: string
}

function useProgressiveReveal(text: string, active: boolean): string {
  const [revealed, setRevealed] = useState('')
  const rafRef = useRef<number | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!active || !text) {
      setRevealed(text)
      return
    }
    indexRef.current = 0
    setRevealed('')

    const CHARS_PER_FRAME = 4
    const tick = () => {
      indexRef.current = Math.min(indexRef.current + CHARS_PER_FRAME, text.length)
      setRevealed(text.slice(0, indexRef.current))
      if (indexRef.current < text.length) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [text, active])

  return active ? revealed : text
}

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
  const title = hints.title ?? item.plan.summary
  const phase = hints.phaseTitle
  const description = hints.description ?? ''
  const priority = hints.priority

  const revealedDesc = useProgressiveReveal(description, isAnimating)

  const isStreaming = item.state === 'streaming'
  const isDone = item.state === 'created'
  const isFailed = item.state === 'failed'

  return (
    <div
      className="px-4 py-3.5 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDuration: `${140 + index * 30}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox / status indicator */}
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          {isDone ? (
            <span className="text-sm text-success select-none" aria-hidden>
              ✓
            </span>
          ) : isFailed ? (
            <span className="text-sm text-error select-none" aria-hidden>
              !
            </span>
          ) : isStreaming ? (
            <span className="text-sm text-neutral-400 select-none" aria-hidden>
              ◌
            </span>
          ) : (
            <Checkbox
              size="md"
              checked={item.selected}
              onChange={onToggle}
              aria-label={item.selected ? 'Deselect task' : 'Select task'}
              className="shadow-none [&_input]:shadow-none [&_input]:focus:shadow-none [&_input]:focus:ring-0"
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {isStreaming ? (
            <Typography variant="small" tone="muted" className="animate-pulse">
              Generating task…
            </Typography>
          ) : (
            <>
              <Typography
                variant="small"
                className="font-semibold leading-snug"
                style={{ fontSize: 14 }}
              >
                {title}
              </Typography>

              {(phase || priority) && (
                <div className="mt-0.5 flex items-center gap-2">
                  {phase && (
                    <Typography variant="caption" tone="muted" className="font-medium">
                      Phase: {phase}
                    </Typography>
                  )}
                  {priority && (
                    <Typography variant="caption" tone="muted">
                      {priority}
                    </Typography>
                  )}
                </div>
              )}

              {description && (
                <Typography
                  variant="small"
                  tone="muted"
                  className="mt-1 leading-relaxed whitespace-pre-wrap"
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                >
                  {revealedDesc}
                </Typography>
              )}

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

export function ActionConfirmationCard({
  plans,
  isStreaming,
  onDismiss,
}: ActionConfirmationCardProps) {
  const base = `${getApiOrigin()}/api/ai-actions/plans`

  const [items, setItems] = useState<TaskItem[]>([])
  const [creating, setCreating] = useState(false)
  const prevPlanIdsRef = useRef<Set<string>>(new Set())

  // Sync plans → items: add new plans as they stream in
  useEffect(() => {
    setItems((prev) => {
      const prevMap = new Map(prev.map((i) => [i.plan.planId, i]))
      const updated = plans.map((plan) => {
        if (prevMap.has(plan.planId)) return prevMap.get(plan.planId)!
        // New plan: start streaming animation briefly
        return { plan, displayText: '', state: 'streaming' as TaskState, selected: true }
      })

      // Transition streaming → ready for plans that were already known before this render
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

  // After a short delay, transition any 'streaming' items to 'ready' (simulate generation complete)
  useEffect(() => {
    const timer = setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.state === 'streaming' ? { ...item, state: 'ready' } : item
        )
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
  const createdCount = items.filter((i) => i.state === 'created').length

  const handleCreate = async () => {
    if (selectedItems.length === 0 || creating) return
    setCreating(true)

    for (const item of selectedItems) {
      setItems((prev) =>
        prev.map((i) => (i.plan.planId === item.plan.planId ? { ...i, state: 'creating' } : i))
      )
      try {
        const confirmResult = await apiClient.post<{ id: string }>(`${base}/${item.plan.planId}/confirm`, {
          planHash: item.plan.planHash,
          expectedPlanVersion: item.plan.planVersion ?? 1,
        })
        await apiClient.post(`${base}/${item.plan.planId}/execute`, {
          planHash: item.plan.planHash,
          confirmationId: confirmResult?.id ?? null,
        }, { parseJson: false })
        setItems((prev) =>
          prev.map((i) =>
            i.plan.planId === item.plan.planId ? { ...i, state: 'created', selected: false } : i
          )
        )
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.plan.planId === item.plan.planId
              ? { ...i, state: 'failed', errorMsg: 'Failed to create' }
              : i
          )
        )
      }
    }

    setCreating(false)

    // Dismiss created items after a moment
    setTimeout(() => {
      setItems((prev) => {
        const toRemove = prev.filter((i) => i.state === 'created').map((i) => i.plan.planId)
        toRemove.forEach((id) => onDismiss(id))
        return prev.filter((i) => i.state !== 'created')
      })
    }, 1200)
  }

  const handleDismissAll = async () => {
    const toCancel = items.filter((i) => i.state === 'ready' || i.state === 'failed')
    for (const item of toCancel) {
      try {
        await apiClient.post(`${base}/${item.plan.planId}/cancel`, {}, { parseJson: false })
      } catch {
        // best-effort
      }
      onDismiss(item.plan.planId)
    }
  }

  if (items.length === 0) return null

  const allCreated = items.every((i) => i.state === 'created')
  if (allCreated) return null

  const isBusy = creating || items.some((i) => i.state === 'creating')

  // Footer status line
  const statusParts: string[] = []
  if (readyCount > 0) statusParts.push(`${readyCount} ready`)
  if (streamingCount > 0) statusParts.push(`${streamingCount} generating`)
  const statusText = statusParts.join(' · ')

  return (
    <div className="border border-neutral-500 bg-card overflow-hidden mb-3">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-neutral-500">
        <Typography className="font-semibold" style={{ fontSize: 13 }}>
          Suggested tasks
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          Review and select the tasks you want to create.
        </Typography>
      </div>

      {/* Task list */}
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

        {/* Live "generating" placeholder when more tasks may be incoming */}
        {isStreaming && streamingCount === 0 && (
          <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground animate-pulse">
            <span className="text-sm">◌</span>
            <Typography variant="caption" tone="muted">
              Generating task…
            </Typography>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-border bg-card px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {statusText ? (
            <Typography variant="caption" tone="muted">
              {statusText}
            </Typography>
          ) : null}
          {readyCount > 0 && (
            <Typography variant="caption" tone="muted" className="font-medium">
              {selectedItems.length} selected
            </Typography>
          )}
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
              ? `Creating…`
              : `Create ${selectedItems.length > 0 ? selectedItems.length : ''} task${selectedItems.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
