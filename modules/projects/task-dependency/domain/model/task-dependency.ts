import type { DependencyType } from '../enums/task-dependency.enum'

export interface TaskDependency {
  id: string
  projectId: string
  predecessorTaskId: string
  successorTaskId: string
  dependencyType: DependencyType
  lagDays: number | null
  status: string
  createdAt: string
}

export interface CreateTaskDependencyPayload {
  predecessorTaskId: string
  successorTaskId: string
  dependencyType: DependencyType
  lagDays?: number | null
}
