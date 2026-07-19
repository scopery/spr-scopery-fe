export const DependencyType = {
  FinishToStart: 'FS',
  StartToStart: 'SS',
  FinishToFinish: 'FF',
  StartToFinish: 'SF',
} as const
export type DependencyType = (typeof DependencyType)[keyof typeof DependencyType]
