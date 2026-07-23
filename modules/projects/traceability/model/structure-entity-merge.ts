import type { RegistryDataEntity } from './application-registry'
import type {
  OverallStructureEntityRef,
  OverallStructureResponse,
} from './overall-structure'

/**
 * overall-structure often omits Entity ownership under modules.
 * Merge application data-entities (moduleId) into the tree so relations show.
 */
export function mergeDataEntitiesIntoTree(
  tree: OverallStructureResponse,
  entities: RegistryDataEntity[]
): OverallStructureResponse {
  const byModule = new Map<string, OverallStructureEntityRef[]>()
  const unassigned: OverallStructureEntityRef[] = []

  for (const e of entities) {
    const ref: OverallStructureEntityRef = {
      id: e.id,
      code: e.code,
      name: e.name,
      tableName: e.tableName,
      moduleId: e.moduleId ?? null,
    }
    if (e.moduleId) {
      const list = byModule.get(e.moduleId) ?? []
      list.push(ref)
      byModule.set(e.moduleId, list)
    } else {
      unassigned.push(ref)
    }
  }

  // If catalog returned nothing, keep BE tree as-is
  if (entities.length === 0) return tree

  return {
    ...tree,
    modules: tree.modules.map((m) => ({
      ...m,
      entities: byModule.get(m.id) ?? [],
    })),
    unassignedEntities: unassigned,
  }
}
