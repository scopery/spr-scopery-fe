import type { ProjectPhaseStatus } from '../../../project/domain/enums/project.enum'

export interface ProjectPhase {
  id: string
  projectId: string
  phaseDefinitionId: string | null
  code: string
  name: string
  description: string | null
  displayOrder: number
  plannedStartDate: string | null
  plannedEndDate: string | null
  status: ProjectPhaseStatus | string
  startedAt: string | null
  completedAt: string | null
  archivedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectPhasePayload {
  code: string
  name: string
  description?: string | null
  displayOrder?: number
  plannedStartDate?: string | null
  plannedEndDate?: string | null
}

export interface UpdateProjectPhasePayload {
  name?: string
  description?: string | null
  displayOrder?: number
  plannedStartDate?: string | null
  plannedEndDate?: string | null
}

export interface ProjectPhasePageResponse {
  items: ProjectPhase[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
  first?: boolean
  last?: boolean
}
