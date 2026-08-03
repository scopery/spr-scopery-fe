'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button, Modal, Typography } from '@/shared/ui'
import { useMappingReview } from '../hooks/useMappingReview'
import {
  MAPPING_GENERATE_SCOPES,
  MAPPING_RELATION_LABELS,
  MAPPING_SCOPE_LABELS,
  MappingRelationType,
  MappingScope,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingScope as MappingScopeValue,
} from '../model/mapping-suggestions'
import { AiMappingRunProgressPanel } from './AiMappingRunProgressPanel'
import { AiMappingExceptionQueue } from './AiMappingExceptionQueue'
import { cn } from '@/utils/cn'

const RELATION_TABS: MappingRelationTypeValue[] = [
  MappingRelationType.RequirementToFunction,
  MappingRelationType.FunctionToUseCase,
  MappingRelationType.UseCaseToTestCase,
]

function parseRelationType(v: string | null): MappingRelationTypeValue {
  if (
    v === MappingRelationType.FunctionToUseCase ||
    v === MappingRelationType.UseCaseToTestCase ||
    v === MappingRelationType.RequirementToFunction
  ) {
    return v
  }
  return MappingRelationType.RequirementToFunction
}

export function AiMappingReviewView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlRunId = searchParams.get('runId')
  const urlRelation = parseRelationType(searchParams.get('relationType'))

  const {
    relationType,
    setRelationType,
    scope,
    setScope,
    run,
    allSuggestions,
    needsReviewQueue,
    readyIncludedCount,
    unmatchedCount,
    includedApplyCount,
    includedIds,
    focusedId,
    setFocusedId,
    focusNext,
    looksCorrect,
    leaveUnmapped,
    confirmChangeMapping,
    canUndo,
    undoLast,
    loading,
    generating,
    generatePolling,
    applying,
    undoing,
    error,
    applyResult,
    getLabel,
    generate,
    applyIncluded,
  } = useMappingReview(workspaceId, projectId, {
    runId: urlRunId,
    relationType: urlRelation,
  })

  const [applyOpen, setApplyOpen] = useState(false)
  const [changingId, setChangingId] = useState<string | null>(null)
  const [showReady, setShowReady] = useState(false)
  const [showUnmatched, setShowUnmatched] = useState(false)

  const syncUrl = useCallback(
    (next: { runId?: string | null; relationType?: MappingRelationTypeValue }) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'ai-mapping')
      const rt = next.relationType ?? relationType
      params.set('relationType', rt)
      if (next.runId) params.set('runId', next.runId)
      else if (next.runId === null) params.delete('runId')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams, relationType]
  )

  useEffect(() => {
    if (run?.id && run.id !== urlRunId) {
      syncUrl({ runId: run.id, relationType })
    }
  }, [run?.id, urlRunId, relationType, syncUrl])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }
      if (generating || applying || undoing) return

      const key = e.key.toLowerCase()
      if (key === 'arrowdown' || key === 'j') {
        e.preventDefault()
        focusNext(1)
        return
      }
      if (key === 'arrowup' || key === 'k') {
        e.preventDefault()
        focusNext(-1)
        return
      }
      if (key === 'escape') {
        setChangingId(null)
        return
      }
      if ((e.metaKey || e.ctrlKey) && key === 'z' && canUndo) {
        e.preventDefault()
        void undoLast()
        return
      }

      const focused =
        needsReviewQueue.find((s) => s.id === focusedId) ?? needsReviewQueue[0] ?? null
      if (!focused) return

      if (key === 'enter') {
        e.preventDefault()
        if (changingId) return
        if (focused.targetId) looksCorrect(focused.id)
        return
      }
      if (key === 'c') {
        e.preventDefault()
        setChangingId((id) => (id === focused.id ? null : focused.id))
        setFocusedId(focused.id)
        return
      }
      if (key === 'u') {
        e.preventDefault()
        setChangingId(null)
        void leaveUnmapped(focused.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    focusedId,
    needsReviewQueue,
    focusNext,
    looksCorrect,
    leaveUnmapped,
    generating,
    applying,
    undoing,
    canUndo,
    undoLast,
    changingId,
    setFocusedId,
  ])

  useEffect(() => {
    if (!focusedId) return
    const el = document.querySelector(`[data-suggestion-id="${focusedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedId])

  const onRelationTab = (type: MappingRelationTypeValue) => {
    setRelationType(type)
    setChangingId(null)
    setShowReady(false)
    setShowUnmatched(false)
    syncUrl({ runId: null, relationType: type })
  }

  const onGenerate = async () => {
    setChangingId(null)
    setShowReady(false)
    setShowUnmatched(false)
    const next = await generate()
    if (next?.id) {
      syncUrl({ runId: next.id, relationType })
    }
  }

  const hasRun = Boolean(run || allSuggestions.length > 0)
  const reviewedAway = Math.max(
    0,
    (run?.suggestionCount ?? allSuggestions.length) -
      readyIncludedCount -
      needsReviewQueue.length -
      unmatchedCount
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography weight="medium" size="sm">
            AI Mapping
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Generate suggestions, fix only the unclear ones, then apply.
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            <span className="whitespace-nowrap">Scope</span>
            <select
              className="border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
              value={scope}
              disabled={generating}
              onChange={(e) => setScope(e.target.value as MappingScopeValue)}
              aria-label="Generate scope"
            >
              {MAPPING_GENERATE_SCOPES.map((s) => (
                <option key={s} value={s}>
                  {MAPPING_SCOPE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            variant="secondary"
            loading={generating}
            disabled={generating || applying}
            onClick={() => void onGenerate()}
          >
            Generate Suggestions
          </Button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Mapping relation type"
        className="flex flex-wrap gap-1 border-b border-neutral-100"
      >
        {RELATION_TABS.map((type) => {
          const active = relationType === type
          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={generating}
              onClick={() => onRelationTab(type)}
              className={cn(
                '-mb-px border-b-2 px-2 py-1.5 text-sm transition-colors',
                active
                  ? 'border-neutral-800 text-neutral-800'
                  : 'border-transparent text-neutral-400 hover:border-neutral-200 hover:text-neutral-600'
              )}
            >
              {MAPPING_RELATION_LABELS[type]}
            </button>
          )
        })}
      </div>

      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}

      {scope !== MappingScope.Unmapped ? (
        <Typography variant="caption" tone="muted">
          Scope is stored on the run for audit. Generation still focuses on unmapped sources.
        </Typography>
      ) : null}

      {run &&
      (generating || generatePolling || run.status === 'RUNNING' || run.status === 'PENDING') ? (
        <AiMappingRunProgressPanel run={run} isPolling={generatePolling || generating} />
      ) : null}

      {hasRun ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <Typography size="sm" className="text-neutral-800">
            {readyIncludedCount} ready
            {' · '}
            {needsReviewQueue.length} need review
            {' · '}
            {unmatchedCount} unmatched
          </Typography>
          <div className="flex flex-wrap items-center gap-2">
            {canUndo ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={undoing || applying}
                loading={undoing}
                onClick={() => void undoLast()}
              >
                Undo
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              disabled={applying || generating || includedApplyCount === 0}
              loading={applying}
              onClick={() => setApplyOpen(true)}
            >
              Apply {includedApplyCount} Mapping{includedApplyCount === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      ) : null}

      {hasRun ? (
        <div className="space-y-2">
          {readyIncludedCount > 0 ? (
            <div className="border border-neutral-100 px-3 py-2">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm text-neutral-700"
                onClick={() => setShowReady((v) => !v)}
              >
                <span>✓ {readyIncludedCount} ready mappings</span>
                <span className="text-xs text-neutral-500">{showReady ? 'Hide' : 'View'}</span>
              </button>
              {showReady ? (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-neutral-600">
                  {allSuggestions
                    .filter(
                      (s) =>
                        includedIds.has(s.id) &&
                        s.targetId &&
                        s.confidenceBand === 'HIGH' &&
                        s.decision !== 'NO_MATCH'
                    )
                    .slice(0, 40)
                    .map((s) => {
                      const src = getLabel(s.sourceId)
                      const tgt = getLabel(s.targetId)
                      return (
                        <li key={s.id}>
                          {src.code} → {tgt.code} · {tgt.name}
                        </li>
                      )
                    })}
                </ul>
              ) : null}
            </div>
          ) : null}

          {unmatchedCount > 0 ? (
            <div className="border border-neutral-100 px-3 py-2">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm text-neutral-700"
                onClick={() => setShowUnmatched((v) => !v)}
              >
                <span>{unmatchedCount} unmatched</span>
                <span className="text-xs text-neutral-500">
                  {showUnmatched ? 'Hide' : 'Resolve later'}
                </span>
              </button>
              {showUnmatched ? (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-neutral-600">
                  {allSuggestions
                    .filter((s) => s.decision === 'NO_MATCH' || !s.targetId)
                    .slice(0, 40)
                    .map((s) => {
                      const src = getLabel(s.sourceId)
                      return (
                        <li key={s.id}>
                          {src.code} · {src.name}
                        </li>
                      )
                    })}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasRun ? (
        <Typography size="sm" weight="medium">
          Showing: Needs Review
          {reviewedAway > 0 ? (
            <span className="ml-2 font-normal text-neutral-500">
              · {reviewedAway} already decided this session
            </span>
          ) : null}
        </Typography>
      ) : null}

      {loading && !generating ? (
        <Typography variant="small" tone="muted">
          Loading suggestions…
        </Typography>
      ) : hasRun ? (
        <AiMappingExceptionQueue
          projectId={projectId}
          relationType={relationType}
          items={needsReviewQueue}
          allSuggestions={allSuggestions}
          focusedId={focusedId}
          changingId={changingId}
          onFocus={setFocusedId}
          onChangingIdChange={setChangingId}
          onLooksCorrect={looksCorrect}
          onConfirmChange={confirmChangeMapping}
          onLeaveUnmapped={(id) => void leaveUnmapped(id)}
          getLabel={getLabel}
          busy={applying || generating}
        />
      ) : (
        <div className="border border-dashed border-neutral-200 px-4 py-10 text-center">
          <Typography tone="muted" size="sm">
            Generate suggestions to start an exception review.
          </Typography>
        </div>
      )}

      {hasRun && needsReviewQueue.length === 0 && includedApplyCount > 0 ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            disabled={applying || generating}
            loading={applying}
            onClick={() => setApplyOpen(true)}
          >
            Apply {includedApplyCount} Mapping{includedApplyCount === 1 ? '' : 's'}
          </Button>
        </div>
      ) : null}

      {applyResult ? (
        <Typography variant="small" tone="muted">
          Last apply — created {applyResult.created}
          {canUndo ? ' · Undo available (⌘/Ctrl+Z)' : ''}
        </Typography>
      ) : null}

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply mappings"
        size="md"
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setApplyOpen(false) },
          {
            label: `Apply ${includedApplyCount}`,
            variant: 'secondary',
            loading: applying,
            disabled: applying || includedApplyCount === 0,
            onClick: () => {
              void (async () => {
                await applyIncluded()
                setApplyOpen(false)
              })()
            },
          },
        ]}
      >
        <Typography variant="small">
          {includedApplyCount} mapping{includedApplyCount === 1 ? '' : 's'} in the draft will be
          written as real relations. Unmatched and left-unmapped items are skipped.
        </Typography>
      </Modal>
    </div>
  )
}
