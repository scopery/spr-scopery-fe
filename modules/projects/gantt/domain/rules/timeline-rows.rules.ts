import type { GanttTreeItem } from '../model/gantt'
import type { TimelineFlatRow } from '../model/timeline'
import { resolvePhaseDisplay } from './phase-display.rules'
import { emptyPhaseSummary, summarizePhaseSubtree } from './phase-row-summary.rules'

export interface TaskEnrichment {
  estimateHours: number | null
  status: string | null
  inChargeUserId: string | null
  progressPercent: number | null
  atRisk: boolean
  description?: string | null
}

export interface PhaseEnrichment {
  code: string
  name: string
  status: string | null
  statusLabel: string | null
  description: string | null
}

export interface WbsEnrichment {
  description: string | null
  code: string | null
  nodeType: string | null
  title: string | null
  plannedStartDate: string | null
  plannedEndDate: string | null
}

/** Collect gantt row ids for PROJECT items (and top-level PHASE when no PROJECT). */
export function collectProjectCollapseIds(tree: GanttTreeItem[]): Set<string> {
  const ids = new Set<string>()
  let hasProject = false
  for (const node of tree) {
    if (node.itemType === 'PROJECT') {
      hasProject = true
      ids.add(node.id)
    }
  }
  if (!hasProject) {
    for (const node of tree) {
      if (node.itemType === 'PHASE') ids.add(node.id)
    }
  }
  return ids
}

/**
 * Flatten gantt tree into left-grid rows (phase → tasks → + Add task).
 * Collapsed phase ids hide children + add row.
 * `hideTaskRows` keeps Project/Phase/WBS but skips TASK/MILESTONE/add rows.
 */
