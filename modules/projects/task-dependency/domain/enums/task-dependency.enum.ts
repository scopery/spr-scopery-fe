export const DependencyType = {
  FinishToStart: 'FINISH_TO_START',
  StartToStart: 'START_TO_START',
  FinishToFinish: 'FINISH_TO_FINISH',
  StartToFinish: 'START_TO_FINISH',
} as const
export type DependencyType = (typeof DependencyType)[keyof typeof DependencyType]
