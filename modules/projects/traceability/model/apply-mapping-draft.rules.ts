import * as useCaseApi from '../api/use-case.api'
import * as traceApi from '../api/traceability.api'
import { linkRequirementToFunctionWithCovers } from '../api/requirement-function-link.api'
import * as qualityApi from '@/modules/quality/infrastructure/api/quality.api'
import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'
import { isRequirementLinkConflict } from '../domain/rules/requirement-link.rules'
import {
  MappingRelationType,
  SuggestionReviewStatus,
  type ApplyMappingDraftResult,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingSuggestion,
} from './mapping-suggestions'
import { isStaleSuggestion } from './mapping-phase3.rules'

export interface AppliedRelationDetail {
  suggestionId: string
  sourceId: string
  appliedTargetId: string
  previousTargetId: string | null
}

export interface ApplyWithDetailsResult extends ApplyMappingDraftResult {
  applied: AppliedRelationDetail[]
}

/**
 * Apply accepted suggestions using effective (draft) targets via domain APIs.
 * Skips stale. Overwrites single-parent mappings (remap).
 */
export async function applyAcceptedWithEffectiveTargets(
  projectId: string,
  relationType: MappingRelationTypeValue,
  accepted: MappingSuggestion[],
  draftTargets: Map<string, string>,
  testCaseVersions?: Map<string, number>,
  currentParents?: Map<string, string | null>
): Promise<ApplyWithDetailsResult> {
  let created = 0
  let skippedConflict = 0
  let failed = 0
  let skippedStale = 0
  const applied: AppliedRelationDetail[] = []

  for (const s of accepted) {
    if (s.reviewStatus !== SuggestionReviewStatus.Accepted) continue
    if (isStaleSuggestion(s)) {
      skippedStale += 1
      continue
    }
    const targetId = draftTargets.get(s.id) ?? s.targetId
    if (!targetId) continue

    const previousTargetId =
      currentParents?.get(s.sourceId) ?? s.currentTargetId ?? null

    try {
      const ok = await applyOne(
        projectId,
        relationType,
        s.sourceId,
        targetId,
        testCaseVersions,
        { forceReplace: Boolean(previousTargetId && previousTargetId !== targetId) }
      )
      if (ok) {
        created += 1
        applied.push({
          suggestionId: s.id,
          sourceId: s.sourceId,
          appliedTargetId: targetId,
          previousTargetId,
        })
      } else skippedConflict += 1
    } catch {
      failed += 1
    }
  }

  return { created, skippedStale, skippedConflict, failed, applied }
}

async function applyOne(
  projectId: string,
  relationType: MappingRelationTypeValue,
  sourceId: string,
  targetId: string,
  testCaseVersions?: Map<string, number>,
  opts?: { forceReplace?: boolean }
): Promise<boolean> {
  if (relationType === MappingRelationType.RequirementToFunction) {
    // Junction (idempotent) + COVERS — BE no longer creates COVERS in link action.
    await linkRequirementToFunctionWithCovers(projectId, targetId, sourceId)
    return true
  }

  if (relationType === MappingRelationType.FunctionToUseCase) {
    const detail = await useCaseApi.getUseCaseDetail(projectId, sourceId)
    const current = detail.overview.primaryFunctionId ?? null
    if (current && current === targetId) return false
    if (current && !opts?.forceReplace && current !== targetId) return false
    await useCaseApi.updateUseCase(projectId, sourceId, {
      name: detail.overview.name,
      status: detail.overview.status,
      primaryFunctionId: targetId,
    })
    return true
  }

  const version = testCaseVersions?.get(sourceId)
  let ver = version
  if (ver == null) {
    const listed = await qualityApi.listTestCases(projectId, { page: 0, size: 500 })
    const row = listed.items.find((t) => t.id === sourceId)
    if (row?.version == null) return false
    ver = row.version
  }

  const listed = await qualityApi.listTestCases(projectId, { page: 0, size: 500 }).catch(() => null)
  const row = listed?.items.find((t) => t.id === sourceId)
  const current = row?.useCaseId ?? null
  if (current && current === targetId) return false
  if (current && !opts?.forceReplace && current !== targetId) return false

  await qualityApi.updateTestCase(projectId, sourceId, {
    useCaseId: targetId,
    version: ver,
  })
  return true
}

export async function undoAppliedRelation(
  projectId: string,
  relationType: MappingRelationTypeValue,
  entry: {
    sourceId: string
    previousTargetId: string | null
    appliedTargetId: string
  },
  testCaseVersions?: Map<string, number>
): Promise<void> {
  if (relationType === MappingRelationType.RequirementToFunction) {
    // Drop junction; best-effort remove COVERS for the applied target.
    await useCaseApi
      .unlinkRequirementFromFunction(projectId, entry.appliedTargetId, entry.sourceId)
      .catch(() => undefined)
    try {
      const res = await traceApi.listTraceLinks(projectId, {
        linkType: TraceLinkType.Covers,
        sourceType: 'REQUIREMENT',
        sourceId: entry.sourceId,
        targetType: 'FUNCTIONAL_ITEM',
        limit: 50,
      })
      const cover = res.items.find((l) => l.targetId === entry.appliedTargetId)
      if (cover) await traceApi.deleteTraceLink(projectId, cover.id)
    } catch {
      // best-effort
    }
    if (entry.previousTargetId) {
      await linkRequirementToFunctionWithCovers(
        projectId,
        entry.previousTargetId,
        entry.sourceId
      )
    }
    return
  }

  if (relationType === MappingRelationType.FunctionToUseCase) {
    const detail = await useCaseApi.getUseCaseDetail(projectId, entry.sourceId)
    await useCaseApi.updateUseCase(projectId, entry.sourceId, {
      name: detail.overview.name,
      status: detail.overview.status,
      primaryFunctionId: entry.previousTargetId,
    })
    return
  }

  let ver = testCaseVersions?.get(entry.sourceId)
  if (ver == null) {
    const listed = await qualityApi.listTestCases(projectId, { page: 0, size: 500 })
    const row = listed.items.find((t) => t.id === entry.sourceId)
    ver = row?.version ?? 1
  }
  await qualityApi.updateTestCase(projectId, entry.sourceId, {
    useCaseId: entry.previousTargetId,
    version: ver,
  })
}

export function mergeDraftTargets(
  items: MappingSuggestion[],
  draftTargets: Map<string, string>
): MappingSuggestion[] {
  if (draftTargets.size === 0) return items
  return items.map((s) => {
    const next = draftTargets.get(s.id)
    if (!next || next === s.targetId) return s
    return {
      ...s,
      targetId: next,
      decision: s.decision === 'NO_MATCH' ? 'SUGGEST' : s.decision,
    }
  })
}
