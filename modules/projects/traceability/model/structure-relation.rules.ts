import type { ArchitectureCatalogNode } from './architecture-workbench'
import { ARCHITECTURE_TO_ANCHOR_NODE_TYPE } from './anchor-mapping'
import {
  StructureRelationType,
  type AddStructureRelationBody,
  type StructureRelation,
} from './structure-relation'

export type RelationDirection = 'focus-as-from' | 'focus-as-to'

export function isRelatedType(relationType: string): boolean {
  return relationType === StructureRelationType.Related
}

/** Client-side duplicate check, including RELATED undirected pair. */
export function isDuplicateRelation(
  items: StructureRelation[],
  fromNodeId: string,
  toNodeId: string,
  relationType: string
): boolean {
  if (fromNodeId === toNodeId) return true
  if (isRelatedType(relationType)) {
    return items.some(
      (r) =>
        isRelatedType(r.relationType) &&
        ((r.fromNodeId === fromNodeId && r.toNodeId === toNodeId) ||
          (r.fromNodeId === toNodeId && r.toNodeId === fromNodeId))
    )
  }
  return items.some(
    (r) =>
      r.fromNodeId === fromNodeId &&
      r.toNodeId === toNodeId &&
      r.relationType === relationType
  )
}

export function buildLinkBody(
  focus: ArchitectureCatalogNode,
  target: ArchitectureCatalogNode,
  relationType: string,
  direction: RelationDirection
): AddStructureRelationBody {
  const focusType = ARCHITECTURE_TO_ANCHOR_NODE_TYPE[focus.type]
  const targetType = ARCHITECTURE_TO_ANCHOR_NODE_TYPE[target.type]
  if (direction === 'focus-as-from') {
    return {
      fromNodeType: focusType,
      fromNodeId: focus.id,
      toNodeType: targetType,
      toNodeId: target.id,
      relationType,
    }
  }
  return {
    fromNodeType: targetType,
    fromNodeId: target.id,
    toNodeType: focusType,
    toNodeId: focus.id,
    relationType,
  }
}

export function validateLink(
  items: StructureRelation[],
  focus: ArchitectureCatalogNode,
  target: ArchitectureCatalogNode,
  relationType: string,
  direction: RelationDirection
): { ok: true; body: AddStructureRelationBody } | { ok: false; reason: string } {
  if (focus.id === target.id && focus.type === target.type) {
    return { ok: false, reason: 'Cannot link a node to itself' }
  }
  const body = buildLinkBody(focus, target, relationType, direction)
  if (isDuplicateRelation(items, body.fromNodeId, body.toNodeId, relationType)) {
    return {
      ok: false,
      reason: isRelatedType(relationType)
        ? `This ${relationType} relation already exists (either direction)`
        : `This ${relationType} relation already exists`,
    }
  }
  return { ok: true, body }
}

export function partitionRelationsForFocus(
  items: StructureRelation[],
  focusNodeId: string
): { incoming: StructureRelation[]; outgoing: StructureRelation[] } {
  const incoming: StructureRelation[] = []
  const outgoing: StructureRelation[] = []
  for (const r of items) {
    if (r.fromNodeId === focusNodeId) outgoing.push(r)
    else if (r.toNodeId === focusNodeId) incoming.push(r)
  }
  return { incoming, outgoing }
}

export function groupByRelationType(
  relations: StructureRelation[]
): Record<string, StructureRelation[]> {
  const groups: Record<string, StructureRelation[]> = {
    [StructureRelationType.Uses]: [],
    [StructureRelationType.Implements]: [],
    [StructureRelationType.Related]: [],
  }
  for (const r of relations) {
    const key = r.relationType in groups ? r.relationType : StructureRelationType.Related
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  }
  return groups
}

export const STRUCTURE_RELATION_DRAG_MIME = 'application/x-scopery-arch-node'
export const STRUCTURE_RELATION_DRAG_BUNDLE_MIME =
  'application/x-scopery-arch-node-bundle'

export type DragNodePayload = { id: string; type: string }
export type DragBundlePayload = { nodes: DragNodePayload[] }

