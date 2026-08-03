'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as mappingApi from '../api/mapping-suggestions.api'
import * as catalogApi from '../api/functional-catalog.api'
import * as useCaseApi from '../api/use-case.api'
import * as requirementsApi from '@/modules/projects/requirements/api/requirements.api'
import * as qualityApi from '@/modules/quality/infrastructure/api/quality.api'
import {
  applyAcceptedWithEffectiveTargets,
  mergeDraftTargets,
  undoAppliedRelation,
} from '../model/apply-mapping-draft.rules'
import { computeMappingEvalMetrics } from '../model/mapping-eval.rules'
import {
  listMappingEvalSnapshots,
  saveMappingEvalSnapshot,
  type MappingEvalSnapshot,
} from '../model/mapping-eval.storage'
import {
  checkAutoMapReady,
  listAutoMapEligible,
  MappingRelationSource,
} from '../model/mapping-automap.rules'
import {
  appendAutoMapAudit,
  getAutoMapEnabled,
  listAutoMapAudit,
  markAutoMapAuditUndone,
  setAutoMapEnabled as persistAutoMapEnabled,
  type AutoMapAuditEntry,
} from '../model/mapping-automap.storage'
import {
  buildUndoEntriesFromApply,
  enrichSuggestionFreshness,
  isRemapCandidate,
  isStaleSuggestion,
  type MappingUndoEntry,
} from '../model/mapping-phase3.rules'
import {
  countMappingBuckets,
  getMappingReviewBucket,
  isPendingSuggestion,
  type MappingBucketCounts,
} from '../model/mapping-review.rules'
import {
  MappingRelationType,
  MappingReviewBucket,
  MappingScope,
  ReviewDecision,
  SuggestionReviewStatus,
  type ApplyMappingDraftResult,
  type EntityLabel,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingReviewBucket as MappingReviewBucketValue,
  type MappingRun,
  type MappingScope as MappingScopeValue,
  type MappingSuggestion,
} from '../model/mapping-suggestions'

export type MappingFilterChip =
  | 'ALL'
  | MappingReviewBucketValue
  | 'HAS_WARNING'
  | 'OUTDATED'
  | 'REMAP'
  | 'ACCEPTED'
  | 'REJECTED'

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id
}

function fallbackLabel(id: string): EntityLabel {
  return { id, code: shortId(id), name: 'Unknown' }
}

function mappingGenerateErrorMessage(err: unknown): string {
  const code = getErrorCode(err)
  if (code === 'MAPPING_NO_DEPLOYMENT_CONFIGURED') {
    return 'No ACTIVE default model deployment. Open AI Agent Admin → Deployments, activate one, then Set default.'
  }
  if (code === 'MAPPING_RUN_STILL_RUNNING') {
    return 'A mapping run is already in progress for this relation type. Wait for it to finish.'
  }
  if (code === 'MAPPING_PROMPT_NOT_FOUND') {
    return 'Mapping prompt templates are missing. Ensure TRACE_MAP_* prompts are seeded and ACTIVE.'
  }
  if (err instanceof ApiError) return err.message
  return err instanceof Error ? err.message : 'Failed to generate suggestions'
}

