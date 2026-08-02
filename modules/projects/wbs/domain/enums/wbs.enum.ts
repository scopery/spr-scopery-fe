export const WbsNodeStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type WbsNodeStatus = (typeof WbsNodeStatus)[keyof typeof WbsNodeStatus]

/**
 * Must match BE `WbsNodeType`:
 * WORK_PACKAGE | TASK_GROUP | MILESTONE
 *
 * Product note: former DELIVERABLE was folded into MILESTONE (same meaning).
 */
export const WbsNodeType = {
  WorkPackage: 'WORK_PACKAGE',
  TaskGroup: 'TASK_GROUP',
  Milestone: 'MILESTONE',
} as const
export type WbsNodeType = (typeof WbsNodeType)[keyof typeof WbsNodeType]

export const WBS_NODE_TYPE_OPTIONS = [
  { value: WbsNodeType.WorkPackage, label: 'Work package' },
  { value: WbsNodeType.TaskGroup, label: 'Task group' },
  { value: WbsNodeType.Milestone, label: 'Milestone' },
] as const