export const BULK_RELATION_PREVIEW_LIMIT = 500

export function encodeDragNode(node: ArchitectureCatalogNode): string {
  return JSON.stringify({ id: node.id, type: node.type } satisfies DragNodePayload)
}

export function encodeDragBundle(nodes: ArchitectureCatalogNode[]): string {
  return JSON.stringify({
    nodes: nodes.map((n) => ({ id: n.id, type: n.type })),
  } satisfies DragBundlePayload)
}

export function decodeDragNode(raw: string): DragNodePayload | null {
  try {
    const parsed = JSON.parse(raw) as DragNodePayload
    if (!parsed?.id || !parsed?.type) return null
    return parsed
  } catch {
    return null
  }
}

export function decodeDragBundle(raw: string): DragNodePayload[] | null {
  try {
    const parsed = JSON.parse(raw) as DragBundlePayload
    if (!Array.isArray(parsed?.nodes) || !parsed.nodes.length) return null
    return parsed.nodes.filter((n) => n?.id && n?.type)
  } catch {
    return null
  }
}

export type BulkMappingKind = 'one-to-many' | 'many-to-one' | 'many-to-many' | 'one-to-one'

export interface BulkCandidate {
  body: AddStructureRelationBody
  from: ArchitectureCatalogNode
  to: ArchitectureCatalogNode
  status: 'new' | 'duplicate' | 'invalid'
  reason?: string
}

export interface BulkPlan {
  kind: BulkMappingKind
  relationType: string
  sources: ArchitectureCatalogNode[]
  targets: ArchitectureCatalogNode[]
  candidates: BulkCandidate[]
  newCount: number
  duplicateCount: number
  invalidCount: number
  overLimit: boolean
}

/**
 * Build cartesian product of sources × targets with client-side validation.
 * Direction: with focus-as-from, sources are From; with focus-as-to, sources become To
 * (targets are From) — callers pass already-oriented source/target lists.
 */
export function buildBulkPlan(
  items: StructureRelation[],
  sources: ArchitectureCatalogNode[],
  targets: ArchitectureCatalogNode[],
  relationType: string,
  direction: RelationDirection
): BulkPlan {
  const kind: BulkMappingKind =
    sources.length === 1 && targets.length === 1
      ? 'one-to-one'
      : sources.length === 1
        ? 'one-to-many'
        : targets.length === 1
          ? 'many-to-one'
          : 'many-to-many'

  const candidates: BulkCandidate[] = []
  for (const source of sources) {
    for (const target of targets) {
      // Orient: "source" is the bulk/focus side; validateLink expects focus + target
      // with direction controlling which is From.
      const check = validateLink(items, source, target, relationType, direction)
      if (check.ok) {
        // Also skip if already planned in this batch (same pair)
        const dupInBatch = candidates.some(
          (c) =>
            c.status === 'new' &&
            c.body.fromNodeId === check.body.fromNodeId &&
            c.body.toNodeId === check.body.toNodeId &&
            c.body.relationType === check.body.relationType
        )
        if (dupInBatch) {
          candidates.push({
            body: check.body,
            from: source,
            to: target,
            status: 'duplicate',
            reason: 'Duplicate in this batch',
          })
        } else {
          candidates.push({ body: check.body, from: source, to: target, status: 'new' })
        }
      } else {
        const isDup = check.reason.toLowerCase().includes('already exists')
        candidates.push({
          body: buildLinkBody(source, target, relationType, direction),
          from: source,
          to: target,
          status: isDup ? 'duplicate' : 'invalid',
          reason: check.reason,
        })
      }
    }
  }

  const newCount = candidates.filter((c) => c.status === 'new').length
  return {
    kind,
    relationType,
    sources,
    targets,
    candidates,
    newCount,
    duplicateCount: candidates.filter((c) => c.status === 'duplicate').length,
    invalidCount: candidates.filter((c) => c.status === 'invalid').length,
    overLimit: candidates.length > BULK_RELATION_PREVIEW_LIMIT,
  }
}

