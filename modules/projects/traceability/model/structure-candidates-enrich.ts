import type {
  OverallStructureResponse,
  StructureCandidateItem,
  StructureCandidatesResponse,
  StructureFocus,
} from './overall-structure'
import { StructureFocusType } from './overall-structure'

/** IDs already linked to the focused node, derived from the loaded tree. */
export function linkedIdsForFocus(
  tree: OverallStructureResponse | null,
  focus: StructureFocus | null
): Set<string> {
  const ids = new Set<string>()
  if (!tree || !focus) return ids

  if (focus.type === StructureFocusType.Function) {
    for (const mod of tree.modules) {
      const fn = mod.functions.find((f) => f.id === focus.id)
      if (fn) {
        for (const s of fn.screens) ids.add(s.id)
        for (const a of fn.apis) ids.add(a.id)
        for (const c of fn.communications ?? []) ids.add(c.id)
        return ids
      }
    }
    for (const fn of tree.unassignedFunctions ?? []) {
      if (fn.id === focus.id) {
        for (const s of fn.screens ?? []) ids.add(s.id)
        for (const a of fn.apis ?? []) ids.add(a.id)
        for (const c of fn.communications ?? []) ids.add(c.id)
        return ids
      }
    }
  }

  if (focus.type === StructureFocusType.Screen) {
    for (const mod of tree.modules) {
      for (const fn of mod.functions) {
        const scr = fn.screens.find((s) => s.id === focus.id)
        if (scr) {
          for (const c of scr.components) ids.add(c.id)
          return ids
        }
      }
    }
  }

  if (focus.type === StructureFocusType.Module) {
    const mod = tree.modules.find((m) => m.id === focus.id)
    if (mod) {
      for (const fn of mod.functions) ids.add(fn.id)
      for (const ent of mod.entities) ids.add(ent.id)
    }
  }

  return ids
}

function markLinked(
  items: StructureCandidateItem[] | undefined,
  linkedIds: Set<string>,
  focusId: string
): StructureCandidateItem[] | undefined {
  if (!items) return items
  return items.map((item) => {
    const linked =
      Boolean(item.alreadyLinked) || linkedIds.has(item.id) || item.id === focusId
    return {
      ...item,
      alreadyLinked: linked,
      hasExistingLink: Boolean(item.hasExistingLink) || linked,
    }
  })
}

/** Merge BE candidates with tree-derived alreadyLinked flags (incl. self = focus). */
export function enrichCandidatesWithLinkedState(
  candidates: StructureCandidatesResponse | null,
  tree: OverallStructureResponse | null,
  focus: StructureFocus | null
): StructureCandidatesResponse | null {
  if (!candidates || !focus) return candidates
  const linkedIds = linkedIdsForFocus(tree, focus)
  return {
    ...candidates,
    screens: markLinked(candidates.screens, linkedIds, focus.id),
    apis: markLinked(candidates.apis, linkedIds, focus.id),
    components: markLinked(candidates.components, linkedIds, focus.id),
    functions: markLinked(candidates.functions, linkedIds, focus.id),
    entities: markLinked(candidates.entities, linkedIds, focus.id),
    communications: markLinked(candidates.communications, linkedIds, focus.id),
    modules: markLinked(candidates.modules, linkedIds, focus.id),
    nfrs: markLinked(candidates.nfrs, linkedIds, focus.id),
    nfrTargets: markLinked(candidates.nfrTargets, linkedIds, focus.id),
  }
}
