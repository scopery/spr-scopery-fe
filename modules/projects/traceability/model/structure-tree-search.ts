import type {
  OverallStructureResponse,
  StructureFocus,
} from './overall-structure'
import { StructureFocusType } from './overall-structure'

export interface StructureSearchHit {
  focus: StructureFocus
  label: string
  kind: string
  path: string
  /** Ancestor expand keys (moduleId, functionId, …) */
  expandKeys: string[]
}

export function searchOverallStructure(
  tree: OverallStructureResponse,
  query: string
): StructureSearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: StructureSearchHit[] = []

  const match = (...parts: Array<string | null | undefined>) =>
    parts.some((p) => p && p.toLowerCase().includes(q))

  for (const mod of tree.modules) {
    if (match(mod.code, mod.name, mod.description)) {
      hits.push({
        focus: { type: StructureFocusType.Module, id: mod.id },
        label: mod.name,
        kind: 'MODULE',
        path: mod.code,
        expandKeys: [],
      })
    }
    for (const fn of mod.functions) {
      const fnPath = `${mod.name} / ${fn.title}`
      if (match(fn.code, fn.title)) {
        hits.push({
          focus: { type: StructureFocusType.Function, id: fn.id },
          label: fn.title,
          kind: 'FUNCTION',
          path: fnPath,
          expandKeys: [mod.id],
        })
      }
      for (const scr of fn.screens) {
        if (match(scr.code, scr.name, scr.routePath)) {
          hits.push({
            focus: { type: StructureFocusType.Screen, id: scr.id },
            label: scr.name,
            kind: 'SCREEN',
            path: `${fnPath} / Screens`,
            expandKeys: [mod.id, fn.id],
          })
        }
        for (const c of scr.components) {
          if (match(c.code, c.name)) {
            hits.push({
              focus: { type: StructureFocusType.Component, id: c.id },
              label: c.name,
              kind: 'COMPONENT',
              path: `${fnPath} / ${scr.name}`,
              expandKeys: [mod.id, fn.id],
            })
          }
        }
      }
      for (const a of fn.apis) {
        if (match(a.method, a.pathPattern, a.name)) {
          hits.push({
            focus: { type: StructureFocusType.ApiEndpoint, id: a.id },
            label: a.name || `${a.method} ${a.pathPattern}`,
            kind: 'API',
            path: `${fnPath} / APIs`,
            expandKeys: [mod.id, fn.id],
          })
        }
      }
    }
    for (const ent of mod.entities) {
      if (match(ent.code, ent.name, ent.tableName)) {
        hits.push({
          focus: { type: StructureFocusType.Entity, id: ent.id },
          label: ent.name,
          kind: 'ENTITY',
          path: `${mod.name} / Entities`,
          expandKeys: [mod.id],
        })
      }
    }
    for (const nfr of mod.scopedNfrs ?? []) {
      if (match(nfr.code, nfr.title)) {
        hits.push({
          focus: { type: StructureFocusType.Nfr, id: nfr.id },
          label: nfr.title,
          kind: 'NFR',
          path: `${mod.name} / NFRs`,
          expandKeys: [mod.id],
        })
      }
    }
  }

  for (const fn of tree.unassignedFunctions ?? []) {
    if (match(fn.code, fn.title)) {
      hits.push({
        focus: { type: StructureFocusType.Function, id: fn.id },
        label: fn.title,
        kind: 'FUNCTION',
        path: 'Unassigned',
        expandKeys: [],
      })
    }
  }
  for (const ent of tree.unassignedEntities ?? []) {
    if (match(ent.code, ent.name, ent.tableName)) {
      hits.push({
        focus: { type: StructureFocusType.Entity, id: ent.id },
        label: ent.name,
        kind: 'ENTITY',
        path: 'Unassigned',
        expandKeys: [],
      })
    }
  }
  for (const nfr of tree.applicationNfrs ?? []) {
    if (match(nfr.code, nfr.title)) {
      hits.push({
        focus: { type: StructureFocusType.Nfr, id: nfr.id },
        label: nfr.title,
        kind: 'NFR',
        path: 'Application-wide',
        expandKeys: [],
      })
    }
  }

  return hits.slice(0, 40)
}

export type StructureExpandMap = Record<string, boolean>

export function defaultExpandMap(tree: OverallStructureResponse): StructureExpandMap {
  const map: StructureExpandMap = {}
  for (const mod of tree.modules) {
    map[mod.id] = true
    for (const fn of mod.functions) {
      map[fn.id] = true
    }
  }
  return map
}

export function collapseAllExpandMap(tree: OverallStructureResponse): StructureExpandMap {
  const map: StructureExpandMap = {}
  for (const mod of tree.modules) {
    map[mod.id] = false
    for (const fn of mod.functions) {
      map[fn.id] = false
    }
  }
  return map
}

/** Expand one additional level from current state. */
export function expandOneLevel(
  tree: OverallStructureResponse,
  current: StructureExpandMap
): StructureExpandMap {
  const next = { ...current }
  for (const mod of tree.modules) {
    if (next[mod.id] !== true) {
      next[mod.id] = true
      continue
    }
    for (const fn of mod.functions) {
      if (next[fn.id] !== true) {
        next[fn.id] = true
      }
    }
  }
  return next
}
