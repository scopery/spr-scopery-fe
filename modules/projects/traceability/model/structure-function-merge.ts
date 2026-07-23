import type { FunctionalItem } from './functional-catalog'
import type {
  OverallStructureFunctionRef,
  OverallStructureResponse,
} from './overall-structure'

/**
 * overall-structure only returns Functions already assigned to modules.
 * Merge project functional-items so unassigned FRs appear and ownership matches catalog.
 * Preserves screens/apis already loaded on matching BE function nodes.
 */
export function mergeFunctionalItemsIntoTree(
  tree: OverallStructureResponse,
  items: FunctionalItem[]
): OverallStructureResponse {
  if (items.length === 0) return tree

  const existingById = new Map<string, OverallStructureFunctionRef>()
  for (const mod of tree.modules) {
    for (const fn of mod.functions) existingById.set(fn.id, fn)
  }
  for (const fn of tree.unassignedFunctions ?? []) {
    existingById.set(fn.id, fn)
  }

  const byModule = new Map<string, OverallStructureFunctionRef[]>()
  const unassigned: OverallStructureFunctionRef[] = []

  for (const fi of items) {
    const prev = existingById.get(fi.id)
    const ref: OverallStructureFunctionRef = {
      id: fi.id,
      projectId: fi.projectId,
      code: fi.code,
      title: fi.title,
      moduleId: fi.moduleId ?? null,
      screens: prev?.screens ?? [],
      apis: prev?.apis ?? [],
    }
    if (fi.moduleId) {
      const list = byModule.get(fi.moduleId) ?? []
      list.push(ref)
      byModule.set(fi.moduleId, list)
    } else {
      unassigned.push(ref)
    }
  }

  return {
    ...tree,
    modules: tree.modules.map((m) => ({
      ...m,
      functions: byModule.get(m.id) ?? [],
    })),
    unassignedFunctions: unassigned,
  }
}
