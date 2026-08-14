import { WbsNodeStatus, WbsNodeType } from '../enums/wbs.enum'
import type { WbsNode, WbsTreeNode } from '../model/wbs'

export type WbsNodeTypeBadgeTone = 'info' | 'secondary' | 'warning' | 'neutral' | 'success'

/** Flatten a possibly-nested node list (tree endpoint may nest `children`). */
function flattenWbsNodes(nodes: WbsNode[]): WbsNode[] {
  const flat: WbsNode[] = []
  const visit = (list: WbsNode[]) => {
    for (const node of list) {
      flat.push(node)
      if (node.children?.length) visit(node.children)
    }
  }
  visit(nodes)
  return flat
}

/** Build a parent/child tree from a flat or nested WBS node list. */
export function buildWbsTree(nodes: WbsNode[]): WbsTreeNode[] {
  const flat = flattenWbsNodes(nodes)
  const byId = new Map<string, WbsTreeNode>()
  for (const node of flat) {
    byId.set(node.id, { ...node, children: [] })
  }

  const roots: WbsTreeNode[] = []
  for (const node of flat) {
    const treeNode = byId.get(node.id)
    if (!treeNode) continue
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
  }

  const sortRecursive = (list: WbsTreeNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder)
    list.forEach((node) => sortRecursive(node.children))
  }
  sortRecursive(roots)

  return roots
}

export function wbsNodeStatusLabel(status: string): string {
  switch (status) {
    case WbsNodeStatus.Active:
      return 'Active'
    case WbsNodeStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function normalizeWbsNodeType(nodeType: string | null | undefined): string {
  const t = (nodeType || '').toUpperCase().replace(/\s+/g, '_')
  // Legacy DELIVERABLE folded into Milestone.
  if (t === 'DELIVERABLE') return WbsNodeType.Milestone
  return t
}

export function wbsNodeTypeLabel(nodeType: string | null | undefined): string {
  switch (normalizeWbsNodeType(nodeType)) {
    case WbsNodeType.WorkPackage:
      return 'Work pack'
    case WbsNodeType.TaskGroup:
      return 'Task group'
    case WbsNodeType.Milestone:
      return 'Milestone'
    default:
      return nodeType?.trim() || '—'
  }
}

export function wbsNodeTypeBadgeTone(
  nodeType: string | null | undefined
): WbsNodeTypeBadgeTone {
  switch (normalizeWbsNodeType(nodeType)) {
    case WbsNodeType.Milestone:
      return 'warning'
    case WbsNodeType.TaskGroup:
      return 'secondary'
    case WbsNodeType.WorkPackage:
      return 'success'
    default:
      return 'neutral'
  }
}

export function canArchiveWbsNode(node: { status: string }): boolean {
  return node.status !== WbsNodeStatus.Archived
}

/** Frontend hint only — backend enforces the real guard (no children, no linked tasks). */
export function canDeleteWbsNode(node: { status: string; children: unknown[] }): boolean {
  return node.status !== WbsNodeStatus.Archived && node.children.length === 0
}

export function findWbsNodeInTree(nodes: WbsTreeNode[], id: string): WbsTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const hit = findWbsNodeInTree(node.children, id)
    if (hit) return hit
  }
  return null
}

export interface WbsPhaseGroup {
  phaseId: string | null
  roots: WbsTreeNode[]
}

/** Group tree roots by phase. Unassigned first, then phases in display order. */
export function groupWbsTreeByPhase(
  tree: WbsTreeNode[],
  phaseOrder: ReadonlyArray<{ id: string }>
): WbsPhaseGroup[] {
  const byPhase = new Map<string | null, WbsTreeNode[]>()
  for (const root of tree) {
    const key = root.projectPhaseId
    const list = byPhase.get(key) ?? []
    list.push(root)
    byPhase.set(key, list)
  }

  const groups: WbsPhaseGroup[] = [
    { phaseId: null, roots: byPhase.get(null) ?? [] },
  ]
  const seen = new Set<string>()
  for (const phase of phaseOrder) {
    seen.add(phase.id)
    groups.push({ phaseId: phase.id, roots: byPhase.get(phase.id) ?? [] })
  }
  for (const [phaseId, roots] of byPhase) {
    if (!phaseId || seen.has(phaseId)) continue
    groups.push({ phaseId, roots })
  }
  return groups
}
