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
import { AiMappingComparisonWorkspace } from './AiMappingComparisonWorkspace'
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
    sourceGroups,
    reviewSourceQueue,
    readyIncludedCount,
    unmatchedCount,
    includedApplyCount,
    sourceSelections,
    extraTargets,
    activeSourceId,
    setActiveSourceId,
    toggleSourceTarget,
    addExtraTarget,
    approveSourceAndNext,
    leaveSourceUnmapped,
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
  const [readyModalOpen, setReadyModalOpen] = useState(false)
  const [readyActiveSourceId, setReadyActiveSourceId] = useState<string | null>(null)
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

  const onRelationTab = (type: MappingRelationTypeValue) => {
    setRelationType(type)
    setReadyModalOpen(false)
    setShowUnmatched(false)
    syncUrl({ runId: null, relationType: type })
  }

  const onGenerate = async () => {
    setReadyModalOpen(false)
    setShowUnmatched(false)
    const next = await generate()
    if (next?.id) {
      syncUrl({ runId: next.id, relationType })
    }
  }

  const hasRun = Boolean(run || allSuggestions.length > 0)
  const readySources = sourceGroups.filter((g) => g.bucket === 'READY')
  const unmatchedSources = sourceGroups.filter((g) => g.bucket === 'UNMATCHED')

  /** Flat rows for Apply confirm — what will actually be written. */
  const applyPreviewRows = (() => {
    const rows: { key: string; sourceLabel: string; targetLabel: string }[] = []
    for (const g of sourceGroups) {
      if (g.bucket === 'UNMATCHED') continue
      const selected = sourceSelections.get(g.sourceId)
      if (!selected || selected.size === 0) continue
      const src = getLabel(g.sourceId)
      for (const targetId of selected) {
        const tgt = getLabel(targetId)
        rows.push({
          key: `${g.sourceId}:${targetId}`,
          sourceLabel: `${src.code} · ${src.name}`,
          targetLabel: `${tgt.code} · ${tgt.name}`,
        })
      }
    }
    return rows
  })()

  const openReadyReview = () => {
    setReadyActiveSourceId(readySources[0]?.sourceId ?? null)
    setReadyModalOpen(true)
  }

  const onApproveReady = async (sourceId: string) => {
    await approveSourceAndNext(sourceId, {
      queue: readySources,
      setActive: setReadyActiveSourceId,
    })
  }

  const onLeaveReadyUnmapped = async (sourceId: string) => {
    await leaveSourceUnmapped(sourceId, {
      queue: readySources,
      setActive: setReadyActiveSourceId,
    })
  }

  // Keep ready modal focus valid; close when queue emptied.
  useEffect(() => {
    if (!readyModalOpen) return
    if (readySources.length === 0) {
      setReadyModalOpen(false)
      return
    }
    if (
      readyActiveSourceId &&
      !readySources.some((g) => g.sourceId === readyActiveSourceId)
    ) {
      setReadyActiveSourceId(readySources[0]?.sourceId ?? null)
    }
  }, [readyModalOpen, readySources, readyActiveSourceId])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography weight="medium" size="sm">
            AI Mapping
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Generate suggestions, review unclear sources, then apply mappings.
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
            {reviewSourceQueue.length} need review
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
            {readySources.length > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={applying || generating}
                onClick={openReadyReview}
              >
                Review ready
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
          {readySources.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 bg-white px-3 py-2.5">
              <div className="min-w-0">
                <Typography size="sm" className="text-neutral-800">
                  {readyIncludedCount} ready mapping{readyIncludedCount === 1 ? '' : 's'}
                  <span className="text-neutral-500"> · auto-included</span>
                </Typography>
                <Typography variant="caption" tone="muted" className="mt-0.5 block">
                  Review each source → target before applying. You can change targets or leave
                  unmapped.
                </Typography>
              </div>
              <Button size="sm" variant="secondary" onClick={openReadyReview}>
                Review ready
              </Button>
            </div>
          ) : null}

          {unmatchedSources.length > 0 ? (
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
                  {unmatchedSources.map((g) => {
                    const src = getLabel(g.sourceId)
                    return (
                      <li key={g.sourceId} className="[overflow-wrap:anywhere]">
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

      {loading && !generating ? (
        <Typography variant="small" tone="muted">
          Loading suggestions…
        </Typography>
      ) : hasRun ? (
        <AiMappingComparisonWorkspace
          projectId={projectId}
          relationType={relationType}
          reviewQueue={reviewSourceQueue}
          activeSourceId={activeSourceId}
          onActiveSourceIdChange={setActiveSourceId}
          sourceSelections={sourceSelections}
          extraTargets={extraTargets}
          onToggleTarget={toggleSourceTarget}
          onAddExtra={addExtraTarget}
          onApproveAndNext={(id) => void approveSourceAndNext(id)}
          onLeaveUnmapped={(id) => void leaveSourceUnmapped(id)}
          getLabel={getLabel}
          busy={applying || generating}
          keyboardEnabled={!readyModalOpen}
        />
      ) : (
        <div className="border border-dashed border-neutral-200 px-4 py-10 text-center">
          <Typography tone="muted" size="sm">
            Generate suggestions to start an exception review.
          </Typography>
        </div>
      )}

      {hasRun && reviewSourceQueue.length === 0 && includedApplyCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 px-3 py-3">
          <div className="min-w-0">
            <Typography size="sm">
              {includedApplyCount} mapping{includedApplyCount === 1 ? '' : 's'} ready to apply
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5 block">
              Review the list before writing relations.
            </Typography>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={applying || generating || readySources.length === 0}
              onClick={openReadyReview}
            >
              Review again
            </Button>
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
        </div>
      ) : null}

      {applyResult ? (
        <Typography variant="small" tone="muted">
          Last apply — created {applyResult.created}
          {applyResult.skippedStale > 0
            ? ` · skipped stale ${applyResult.skippedStale}`
            : ''}
          {canUndo ? ' · Undo available (⌘/Ctrl+Z)' : ''}
        </Typography>
      ) : null}

      <Modal
        open={readyModalOpen}
        onClose={() => setReadyModalOpen(false)}
        title="Review ready mappings"
        size="full"
      >
        <div className="-mx-2 min-h-[70vh]">
          <Typography variant="small" tone="muted" className="mb-3 px-2">
            These were auto-included by AI. Check each pair, change targets, or leave unmapped —
            then Apply from the summary bar.
          </Typography>
          <AiMappingComparisonWorkspace
            projectId={projectId}
            relationType={relationType}
            reviewQueue={readySources}
            activeSourceId={readyActiveSourceId}
            onActiveSourceIdChange={setReadyActiveSourceId}
            sourceSelections={sourceSelections}
            extraTargets={extraTargets}
            onToggleTarget={toggleSourceTarget}
            onAddExtra={addExtraTarget}
            onApproveAndNext={(id) => void onApproveReady(id)}
            onLeaveUnmapped={(id) => void onLeaveReadyUnmapped(id)}
            getLabel={getLabel}
            busy={applying || generating}
            queueLabel="Ready"
            emptyMessage="No ready mappings left in this queue."
            className="min-h-[65vh]"
          />
        </div>
      </Modal>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply mappings"
        size="md"
        actions={[
          {
            label: 'Review again',
            variant: 'ghost',
            disabled: readySources.length === 0,
            onClick: () => {
              setApplyOpen(false)
              openReadyReview()
            },
          },
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
        <Typography variant="small" className="mb-3">
          {includedApplyCount} mapping{includedApplyCount === 1 ? '' : 's'} will be written as real
          relations. Unmatched and left-unmapped items are skipped.
        </Typography>
        {applyPreviewRows.length > 0 ? (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto border border-neutral-100 p-2 text-sm">
            {applyPreviewRows.map((row) => (
              <li
                key={row.key}
                className="border-b border-neutral-50 pb-1.5 last:border-b-0 last:pb-0"
              >
                <div className="text-neutral-900 [overflow-wrap:anywhere]">{row.sourceLabel}</div>
                <div className="text-xs text-neutral-500 [overflow-wrap:anywhere]">
                  → {row.targetLabel}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </div>
  )
}
