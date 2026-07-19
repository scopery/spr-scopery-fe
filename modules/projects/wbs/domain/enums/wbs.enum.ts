export const WbsNodeStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type WbsNodeStatus = (typeof WbsNodeStatus)[keyof typeof WbsNodeStatus]

/** Common node type values used by Planning UI. BE accepts any string. */
export const WbsNodeType = {
  Summary: 'SUMMARY',
  WorkPackage: 'WORK_PACKAGE',
  Deliverable: 'DELIVERABLE',
  Milestone: 'MILESTONE',
} as const
export type WbsNodeType = (typeof WbsNodeType)[keyof typeof WbsNodeType]
