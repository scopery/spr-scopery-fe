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
  ReviewDecision,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingScope as MappingScopeValue,
} from '../model/mapping-suggestions'
import { isPendingSuggestion } from '../model/mapping-review.rules'
import { isStaleSuggestion as isStale } from '../model/mapping-phase3.rules'
import { AiMappingSummaryStrip } from './AiMappingSummaryStrip'
import { AiMappingSuggestionGroups } from './AiMappingSuggestionGroups'
import { AiMappingEvalPanel } from './AiMappingEvalPanel'
import { AiMappingAutoMapPanel } from './AiMappingAutoMapPanel'
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
    suggestions,
    allSuggestions,
    counts,
    filter,
    setFilter,
    selectedIds,
    toggleSelected,
    selectMany,
    clearSelection,
    focusedId,
    setFocusedId,
    focusNext,
    draftTargets,
    draftRemapCount,
    changeDraftTarget,
    keepCurrent,
    replaceMapping,
    canUndo,
    undoLast,
    loading,
    generating,
    reviewing,
    applying,
    undoing,
    error,
    applyResult,
    getLabel,
    generate,
    review,
    acceptReady,
    apply,
    evalMetrics,
    evalHistory,
    captureEvalSnapshot,
    escalatedIds,
    toggleEscalated,
    autoMapEnabled,
    setAutoMapEnabled,
    autoMapEligibleCount,
    autoMapGate,
    runAutoMap,
    autoMapping,
    autoMapAudit,
  } = useMappingReview(workspaceId, projectId, {
    runId: urlRunId,
    relationType: urlRelation,
  })

  const [applyOpen, setApplyOpen] = useState(false)
  const [changingId, setChangingId] = useState<string | null>(null)

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
      if (generating || applying || reviewing || undoing) return

      const key = e.key.toLowerCase()
      if (key === 'j') {
        e.preventDefault()
        focusNext(1)
        return
      }
      if (key === 'k') {
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
      if (!focusedId) return
      const focused = suggestions.find((s) => s.id === focusedId)
      if (!focused || !isPendingSuggestion(focused)) return
      if (isStale(focused)) return

      if (key === 'a') {
        e.preventDefault()
        void review(ReviewDecision.Accept, [focusedId])
        return
      }
      if (key === 'r') {
        e.preventDefault()
        void review(ReviewDecision.Reject, [focusedId])
        return
      }
      if (key === 'c') {
        e.preventDefault()
        setChangingId((id) => (id === focusedId ? null : focusedId))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    focusedId,
    suggestions,
    focusNext,
    review,
    generating,
    applying,
    reviewing,
    undoing,
    canUndo,
    undoLast,
  ])

  useEffect(() => {
    if (!focusedId) return
    const el = document.querySelector(`[data-suggestion-id="${focusedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedId])

  const onRelationTab = (type: MappingRelationTypeValue) => {
    setRelationType(type)
    setChangingId(null)
    syncUrl({ runId: null, relationType: type })
  }

  const onGenerate = async () => {
    setChangingId(null)
    const next = await generate()
    if (next?.id) {
      syncUrl({ runId: next.id, relationType })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography weight="medium" size="sm">
            AI Mapping Review
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Generate, correct remaps, review existing parents, Apply once — Undo available after
            apply.
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
            Generate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={reviewing || applying || counts.ready === 0}
            loading={reviewing}
            onClick={() => void acceptReady()}
          >
            Accept ready ({counts.ready})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={reviewing || applying || selectedIds.size === 0}
            onClick={() => void review(ReviewDecision.Accept)}
          >
            Accept selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={reviewing || applying || selectedIds.size === 0}
            onClick={() => void review(ReviewDecision.Reject)}
          >
            Reject selected
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={applying || generating || counts.accepted === 0}
            onClick={() => setApplyOpen(true)}
          >
            Apply accepted ({counts.accepted})
            {draftRemapCount > 0 ? ` · ${draftRemapCount} draft` : ''}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!canUndo || undoing || applying}
            loading={undoing}
            onClick={() => void undoLast()}
          >
            Undo
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
          Note: BE currently still selects unmapped sources for generation; scope is stored on the
          run for audit. Changed / incomplete coverage filtering lands with full Phase 3 BE.
        </Typography>
      ) : null}

      {generating ? (
        <div className="border border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
          <Typography size="sm" weight="medium">
            Generating mapping suggestions…
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            AI retrieval can take a while. Keep this tab open.
          </Typography>
        </div>
      ) : null}

      {run || suggestions.length > 0 || loading ? (
        <AiMappingSummaryStrip
          counts={counts}
          filter={filter}
          onFilterChange={setFilter}
          runStatus={run?.status}
          sourceCount={run?.sourceCount}
          suggestionCount={run?.suggestionCount}
          scope={run?.scope ?? scope}
        />
      ) : null}

      {run || allSuggestions.length > 0 ? (
        <AiMappingEvalPanel
          metrics={evalMetrics}
          history={evalHistory}
          onCapture={() => captureEvalSnapshot()}
          escalatedCount={escalatedIds.size}
        />
      ) : null}

      {run || allSuggestions.length > 0 ? (
        <AiMappingAutoMapPanel
          enabled={autoMapEnabled}
          onEnabledChange={setAutoMapEnabled}
          gate={autoMapGate}
          eligibleCount={autoMapEligibleCount}
          gateReady={evalMetrics.gateReadyForAutoMap}
          autoMapping={autoMapping}
          disabled={generating || reviewing || applying || undoing || loading}
          onRun={() => void runAutoMap()}
          audit={autoMapAudit}
        />
      ) : null}

      {selectedIds.size > 0 ? (
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <span>{selectedIds.size} selected</span>
          <button type="button" className="underline" onClick={clearSelection}>
            Clear
          </button>
        </div>
      ) : null}

      {loading && !generating ? (
        <Typography variant="small" tone="muted">
          Loading suggestions…
        </Typography>
      ) : (
        <AiMappingSuggestionGroups
          projectId={projectId}
          relationType={relationType}
          suggestions={suggestions}
          allSuggestions={allSuggestions}
          selectedIds={selectedIds}
          focusedId={focusedId}
          draftTargets={draftTargets}
          onToggle={toggleSelected}
          onSelectMany={selectMany}
          onFocus={setFocusedId}
          onChangeDraftTarget={changeDraftTarget}
          getLabel={getLabel}
          changingId={changingId}
          onChangingIdChange={setChangingId}
          onKeepCurrent={(id) => void keepCurrent(id)}
          onReplace={(id) => void replaceMapping(id)}
          reviewing={reviewing}
          escalatedIds={escalatedIds}
          onToggleEscalate={toggleEscalated}
        />
      )}

      {applyResult ? (
        <Typography variant="small" tone="muted">
          Last apply — created {applyResult.created}, skipped conflict{' '}
          {applyResult.skippedConflict}, skipped stale {applyResult.skippedStale}, failed{' '}
          {applyResult.failed}
          {canUndo ? ' · Undo available' : ''}
        </Typography>
      ) : null}

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply accepted mappings"
        size="md"
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setApplyOpen(false) },
          {
            label: 'Apply',
            variant: 'secondary',
            loading: applying,
            disabled: applying || counts.accepted === 0,
            onClick: () => {
              void (async () => {
                await apply()
                setApplyOpen(false)
              })()
            },
          },
        ]}
      >
        <Typography variant="small" className="mb-2">
          {counts.accepted} accepted suggestion{counts.accepted === 1 ? '' : 's'} will be written.
          {counts.remap > 0
            ? ` Includes ${counts.remap} replacement(s) of existing parents.`
            : ''}
          {draftRemapCount > 0
            ? ` ${draftRemapCount} draft remap(s) use the corrected target.`
            : ''}
          {counts.outdated > 0
            ? ` ${counts.outdated} outdated suggestion(s) are excluded.`
            : ''}
        </Typography>
        <Typography variant="small" tone="muted">
          After apply you can Undo the last batch (⌘/Ctrl+Z). Pending and rejected items are not
          applied.
        </Typography>
      </Modal>
    </div>
  )
}
