import type { GanttTreeItem } from '../model/gantt'
import type { TaskEnrichment } from './timeline-rows.rules'

export interface PhaseRowSummary {
  taskCount: number
  completedCount: number
  activeCount: number
  blockedCount: number
  unscheduledCount: number
  atRiskCount: number
  progressPercent: number | null
}

const DONE = new Set(['COMPLETED', 'DONE'])
const BLOCKED = new Set(['BLOCKED'])
const CANCELLED = new Set(['CANCELLED', 'ARCHIVED'])

function walkTasks(
  nodes: GanttTreeItem[],
  taskById: Map<string, TaskEnrichment>,
  acc: PhaseRowSummary
) {
  for (const node of nodes) {
    if (node.itemType === 'TASK' || node.itemType === 'MILESTONE') {
      const enrichment = node.sourceEntityId
        ? taskById.get(node.sourceEntityId)
        : undefined
      const status = (enrichment?.status ?? '').toUpperCase()
      if (CANCELLED.has(status)) {
        if (node.children.length) walkTasks(node.children, taskById, acc)
        continue
      }
      acc.taskCount += 1
      if (DONE.has(status)) acc.completedCount += 1
      else if (BLOCKED.has(status)) acc.blockedCount += 1
      else acc.activeCount += 1
      if (!node.startDate && !node.endDate) acc.unscheduledCount += 1
      if (enrichment?.atRisk) acc.atRiskCount += 1
    }
    if (node.children.length) walkTasks(node.children, taskById, acc)
  }
}

export function summarizePhaseSubtree(
  phaseNode: GanttTreeItem,
  taskById: Map<string, TaskEnrichment>
): PhaseRowSummary {
  const acc: PhaseRowSummary = {
    taskCount: 0,
    completedCount: 0,
    activeCount: 0,
    blockedCount: 0,
    unscheduledCount: 0,
    atRiskCount: 0,
    progressPercent: null,
  }
  walkTasks(phaseNode.children, taskById, acc)
  if (acc.taskCount > 0) {
    acc.progressPercent = Math.round((acc.completedCount / acc.taskCount) * 100)
  }
  return acc
}

export function emptyPhaseSummary(): PhaseRowSummary {
  return {
    taskCount: 0,
    completedCount: 0,
    activeCount: 0,
    blockedCount: 0,
    unscheduledCount: 0,
    atRiskCount: 0,
    progressPercent: null,
  }
}

export function phaseHealthLabel(summary: PhaseRowSummary): string | null {
  if (summary.atRiskCount > 0) return 'At Risk'
  if (summary.blockedCount > 0) return 'Blocked'
  if (summary.unscheduledCount > 0 && summary.taskCount > 0) return 'Has gaps'
  return null
}