export function useMappingReview(
  workspaceId: string | null,
  projectId: string | null,
  opts?: {
    runId?: string | null
    relationType?: MappingRelationTypeValue
  }
) {
  const [relationType, setRelationType] = useState<MappingRelationTypeValue>(
    opts?.relationType ?? MappingRelationType.RequirementToFunction
  )
  const [scope, setScope] = useState<MappingScopeValue>(MappingScope.Unmapped)
  const [run, setRun] = useState<MappingRun | null>(null)
  const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([])
  const [draftTargets, setDraftTargets] = useState<Map<string, string>>(new Map())
  const [labels, setLabels] = useState<Map<string, EntityLabel>>(new Map())
  const [currentParents, setCurrentParents] = useState<Map<string, string | null>>(new Map())
  const [testCaseVersions, setTestCaseVersions] = useState<Map<string, number>>(new Map())
  const [undoStack, setUndoStack] = useState<MappingUndoEntry[]>([])
  const [reviewDurationsMs, setReviewDurationsMs] = useState<number[]>([])
  const [reviewClockStartedAt, setReviewClockStartedAt] = useState<number | null>(null)
  const [evalHistory, setEvalHistory] = useState<MappingEvalSnapshot[]>([])
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set())
  const [autoMapEnabled, setAutoMapEnabledState] = useState(false)
  const [autoMapAudit, setAutoMapAudit] = useState<AutoMapAuditEntry[]>([])
  const [autoMapping, setAutoMapping] = useState(false)
  const [filter, setFilter] = useState<MappingFilterChip>('ALL')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applyResult, setApplyResult] = useState<ApplyMappingDraftResult | null>(null)

  const hydrateContext = useCallback(
    async (items: MappingSuggestion[], type: MappingRelationTypeValue) => {
      const map = new Map<string, EntityLabel>()
      const versions = new Map<string, number>()
      const parents = new Map<string, string | null>()
      const tcVersions = new Map<string, number>()

      const put = (id: string | null | undefined, label: EntityLabel, version?: number | null) => {
        if (!id) return
        map.set(id, label)
        if (version != null) versions.set(id, version)
      }

      if (!projectId) {
        return { labels: map, versions, parents, tcVersions }
      }

      try {
        if (type === MappingRelationType.RequirementToFunction) {
          const [reqs, fns] = await Promise.all([
            requirementsApi
              .listRequirements(workspaceId ?? '', projectId, { limit: 500 })
              .catch(() => ({ items: [] })),
            catalogApi.listFunctionalItems(projectId).catch(() => ({ items: [] })),
          ])
          for (const r of reqs.items) {
            put(r.id, { id: r.id, code: r.code, name: r.title })
            if (r.functionalItemId) parents.set(r.id, r.functionalItemId)
          }
          for (const f of fns.items) put(f.id, { id: f.id, code: f.code, name: f.title })
        }

        if (type === MappingRelationType.FunctionToUseCase) {
          const [fns, useCases] = await Promise.all([
            catalogApi.listFunctionalItems(projectId).catch(() => ({ items: [] })),
            useCaseApi.listUseCases(projectId).catch(() => []),
          ])
          for (const f of fns.items) put(f.id, { id: f.id, code: f.code, name: f.title })
          for (const uc of useCases) {
            put(uc.id, { id: uc.id, code: uc.key, name: uc.name }, uc.version)
            parents.set(uc.id, uc.primaryFunctionId ?? null)
          }
        }

        if (type === MappingRelationType.UseCaseToTestCase) {
          const [useCases, tcs] = await Promise.all([
            useCaseApi.listUseCases(projectId).catch(() => []),
            qualityApi
              .listTestCases(projectId, { page: 0, size: 500 })
              .catch(() => ({
                items: [] as Array<{
                  id: string
                  code?: string | null
                  title: string
                  version?: number
                  useCaseId?: string | null
                }>,
              })),
          ])
          for (const uc of useCases) {
            put(uc.id, { id: uc.id, code: uc.key, name: uc.name }, uc.version)
          }
          for (const tc of tcs.items) {
            put(tc.id, {
              id: tc.id,
              code: tc.code ?? shortId(tc.id),
              name: tc.title,
            }, tc.version)
            parents.set(tc.id, tc.useCaseId ?? null)
            if (tc.version != null) tcVersions.set(tc.id, tc.version)
          }
        }
      } catch {
        // optional
      }

      for (const s of items) {
        if (!map.has(s.sourceId)) map.set(s.sourceId, fallbackLabel(s.sourceId))
        if (s.targetId && !map.has(s.targetId)) map.set(s.targetId, fallbackLabel(s.targetId))
      }

      return { labels: map, versions, parents, tcVersions }
    },
    [projectId, workspaceId]
  )

  const enrichItems = useCallback(
    (
      items: MappingSuggestion[],
      versions: Map<string, number>,
      parents: Map<string, string | null>
    ): MappingSuggestion[] => {
      return items.map((s) => {
        const withParent: MappingSuggestion = {
          ...s,
          currentTargetId: parents.has(s.sourceId) ? parents.get(s.sourceId) ?? null : s.currentTargetId,
        }
        return enrichSuggestionFreshness(
          withParent,
          versions.get(s.sourceId),
          s.targetId ? versions.get(s.targetId) : null
        )
      })
    },
    []
  )

  const loadSuggestions = useCallback(
    async (runId: string, type: MappingRelationTypeValue) => {
      if (!projectId) return
      setLoading(true)
      setError(null)
      try {
        const page = await mappingApi.listMappingSuggestions(projectId, {
          runId,
          relationType: type,
          page: 0,
          size: 100,
        })
        const ctx = await hydrateContext(page.items, type)
        setLabels(ctx.labels)
        setCurrentParents(ctx.parents)
        setTestCaseVersions(ctx.tcVersions)
        const enriched = enrichItems(page.items, ctx.versions, ctx.parents)
        setSuggestions(enriched)
        setDraftTargets((prev) => {
          const next = new Map<string, string>()
          for (const [id, targetId] of prev) {
            if (enriched.some((s) => s.id === id)) next.set(id, targetId)
          }
          return next
        })
        setSelectedIds(new Set())
        setFocusedId(enriched[0]?.id ?? null)
        setReviewClockStartedAt(Date.now())
        setReviewDurationsMs([])
        setEscalatedIds(new Set())
        if (projectId) {
          setEvalHistory(listMappingEvalSnapshots(projectId))
          setAutoMapEnabledState(getAutoMapEnabled(projectId))
          setAutoMapAudit(listAutoMapAudit(projectId))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load suggestions')
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    },
    [projectId, hydrateContext, enrichItems]
  )

  useEffect(() => {
    if (opts?.relationType && opts.relationType !== relationType) {
      setRelationType(opts.relationType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.relationType])

  useEffect(() => {
    const runId = opts?.runId
    if (!projectId || !runId) {
      if (!runId) {
        setRun(null)
        setSuggestions([])
        setDraftTargets(new Map())
      }
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const next = await mappingApi.getMappingRun(projectId, runId)
        if (cancelled) return
        setRun(next)
        const type = (next.relationType as MappingRelationTypeValue) || relationType
        setRelationType(type)
        if (next.scope) setScope(next.scope as MappingScopeValue)
        await loadSuggestions(runId, type)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load mapping run')
        setRun(null)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, opts?.runId])

  const effectiveAll = useMemo(
    () => mergeDraftTargets(suggestions, draftTargets),
    [suggestions, draftTargets]
  )

  const generate = useCallback(async () => {
    if (!projectId) return null
    setGenerating(true)
    setError(null)
    setApplyResult(null)
    try {
      const next = await mappingApi.generateMappingSuggestions(projectId, {
        relationType,
        scope,
      })
      setRun(next)
      toast.success(
        next.status === 'FAILED'
          ? 'Mapping run failed'
          : `Generated ${next.suggestionCount ?? 0} suggestion(s) from ${next.sourceCount ?? 0} source(s)`
      )
      if (next.id) {
        await loadSuggestions(next.id, relationType)
      }
      return next
    } catch (err) {
      const message = mappingGenerateErrorMessage(err)
      setError(message)
      toast.error(message)
      return null
    } finally {
      setGenerating(false)
    }
  }, [projectId, relationType, scope, loadSuggestions])

  const review = useCallback(
    async (decision: typeof ReviewDecision.Accept | typeof ReviewDecision.Reject, ids?: string[]) => {
      if (!projectId) return
      const targetIds = ids ?? [...selectedIds]
      if (targetIds.length === 0) return

      // Block accepting stale
      if (decision === ReviewDecision.Accept) {
        const staleIds = targetIds.filter((id) => {
          const s = effectiveAll.find((x) => x.id === id)
          return s && isStaleSuggestion(s)
        })
        if (staleIds.length > 0) {
          toast.error(
            `${staleIds.length} outdated suggestion(s) cannot be accepted. Regenerate or dismiss them.`
          )
          return
        }
      }

      setReviewing(true)
      setError(null)
      try {
        if (reviewClockStartedAt != null) {
          const elapsed = Date.now() - reviewClockStartedAt
          const perItem = targetIds.length > 0 ? elapsed / targetIds.length : elapsed
          setReviewDurationsMs((prev) => [...prev, ...targetIds.map(() => perItem)])
          setReviewClockStartedAt(Date.now())
        }
        await mappingApi.reviewMappingSuggestions(projectId, {
          decisions: targetIds.map((suggestionId) => ({ suggestionId, decision })),
        })
        toast.success(
          decision === ReviewDecision.Accept
            ? `Accepted ${targetIds.length} suggestion(s)`
            : `Rejected ${targetIds.length} suggestion(s)`
        )
        if (run?.id) await loadSuggestions(run.id, relationType)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to review suggestions'
        setError(message)
        toast.error(message)
      } finally {
        setReviewing(false)
      }
    },
    [projectId, selectedIds, run?.id, relationType, loadSuggestions, effectiveAll, reviewClockStartedAt]
  )

  const keepCurrent = useCallback(
    async (suggestionId: string) => {
      await review(ReviewDecision.Reject, [suggestionId])
    },
    [review]
  )

  const replaceMapping = useCallback(
    async (suggestionId: string) => {
      await review(ReviewDecision.Accept, [suggestionId])
    },
    [review]
  )

  const acceptReady = useCallback(async () => {
    const readyIds = effectiveAll
      .filter(
        (s) =>
          isPendingSuggestion(s) &&
          getMappingReviewBucket(s) === MappingReviewBucket.Ready &&
          !isStaleSuggestion(s) &&
          !isRemapCandidate(s)
      )
      .map((s) => s.id)
    if (readyIds.length === 0) {
      toast.message('No ready suggestions to accept')
      return
    }
    await review(ReviewDecision.Accept, readyIds)
  }, [effectiveAll, review])

  const apply = useCallback(async () => {
    if (!projectId || !run?.id) return null
    setApplying(true)
    setError(null)
    try {
      const accepted = effectiveAll.filter(
        (s) =>
          s.reviewStatus === SuggestionReviewStatus.Accepted &&
          s.targetId &&
          !isStaleSuggestion(s)
      )
      const hasDraftRemaps = accepted.some((s) => draftTargets.has(s.id))
      const hasReplace = accepted.some((s) => isRemapCandidate(s))

      let result: ApplyMappingDraftResult
      if (hasDraftRemaps || hasReplace) {
        const detailed = await applyAcceptedWithEffectiveTargets(
          projectId,
          relationType,
          accepted,
          draftTargets,
          testCaseVersions,
          currentParents
        )
        result = {
          created: detailed.created,
          skippedStale: detailed.skippedStale,
          skippedConflict: detailed.skippedConflict,
          failed: detailed.failed,
        }
        if (detailed.applied.length > 0) {
          setUndoStack((prev) => [
            ...buildUndoEntriesFromApply(relationType, detailed.applied),
            ...prev,
          ])
        }
      } else {
        result = await mappingApi.applyMappingDraft(projectId, run.id)
        // Capture undo approx for BE apply (previous was null for unmapped scope)
        const appliedApprox = accepted
          .filter((s) => s.targetId)
          .map((s) => ({
            suggestionId: s.id,
            sourceId: s.sourceId,
            appliedTargetId: s.targetId as string,
            previousTargetId: currentParents.get(s.sourceId) ?? null,
          }))
        if (result.created > 0 && appliedApprox.length > 0) {
          setUndoStack((prev) => [
            ...buildUndoEntriesFromApply(relationType, appliedApprox.slice(0, result.created)),
            ...prev,
          ])
        }
      }

      setApplyResult(result)
      setDraftTargets(new Map())
      toast.success(
        `Applied: ${result.created} created · ${result.skippedConflict} conflict · ${result.skippedStale} stale · ${result.failed} failed`
      )
      await loadSuggestions(run.id, relationType)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply mappings'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setApplying(false)
    }
  }, [
    projectId,
    run?.id,
    relationType,
    effectiveAll,
    draftTargets,
    testCaseVersions,
    currentParents,
    loadSuggestions,
  ])

  const undoLast = useCallback(async () => {
    if (!projectId || undoStack.length === 0) return
    const [entry, ...rest] = undoStack
    setUndoing(true)
    try {
      await undoAppliedRelation(projectId, entry.relationType, entry, testCaseVersions)
      setUndoStack(rest)
      if (entry.suggestionId) {
        markAutoMapAuditUndone(projectId, [entry.suggestionId])
        setAutoMapAudit(listAutoMapAudit(projectId))
      }
      toast.success('Undid last mapping apply')
      if (run?.id) await loadSuggestions(run.id, relationType)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Undo failed')
    } finally {
      setUndoing(false)
    }
  }, [projectId, undoStack, testCaseVersions, run?.id, relationType, loadSuggestions])

  const changeDraftTarget = useCallback(
    (suggestionId: string, targetId: string, label?: EntityLabel) => {
      setDraftTargets((prev) => {
        const next = new Map(prev)
        next.set(suggestionId, targetId)
        return next
      })
      if (label) {
        setLabels((prev) => {
          const next = new Map(prev)
          next.set(targetId, label)
          return next
        })
      }
      toast.message('Draft target updated — Apply to write the relation')
    },
    []
  )

  const counts: MappingBucketCounts = useMemo(
    () => countMappingBuckets(effectiveAll),
    [effectiveAll]
  )

  const avgReviewMs = useMemo(() => {
    if (reviewDurationsMs.length === 0) return null
    return reviewDurationsMs.reduce((a, b) => a + b, 0) / reviewDurationsMs.length
  }, [reviewDurationsMs])

  const evalMetrics = useMemo(
    () => computeMappingEvalMetrics(effectiveAll, run, { avgReviewMs }),
    [effectiveAll, run, avgReviewMs]
  )

  const captureEvalSnapshot = useCallback(() => {
    if (!projectId || !run?.id) return null
    const snap = saveMappingEvalSnapshot(projectId, run.id, relationType, evalMetrics)
    setEvalHistory(listMappingEvalSnapshots(projectId))
    toast.success('Evaluation snapshot saved locally')
    return snap
  }, [projectId, run?.id, relationType, evalMetrics])

  const toggleEscalated = useCallback((id: string) => {
    setEscalatedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Load automap settings when project changes
  useEffect(() => {
    if (!projectId) return
    setAutoMapEnabledState(getAutoMapEnabled(projectId))
    setAutoMapAudit(listAutoMapAudit(projectId))
  }, [projectId])

  const setAutoMapEnabled = useCallback(
    (enabled: boolean) => {
      if (!projectId) return
      persistAutoMapEnabled(projectId, enabled)
      setAutoMapEnabledState(enabled)
      toast.message(enabled ? 'Auto-map enabled for this project' : 'Auto-map disabled')
    },
    [projectId]
  )

  const autoMapEligible = useMemo(
    () => listAutoMapEligible(effectiveAll, { escalatedIds }),
    [effectiveAll, escalatedIds]
  )

  const autoMapGate = useMemo(
    () =>
      checkAutoMapReady({
        enabled: autoMapEnabled,
        gateReadyForAutoMap: evalMetrics.gateReadyForAutoMap,
        gateNotes: evalMetrics.gateNotes,
        eligible: autoMapEligible,
      }),
    [autoMapEnabled, evalMetrics.gateReadyForAutoMap, evalMetrics.gateNotes, autoMapEligible]
  )

  const runAutoMap = useCallback(async () => {
    if (!projectId || !run?.id) return null
    const gate = checkAutoMapReady({
      enabled: autoMapEnabled,
      gateReadyForAutoMap: evalMetrics.gateReadyForAutoMap,
      gateNotes: evalMetrics.gateNotes,
      eligible: autoMapEligible,
    })
    if (!gate.ok) {
      toast.error(gate.reasons[0] ?? 'Auto-map blocked')
      return null
    }

    setAutoMapping(true)
    setError(null)
    try {
      const ids = autoMapEligible.map((s) => s.id)
      await mappingApi.reviewMappingSuggestions(projectId, {
        decisions: ids.map((suggestionId) => ({
          suggestionId,
          decision: ReviewDecision.Accept,
        })),
      })

      // Re-fetch so accepted status is current, then apply with domain path
      const page = await mappingApi.listMappingSuggestions(projectId, {
        runId: run.id,
        relationType,
        page: 0,
        size: 100,
      })
      const ctx = await hydrateContext(page.items, relationType)
      const enriched = enrichItems(page.items, ctx.versions, ctx.parents)
      setSuggestions(enriched)
      setLabels(ctx.labels)
      setCurrentParents(ctx.parents)
      setTestCaseVersions(ctx.tcVersions)

      const accepted = mergeDraftTargets(enriched, draftTargets).filter(
        (s) =>
          ids.includes(s.id) &&
          s.reviewStatus === SuggestionReviewStatus.Accepted &&
          s.targetId &&
          !isStaleSuggestion(s)
      )

      const detailed = await applyAcceptedWithEffectiveTargets(
        projectId,
        relationType,
        accepted,
        new Map(),
        ctx.tcVersions,
        ctx.parents
      )

      setApplyResult({
        created: detailed.created,
        skippedStale: detailed.skippedStale,
        skippedConflict: detailed.skippedConflict,
        failed: detailed.failed,
      })

      if (detailed.applied.length > 0) {
        setUndoStack((prev) => [
          ...buildUndoEntriesFromApply(relationType, detailed.applied),
          ...prev,
        ])
        const at = new Date().toISOString()
        const audit = detailed.applied.map((row) => ({
          id: `${row.suggestionId}:${at}`,
          projectId,
          runId: run.id,
          relationType,
          suggestionId: row.suggestionId,
          sourceId: row.sourceId,
          targetId: row.appliedTargetId,
          relationSource: MappingRelationSource.AiAutoMapped,
          at,
        }))
        appendAutoMapAudit(audit)
        setAutoMapAudit(listAutoMapAudit(projectId))
      }

      toast.success(
        `Auto-mapped ${detailed.created} relation(s) · ${detailed.skippedConflict} conflict · ${detailed.failed} failed`
      )
      await loadSuggestions(run.id, relationType)
      return detailed
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auto-map failed'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setAutoMapping(false)
    }
  }, [
    projectId,
    run?.id,
    autoMapEnabled,
    evalMetrics.gateReadyForAutoMap,
    evalMetrics.gateNotes,
    autoMapEligible,
    relationType,
    hydrateContext,
    enrichItems,
    draftTargets,
    loadSuggestions,
  ])

  const filtered = useMemo(() => {
    return effectiveAll.filter((s) => {
      if (filter === 'ALL') return true
      if (filter === 'HAS_WARNING') return s.warnings.length > 0
      if (filter === 'OUTDATED') return isStaleSuggestion(s)
      if (filter === 'REMAP') return isRemapCandidate(s)
      if (filter === 'ACCEPTED') return s.reviewStatus === 'ACCEPTED'
      if (filter === 'REJECTED') return s.reviewStatus === 'REJECTED'
      if (!isPendingSuggestion(s)) return false
      return getMappingReviewBucket(s) === filter
    })
  }, [effectiveAll, filter])

  const getLabel = useCallback(
    (id: string | null | undefined): EntityLabel => {
      if (!id) return { id: '', code: '—', name: '—' }
      return labels.get(id) ?? fallbackLabel(id)
    },
    [labels]
  )

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectMany = useCallback((ids: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (selected) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const focusNext = useCallback(
    (dir: 1 | -1) => {
      if (filtered.length === 0) return
      const idx = focusedId ? filtered.findIndex((s) => s.id === focusedId) : -1
      const nextIdx = Math.max(0, Math.min(filtered.length - 1, (idx < 0 ? 0 : idx) + dir))
      setFocusedId(filtered[nextIdx]?.id ?? null)
    },
    [filtered, focusedId]
  )

  const changeRelationType = useCallback((type: MappingRelationTypeValue) => {
    setRelationType(type)
    setRun(null)
    setSuggestions([])
    setDraftTargets(new Map())
    setSelectedIds(new Set())
    setApplyResult(null)
    setError(null)
    setFilter('ALL')
    setFocusedId(null)
  }, [])

  return {
    relationType,
    setRelationType: changeRelationType,
    scope,
    setScope,
    run,
    suggestions: filtered,
    allSuggestions: effectiveAll,
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
    draftRemapCount: draftTargets.size,
    changeDraftTarget,
    keepCurrent,
    replaceMapping,
    undoStack,
    undoLast,
    canUndo: undoStack.length > 0,
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
    autoMapEligibleCount: autoMapEligible.length,
    autoMapGate,
    runAutoMap,
    autoMapping,
    autoMapAudit,
    refetch: run?.id ? () => loadSuggestions(run.id, relationType) : async () => undefined,
  }
}
