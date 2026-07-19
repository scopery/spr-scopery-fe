export interface ScopeWbsMapping {
  id: string
  scopeItemId: string
  wbsNodeId: string
  projectId: string
  createdAt: string
}

export interface DeliverableTaskMapping {
  id: string
  deliverableId: string
  taskId: string
  projectId: string
  createdAt: string
}

export interface CreateWbsMappingPayload {
  wbsNodeId: string
}

export interface CreateTaskMappingPayload {
  taskId: string
}
