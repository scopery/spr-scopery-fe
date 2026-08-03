'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import { Badge, Button, Checkbox, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  getMappingReviewBucket,
  isPendingSuggestion,
  scorePercent,
} from '../model/mapping-review.rules'
import {
  MappingRelationType,
  MappingReviewBucket,
  SuggestionReviewStatus,
  type EntityLabel,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingSuggestion,
} from '../model/mapping-suggestions'
import { AiMappingCandidatePicker } from './AiMappingCandidatePicker'
import { AiMappingExistingCompare } from './AiMappingExistingCompare'
import { isRemapCandidate, isStaleSuggestion } from '../model/mapping-phase3.rules'

export const MAPPING_DRAFT_REMAP_MIME = 'application/x-scopery-mapping-draft-remap'

function confidenceTone(
  band: string | null
): 'success' | 'warning' | 'error' | 'neutral' {
  if (band === 'HIGH') return 'success'
  if (band === 'MEDIUM') return 'warning'
  if (band === 'LOW') return 'error'
  return 'neutral'
}

function bucketLabel(bucket: string): string {
  if (bucket === MappingReviewBucket.Ready) return 'Ready'
  if (bucket === MappingReviewBucket.Unmatched) return 'Unmatched'
  return 'Needs review'
}

interface RemapPayload {
  suggestionId: string
  sourceId: string
}

interface SuggestionRowProps {
  suggestion: MappingSuggestion
  sourceLabel: EntityLabel
  targetLabel: EntityLabel | null
  selected: boolean
  focused: boolean
  drafted: boolean
  onToggle: (id: string) => void
  onFocus: (id: string) => void
  showSource: boolean
  allowDrag: boolean
  onChangeClick: (id: string) => void
  changing: boolean
  projectId: string
  relationType: MappingRelationTypeValue
  aiTargetIds: string[]
  onPickTarget: (suggestionId: string, label: EntityLabel) => void
  onClosePicker: () => void
  onKeepCurrent: (suggestionId: string) => void
  onReplace: (suggestionId: string) => void
  reviewing?: boolean
  getLabel: (id: string | null | undefined) => EntityLabel
  escalated?: boolean
  onToggleEscalate?: (id: string) => void
}

