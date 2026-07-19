import { WbsNodeStatus } from '../enums/wbs.enum'
import type { WbsNode, WbsTreeNode } from '../model/wbs'

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

export function canArchiveWbsNode(node: { status: string }): boolean {
  return node.status !== WbsNodeStatus.Archived
}
