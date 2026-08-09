import { WbsNodeStatus, WbsNodeType } from '../enums/wbs.enum'
import type { WbsNode, WbsTreeNode } from '../model/wbs'

export type WbsNodeTypeBadgeTone = 'info' | 'secondary' | 'warning' | 'neutral'

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
      return 'info'
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
