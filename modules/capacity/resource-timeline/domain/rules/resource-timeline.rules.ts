import type { GanttTreeItem } from '@/modules/projects/gantt'

export const RESOURCE_TIMELINE_MAX_PROJECTS = 20
export const RESOURCE_TIMELINE_FANOUT_CONCURRENCY = 4

function isLeaf(item: GanttTreeItem): boolean {
  return item.itemType === 'TASK' || item.itemType === 'MILESTONE'
}

function leafMatchesFilter(
  item: GanttTreeItem,
  assigneeUserId: string,
  includeUnassigned: boolean
): boolean {
  if (!isLeaf(item)) return false
  if (item.assigneeUserId === assigneeUserId) return true
  if (includeUnassigned && !item.assigneeUserId) return true
  return false
}

/**
 * Keep tasks assigned to `assigneeUserId` (and optionally unassigned leaves).
 * Prune empty Phase/WBS branches; keep PROJECT when any matching leaf remains.
 */
export function filterAndPruneGanttTree(
  tree: GanttTreeItem[],
  assigneeUserId: string,
  includeUnassigned: boolean
): GanttTreeItem[] {
  const visit = (nodes: GanttTreeItem[]): GanttTreeItem[] => {
    const kept: GanttTreeItem[] = []
    for (const node of nodes) {
      if (isLeaf(node)) {
        if (leafMatchesFilter(node, assigneeUserId, includeUnassigned)) {
          kept.push({ ...node, children: [] })
        }
        continue
      }

      const children = visit(node.children)
      if (children.length === 0) continue
      kept.push({ ...node, children })
    }
    return kept
  }

  return visit(tree)
}

/** Run async work with a fixed concurrency limit. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return []
  const limit = Math.max(1, concurrency)
  const results = new Array<R>(items.length)
  let nextIndex = 0

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const i = nextIndex
      nextIndex += 1
      results[i] = await worker(items[i]!, i)
    }
  })

  await Promise.all(runners)
  return results
}
