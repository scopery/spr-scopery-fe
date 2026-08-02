import { TimelineCollapseMode } from '../enums/timeline.enum'
import type { TimelineCollapseMode as CollapseMode } from '../enums/timeline.enum'

/** Cycle: Expand → Structure → Project → Expand */
export function nextCollapseMode(mode: CollapseMode): CollapseMode {
  if (mode === TimelineCollapseMode.Expand) return TimelineCollapseMode.Structure
  if (mode === TimelineCollapseMode.Structure) return TimelineCollapseMode.Project
  return TimelineCollapseMode.Expand
}

export function collapseModeLabel(mode: CollapseMode): string {
  if (mode === TimelineCollapseMode.Expand) return 'Expand'
  if (mode === TimelineCollapseMode.Structure) return 'Structure'
  return 'Project only'
}
