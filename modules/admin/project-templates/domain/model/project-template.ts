export interface ProjectTemplate {
  id: string
  scope: string
  organizationId: string | null
  workspaceId: string | null
  code: string
  name: string
  description: string | null
  category: string | null
  status: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface ProjectTemplateVersion {
  id: string
  projectTemplateId: string
  versionNumber: number
  name: string
  description: string | null
  status: string
  publishedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface ProjectTemplatePage {
  items: ProjectTemplate[]
  page: number
  size: number
  totalElements: number
}

export interface ApplyProjectTemplatePayload {
  workspaceId: string
  projectCode: string
  projectName: string
  projectDescription?: string | null
  ownerUserId?: string | null
  defaultCurrency?: string | null
  plannedStartDate?: string | null
  plannedEndDate?: string | null
  includeTemplateTasks?: boolean
  includeTemplateDependencies?: boolean
  copyEstimateHours?: boolean
}

export interface CreateProjectTemplateVersionPayload {
  name: string
  description?: string | null
}

export interface ProjectTemplatePhase {
  id: string
  templateVersionId: string
  phaseDefinitionId: string | null
  code: string
  name: string
  description: string | null
  displayOrder: number
  defaultDurationDays: number | null
  startOffsetDays: number | null
  deliverableDocumentTypeId: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectTemplatePhasePayload {
  phaseDefinitionId?: string | null
  code: string
  name: string
  description?: string | null
  displayOrder: number
  defaultDurationDays?: number | null
  startOffsetDays?: number | null
  deliverableDocumentTypeId?: string | null
}

export interface ProjectTemplateTask {
  id: string
  templateVersionId: string
  templatePhaseId: string
  templateWbsNodeId: string | null
  code: string
  title: string
  description: string | null
  defaultPriority: string | null
  estimateHours: number | null
  dueOffsetDays: number | null
  startOffsetDays: number | null
  defaultAssigneeRoleCode: string | null
  deliverableDocumentTypeId: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectTemplateTaskPayload {
  templatePhaseId: string
  templateWbsNodeId?: string | null
  code: string
  title: string
  description?: string | null
  defaultPriority?: string | null
  estimateHours?: number | null
  dueOffsetDays?: number | null
  startOffsetDays?: number | null
  defaultAssigneeRoleCode?: string | null
  deliverableDocumentTypeId?: string | null
}

export interface ProjectTemplateTaskDependency {
  id: string
  templateVersionId: string
  predecessorTemplateTaskId: string
  successorTemplateTaskId: string
  dependencyType: string
  lagDays: number
  createdAt: string
}

export interface CreateProjectTemplateTaskDependencyPayload {
  predecessorTemplateTaskId: string
  successorTemplateTaskId: string
  dependencyType: string
  lagDays?: number
}
