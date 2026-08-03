import * as catalogApi from '../api/functional-catalog.api'
import * as useCaseApi from '../api/use-case.api'
import {
  MappingRelationType,
  type EntityLabel,
  type MappingRelationType as MappingRelationTypeValue,
} from './mapping-suggestions'

export interface MappingCandidate extends EntityLabel {
  group: 'AI' | 'SAME_MODULE' | 'ALL'
  moduleId?: string | null
}

/** Catalog-backed candidates for inline Change picker (BE mapping-candidates not shipped yet). */
export async function loadMappingCandidates(
  projectId: string,
  relationType: MappingRelationTypeValue,
  _sourceId: string,
  search?: string
): Promise<MappingCandidate[]> {
  return listEligibleMappingCandidates(projectId, relationType, { search })
}

export async function listEligibleMappingCandidates(
  projectId: string,
  relationType: MappingRelationTypeValue,
  opts?: { search?: string; excludeIds?: Set<string> }
): Promise<MappingCandidate[]> {
  const q = opts?.search?.trim().toLowerCase() ?? ''
  const exclude = opts?.excludeIds ?? new Set<string>()
  const match = (code: string, name: string) => {
    if (!q) return true
    return `${code} ${name}`.toLowerCase().includes(q)
  }

  if (
    relationType === MappingRelationType.RequirementToFunction ||
    relationType === MappingRelationType.FunctionToUseCase
  ) {
    const res = await catalogApi.listFunctionalItems(projectId).catch(() => ({ items: [] }))
    return res.items
      .filter((f) => !exclude.has(f.id) && match(f.code, f.title))
      .map((f) => ({
        id: f.id,
        code: f.code,
        name: f.title,
        group: 'ALL' as const,
        moduleId: f.moduleId ?? null,
      }))
  }

  const useCases = await useCaseApi.listUseCases(projectId).catch(() => [])
  return useCases
    .filter((uc) => !exclude.has(uc.id) && match(uc.key, uc.name))
    .map((uc) => ({
      id: uc.id,
      code: uc.key,
      name: uc.name,
      group: 'ALL' as const,
      moduleId: null,
    }))
}

/** Suggested targets already present for this source in the current run (AI group). */
export function partitionCandidates(
  all: MappingCandidate[],
  aiTargetIds: string[]
): { ai: MappingCandidate[]; rest: MappingCandidate[] } {
  const aiSet = new Set(aiTargetIds)
  const ai: MappingCandidate[] = []
  const rest: MappingCandidate[] = []
  for (const c of all) {
    if (aiSet.has(c.id)) ai.push({ ...c, group: 'AI' })
    else rest.push(c)
  }
  return { ai, rest }
}