export function flattenTimelineRows(
  tree: GanttTreeItem[],
  options: {
    collapsedPhaseIds: Set<string>
    hideUnscheduled: boolean
    taskById: Map<string, TaskEnrichment>
    phaseById?: Map<string, PhaseEnrichment>
    wbsById?: Map<string, WbsEnrichment>
    includeAddRows?: boolean
    hideTaskRows?: boolean
  }
): TimelineFlatRow[] {
  const rows: TimelineFlatRow[] = []
  const includeAdd = options.includeAddRows !== false && !options.hideTaskRows
  const hideTaskRows = options.hideTaskRows === true
  const phaseById = options.phaseById ?? new Map()
  const wbsById = options.wbsById ?? new Map()

  const visit = (
    nodes: GanttTreeItem[],
    depth: number,
    parentPhaseSourceId: string | null
  ) => {
    for (const node of nodes) {
      const isPhase = node.itemType === 'PHASE'
      const isTask = node.itemType === 'TASK'
      const isMilestone = node.itemType === 'MILESTONE'

      if ((isTask || isMilestone) && hideTaskRows) {
        continue
      }

      if (isTask && options.hideUnscheduled && !node.startDate && !node.endDate) {
        continue
      }

      const enrichment = node.sourceEntityId
        ? options.taskById.get(node.sourceEntityId)
        : undefined

      if (isPhase) {
        const phaseKey = node.sourceEntityId ?? node.phaseId
        const phaseMeta = phaseKey ? phaseById.get(phaseKey) : undefined
        const display = resolvePhaseDisplay({
          ganttTitle: node.title,
          code: phaseMeta?.code,
          name: phaseMeta?.name,
          statusLabel: phaseMeta?.statusLabel,
        })
        const summary = summarizePhaseSubtree(node, options.taskById)
        rows.push({
          id: node.id,
          kind: 'phase',
          depth,
          title: node.title,
          displayPrimary: display.primary,
          displaySecondary: display.secondary,
          phaseCode: display.code,
          itemType: node.itemType,
          sourceEntityId: node.sourceEntityId,
          phaseId: node.phaseId ?? node.sourceEntityId,
          parentPhaseSourceId: null,
          scheduleStatus: node.scheduleStatus,
          assigneeUserId: node.assigneeUserId,
          estimateHours: null,
          status: phaseMeta?.status ?? null,
          progressPercent: summary.progressPercent,
          atRisk: summary.atRiskCount > 0,
          startDate: node.startDate,
          endDate: node.endDate,
          collapsed: options.collapsedPhaseIds.has(node.id),
          phaseSummary: summary,
          phaseDescription: phaseMeta?.description ?? null,
          wbsNodeType: null,
        })
        if (!options.collapsedPhaseIds.has(node.id)) {
          visit(node.children, depth + 1, node.sourceEntityId)
          if (includeAdd) {
            rows.push({
              id: `add:${node.id}`,
              kind: 'add',
              depth: depth + 1,
              title: '',
              displayPrimary: '',
              displaySecondary: null,
              phaseCode: null,
              itemType: 'ADD',
              sourceEntityId: null,
              phaseId: node.phaseId ?? node.sourceEntityId,
              parentPhaseSourceId: node.sourceEntityId,
              scheduleStatus: '',
              assigneeUserId: null,
              estimateHours: null,
              status: null,
              progressPercent: null,
              atRisk: false,
              startDate: null,
              endDate: null,
            })
          }
        }
        continue
      }

      if (isTask || isMilestone) {
        const description = enrichment?.description?.trim() || null
        rows.push({
          id: node.id,
          kind: isMilestone ? 'milestone' : 'task',
          depth,
          title: node.title,
          displayPrimary: node.title,
          displaySecondary: description,
          phaseCode: null,
          itemType: node.itemType,
          sourceEntityId: node.sourceEntityId,
          phaseId: node.phaseId,
          parentPhaseSourceId,
          scheduleStatus: node.scheduleStatus,
          assigneeUserId: enrichment?.inChargeUserId ?? node.assigneeUserId,
          estimateHours: enrichment?.estimateHours ?? null,
          status: enrichment?.status ?? null,
          progressPercent: enrichment?.progressPercent ?? null,
          atRisk: enrichment?.atRisk ?? false,
          startDate: node.startDate,
          endDate: node.endDate,
        })
        if (node.children.length) visit(node.children, depth + 1, parentPhaseSourceId)
      } else {
        // WBS / PROJECT summary — show as phase-like group without add row
        const wbsMeta = node.sourceEntityId
          ? wbsById.get(node.sourceEntityId)
          : undefined
        const wbsTitle = wbsMeta?.title?.trim() || node.title
        const display = resolvePhaseDisplay({
          ganttTitle: wbsTitle,
          code: wbsMeta?.code ?? undefined,
          name: wbsTitle,
        })
        const summary =
          node.children.length > 0
            ? summarizePhaseSubtree(node, options.taskById)
            : emptyPhaseSummary()
        // Prefer Plan Structure stored dates so modal saves show immediately after WBS refetch.
        const startDate = wbsMeta?.plannedStartDate ?? node.startDate
        const endDate = wbsMeta?.plannedEndDate ?? node.endDate
        rows.push({
          id: node.id,
          kind: 'phase',
          depth,
          title: wbsTitle,
          displayPrimary: display.primary,
          displaySecondary: display.secondary,
          phaseCode: display.code,
          itemType: node.itemType,
          sourceEntityId: node.sourceEntityId,
          phaseId: node.phaseId,
          parentPhaseSourceId,
          scheduleStatus: node.scheduleStatus,
          assigneeUserId: node.assigneeUserId,
          estimateHours: null,
          status: null,
          progressPercent: summary.progressPercent,
          atRisk: summary.atRiskCount > 0,
          startDate,
          endDate,
          collapsed: options.collapsedPhaseIds.has(node.id),
          phaseSummary: summary,
          phaseDescription: wbsMeta?.description ?? null,
          wbsNodeType: wbsMeta?.nodeType ?? null,
        })
        if (!options.collapsedPhaseIds.has(node.id) && node.children.length) {
          visit(node.children, depth + 1, parentPhaseSourceId)
        }
      }
    }
  }

  visit(tree, 0, null)
  return rows
}

export function applyDraftToRows(
  rows: TimelineFlatRow[],
  draft: Map<string, { startDate: string; endDate: string }>
): TimelineFlatRow[] {
  if (draft.size === 0) return rows
  return rows.map((row) => {
    const patch = draft.get(row.id)
    if (!patch) return row
    return { ...row, startDate: patch.startDate, endDate: patch.endDate }
  })
}

/** Filter flat rows to a focused phase and its descendants (until next peer phase). */
export function filterRowsToFocusedPhase(
  allRows: TimelineFlatRow[],
  focusedPhaseRowId: string
): TimelineFlatRow[] {
  const start = allRows.findIndex((r) => r.id === focusedPhaseRowId)
  if (start < 0) return allRows
  const focus = allRows[start]
  if (!focus || focus.kind !== 'phase') return allRows
  const out: TimelineFlatRow[] = [focus]
  for (let i = start + 1; i < allRows.length; i++) {
    const row = allRows[i]
    if (!row) break
    if (row.kind === 'phase' && row.depth <= focus.depth) break
    out.push(row)
  }
  return out
}
