import type { FunctionalItem } from './functional-catalog'
import type {
  OverallStructureFunctionRef,
  OverallStructureResponse,
} from './overall-structure'

/**
 * overall-structure returns Functions assigned to modules across ALL projects.
 * Replace with the selected project's catalog so linking uses the correct projectId.
 * Preserves screens/apis/communications already loaded on matching BE function nodes.
 *
 * Empty catalog → clear all Functions (do not keep foreign-project FRs from BE tree).
 */
export function mergeFunctionalItemsIntoTree(
  tree: OverallStructureResponse,
  items: FunctionalItem[]
): OverallStructureResponse {
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
      communications: prev?.communications ?? [],
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

/** Keep only Functions owned by the selected project (when projectId is known on nodes). */
export function filterTreeFunctionsByProject(
  tree: OverallStructureResponse,
  projectId: string
): OverallStructureResponse {
  const keep = (fn: OverallStructureFunctionRef) =>
    !fn.projectId || fn.projectId === projectId

  return {
    ...tree,
    modules: tree.modules.map((m) => ({
      ...m,
      functions: m.functions.filter(keep),
    })),
    unassignedFunctions: (tree.unassignedFunctions ?? []).filter(keep),
  }
}

export function findFunctionProjectId(
  tree: OverallStructureResponse | null,
  functionId: string
): string | null {
  if (!tree) return null
  for (const mod of tree.modules) {
    const fn = mod.functions.find((f) => f.id === functionId)
    if (fn?.projectId) return fn.projectId
  }
  const unassigned = tree.unassignedFunctions?.find((f) => f.id === functionId)
  return unassigned?.projectId ?? null
}