function SuggestionRow({
  suggestion,
  sourceLabel,
  targetLabel,
  selected,
  focused,
  drafted,
  onToggle,
  onFocus,
  showSource,
  allowDrag,
  onChangeClick,
  changing,
  projectId,
  relationType,
  aiTargetIds,
  onPickTarget,
  onClosePicker,
  onKeepCurrent,
  onReplace,
  reviewing,
  getLabel,
  escalated,
  onToggleEscalate,
}: SuggestionRowProps) {
  const [open, setOpen] = useState(false)
  const pending = isPendingSuggestion(suggestion)
  const bucket = getMappingReviewBucket(suggestion)
  const stale = isStaleSuggestion(suggestion)
  const remap = isRemapCandidate(suggestion)

  return (
    <li
      className={cn(
        'border-b border-neutral-100 last:border-b-0',
        focused && 'bg-secondary/5 ring-1 ring-inset ring-secondary/30'
      )}
      data-suggestion-id={suggestion.id}
    >
      <div
        className={cn(
          'flex items-start gap-2 px-3 py-2.5',
          allowDrag && pending && 'cursor-grab active:cursor-grabbing'
        )}
        draggable={allowDrag && pending}
        onClick={() => onFocus(suggestion.id)}
        onDragStart={(e) => {
          if (!allowDrag || !pending) {
            e.preventDefault()
            return
          }
          const payload: RemapPayload = {
            suggestionId: suggestion.id,
            sourceId: suggestion.sourceId,
          }
          e.dataTransfer.setData(MAPPING_DRAFT_REMAP_MIME, JSON.stringify(payload))
          e.dataTransfer.effectAllowed = 'move'
        }}
      >
        <Checkbox
          size="sm"
          checked={selected}
          disabled={!pending}
          onChange={() => onToggle(suggestion.id)}
          aria-label={`Select suggestion ${suggestion.id}`}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {showSource ? (
              <Typography size="sm" weight="medium" className="truncate">
                {sourceLabel.code} · {sourceLabel.name}
              </Typography>
            ) : null}
            {targetLabel ? (
              <Typography
                size="sm"
                weight={showSource ? 'normal' : 'medium'}
                className="truncate text-neutral-800"
              >
                {showSource ? '→ ' : ''}
                {targetLabel.code} · {targetLabel.name}
              </Typography>
            ) : (
              <Typography size="sm" tone="muted">
                No match
              </Typography>
            )}
            {drafted ? (
              <Badge size="sm" variant="soft" tone="info">
                Draft
              </Badge>
            ) : null}
            {stale ? (
              <Badge size="sm" variant="soft" tone="warning">
                Outdated
              </Badge>
            ) : null}
            {remap ? (
              <Badge size="sm" variant="soft" tone="info">
                Remap
              </Badge>
            ) : null}
            {escalated ? (
              <Badge size="sm" variant="soft" tone="warning">
                Escalate
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="soft" tone={confidenceTone(suggestion.confidenceBand)}>
              {suggestion.confidenceBand ?? '—'} · {scorePercent(suggestion.finalScore)}
            </Badge>
            {pending ? (
              <Badge size="sm" variant="soft" tone="neutral">
                {bucketLabel(bucket)}
              </Badge>
            ) : (
              <Badge
                size="sm"
                variant="soft"
                tone={
                  suggestion.reviewStatus === SuggestionReviewStatus.Accepted
                    ? 'success'
                    : 'neutral'
                }
              >
                {suggestion.reviewStatus}
              </Badge>
            )}
            {suggestion.decision !== 'SUGGEST' ? (
              <Badge size="sm" variant="soft" tone="warning">
                {suggestion.decision}
              </Badge>
            ) : null}
            {suggestion.warnings.length > 0 ? (
              <Badge size="sm" variant="soft" tone="warning">
                Warning
              </Badge>
            ) : null}
          </div>
          {!open && suggestion.evidence[0] ? (
            <Typography variant="small" tone="muted" className="mt-1 line-clamp-1">
              {suggestion.evidence[0]}
            </Typography>
          ) : null}
          {open ? (
            <div className="mt-2 space-y-1.5 text-xs text-neutral-600">
              {suggestion.reasonCodes.length > 0 ? (
                <div>
                  <span className="font-medium text-neutral-800">Reasons: </span>
                  {suggestion.reasonCodes.join(', ')}
                </div>
              ) : null}
              {suggestion.evidence.length > 0 ? (
                <ul className="list-disc space-y-0.5 pl-4">
                  {suggestion.evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : null}
              {suggestion.warnings.length > 0 ? (
                <div className="text-amber-700">
                  <span className="font-medium">Warnings: </span>
                  {suggestion.warnings.join(', ')}
                </div>
              ) : null}
            </div>
          ) : null}
          {changing ? (
            <AiMappingCandidatePicker
              projectId={projectId}
              relationType={relationType}
              sourceId={suggestion.sourceId}
              aiTargetIds={aiTargetIds}
              currentTargetId={suggestion.targetId}
              onClose={onClosePicker}
              onSelect={(label) => onPickTarget(suggestion.id, label)}
            />
          ) : null}
          {pending &&
          (suggestion.decision === 'AMBIGUOUS' || suggestion.confidenceBand === 'MEDIUM') &&
          onToggleEscalate ? (
            <div className="mt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  onToggleEscalate(suggestion.id)
                }}
              >
                {escalated ? 'Clear escalation' : 'Mark for detailed pass'}
              </Button>
            </div>
          ) : null}
          {pending ? (
            <AiMappingExistingCompare
              suggestion={suggestion}
              getLabel={getLabel}
              onKeepCurrent={onKeepCurrent}
              onReplace={onReplace}
              disabled={reviewing || stale}
            />
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          {pending ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                onChangeClick(suggestion.id)
              }}
            >
              {changing ? 'Cancel' : 'Change'}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
          >
            {open ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>
    </li>
  )
}

interface Group {
  key: string
  titleCode: string
  titleName: string
  /** Drop target id for single-parent remaps (function or use case id). */
  dropTargetId: string | null
  items: MappingSuggestion[]
}

interface AiMappingSuggestionGroupsProps {
  projectId: string
  relationType: MappingRelationTypeValue
  suggestions: MappingSuggestion[]
  allSuggestions: MappingSuggestion[]
  selectedIds: Set<string>
  focusedId: string | null
  draftTargets: Map<string, string>
  onToggle: (id: string) => void
  onSelectMany: (ids: string[], selected: boolean) => void
  onFocus: (id: string) => void
  onChangeDraftTarget: (suggestionId: string, targetId: string, label?: EntityLabel) => void
  getLabel: (id: string | null | undefined) => EntityLabel
  changingId: string | null
  onChangingIdChange: (id: string | null) => void
  onKeepCurrent: (suggestionId: string) => void
  onReplace: (suggestionId: string) => void
  reviewing?: boolean
  escalatedIds?: Set<string>
  onToggleEscalate?: (id: string) => void
}

export function AiMappingSuggestionGroups({
  projectId,
  relationType,
  suggestions,
  allSuggestions,
  selectedIds,
  focusedId,
  draftTargets,
  onToggle,
  onSelectMany,
  onFocus,
  onChangeDraftTarget,
  getLabel,
  changingId,
  onChangingIdChange,
  onKeepCurrent,
  onReplace,
  reviewing,
  escalatedIds,
  onToggleEscalate,
}: AiMappingSuggestionGroupsProps) {
  const bySource = relationType === MappingRelationType.RequirementToFunction
  const allowDrag = !bySource

  const groups = useMemo(() => {
    const map = new Map<string, Group>()

    for (const s of suggestions) {
      const groupId = bySource ? s.sourceId : s.targetId ?? `source:${s.sourceId}`
      const label = bySource
        ? getLabel(s.sourceId)
        : s.targetId
          ? getLabel(s.targetId)
          : getLabel(s.sourceId)
      const existing = map.get(groupId)
      if (existing) {
        existing.items.push(s)
      } else {
        map.set(groupId, {
          key: groupId,
          titleCode: label.code,
          titleName: bySource || s.targetId ? label.name : `${label.name} (unmatched)`,
          dropTargetId: bySource ? null : s.targetId,
          items: [s],
        })
      }
    }

    return [...map.values()].sort((a, b) => a.titleCode.localeCompare(b.titleCode))
  }, [suggestions, bySource, getLabel])

  const aiTargetsBySource = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of allSuggestions) {
      if (!s.targetId) continue
      const list = map.get(s.sourceId) ?? []
      if (!list.includes(s.targetId)) list.push(s.targetId)
      map.set(s.sourceId, list)
    }
    return map
  }, [allSuggestions])

  if (suggestions.length === 0) {
    return (
      <div className="border border-dashed border-neutral-200 px-4 py-8 text-center">
        <Typography tone="muted" size="sm">
          No suggestions in this filter. Generate a run or change filters.
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {allowDrag ? (
        <Typography variant="caption" tone="muted">
          Drag a suggestion onto another group to draft-remap the parent. Keyboard: J/K navigate · A
          accept · R reject · C change.
        </Typography>
      ) : (
        <Typography variant="caption" tone="muted">
          Use Change to pick another function. Keyboard: J/K navigate · A accept · R reject · C
          change.
        </Typography>
      )}
      {groups.map((group) => {
        const pendingIds = group.items.filter(isPendingSuggestion).map((s) => s.id)
        const allSelected =
          pendingIds.length > 0 && pendingIds.every((id) => selectedIds.has(id))

        return (
          <section
            key={group.key}
            className="border border-neutral-200 bg-white"
            onDragOver={(e) => {
              if (!allowDrag || !group.dropTargetId) return
              if (![...e.dataTransfer.types].includes(MAPPING_DRAFT_REMAP_MIME)) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              if (!allowDrag || !group.dropTargetId) return
              e.preventDefault()
              try {
                const raw = e.dataTransfer.getData(MAPPING_DRAFT_REMAP_MIME)
                if (!raw) return
                const payload = JSON.parse(raw) as RemapPayload
                if (!payload?.suggestionId) return
                onChangeDraftTarget(
                  payload.suggestionId,
                  group.dropTargetId,
                  getLabel(group.dropTargetId)
                )
                onFocus(payload.suggestionId)
              } catch {
                // ignore
              }
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
              <div className="min-w-0">
                <Typography size="sm" weight="medium" className="truncate">
                  {group.titleCode} · {group.titleName}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {group.items.length} suggestion{group.items.length === 1 ? '' : 's'}
                  {allowDrag && group.dropTargetId ? ' · drop zone' : ''}
                </Typography>
              </div>
              {pendingIds.length > 0 ? (
                <button
                  type="button"
                  className="text-xs text-neutral-600 underline hover:text-neutral-900"
                  onClick={() => onSelectMany(pendingIds, !allSelected)}
                >
                  {allSelected ? 'Deselect' : 'Select pending'}
                </button>
              ) : null}
            </div>
            <ul>
              {group.items.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  sourceLabel={getLabel(s.sourceId)}
                  targetLabel={s.targetId ? getLabel(s.targetId) : null}
                  selected={selectedIds.has(s.id)}
                  focused={focusedId === s.id}
                  drafted={draftTargets.has(s.id)}
                  onToggle={onToggle}
                  onFocus={onFocus}
                  showSource={!bySource}
                  allowDrag={allowDrag}
                  onChangeClick={(id) =>
                    onChangingIdChange(changingId === id ? null : id)
                  }
                  changing={changingId === s.id}
                  projectId={projectId}
                  relationType={relationType}
                  aiTargetIds={aiTargetsBySource.get(s.sourceId) ?? []}
                  onPickTarget={(suggestionId, label) => {
                    onChangeDraftTarget(suggestionId, label.id, label)
                    onChangingIdChange(null)
                  }}
                  onClosePicker={() => onChangingIdChange(null)}
                  onKeepCurrent={onKeepCurrent}
                  onReplace={onReplace}
                  reviewing={reviewing}
                  getLabel={getLabel}
                  escalated={escalatedIds?.has(s.id)}
                  onToggleEscalate={onToggleEscalate}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
