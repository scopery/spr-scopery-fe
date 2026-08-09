import type { GanttTreeItem } from '@/modules/projects/gantt'

export const RESOURCE_TIMELINE_MAX_PROJECTS = 20
export const RESOURCE_TIMELINE_DEFAULT_PROJECTS = 10
export const RESOURCE_TIMELINE_FANOUT_CONCURRENCY = 4

/** Minimal project shape for Team Schedule project picker / fan-out. */
export type WatchableProjectLike = {
  id: string
  name: string
  status: string
  createdAt: string
}

export function isWatchableProjectStatus(status: string): boolean {
  return status !== 'ARCHIVED' && status !== 'COMPLETED'
}

/** Active (non-archived/completed) projects, newest createdAt first. */
export function listWatchableProjects<T extends WatchableProjectLike>(projects: T[]): T[] {
  return [...projects]
    .filter((p) => isWatchableProjectStatus(p.status))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

/** Default selection: first N ids from a newest-first watchable list. */
export function defaultSelectedProjectIds(
  watchableNewestFirst: Array<{ id: string }>,
  defaultCount: number = RESOURCE_TIMELINE_DEFAULT_PROJECTS
): string[] {
  return watchableNewestFirst.slice(0, Math.max(0, defaultCount)).map((p) => p.id)
}

/**
 * Projects to fan-out for the schedule chart: selected ∩ watchable, capped at max.
 * Preserves newest-first order from `watchableNewestFirst`.
 */
export function resolveTargetProjects<T extends { id: string }>(
  watchableNewestFirst: T[],
  selectedProjectIds: string[],
  max: number = RESOURCE_TIMELINE_MAX_PROJECTS
): T[] {
  if (selectedProjectIds.length === 0) return []
  const selected = new Set(selectedProjectIds)
  return watchableNewestFirst.filter((p) => selected.has(p.id)).slice(0, Math.max(0, max))
}

function isLeaf(item: GanttTreeItem): boolean {
  return item.itemType === 'TASK' || item.itemType === 'MILESTONE'
}

function leafMatchesFilter(
  item: GanttTreeItem,
  assigneeUserId: string | null,
  includeUnassigned: boolean
): boolean {
  if (!isLeaf(item)) return false
  // null = all people: keep every assigned leaf; unassigned only when toggled on.
  if (assigneeUserId == null) {
    if (!item.assigneeUserId) return includeUnassigned
    return true
  }
  if (item.assigneeUserId === assigneeUserId) return true
  if (includeUnassigned && !item.assigneeUserId) return true
  return false
}

/**
 * Keep tasks for one assignee, or all assignees when `assigneeUserId` is null
 * (optionally including unassigned leaves). Prune empty Phase/WBS branches.
 */
export function filterAndPruneGanttTree(
  tree: GanttTreeItem[],
  assigneeUserId: string | null,
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
