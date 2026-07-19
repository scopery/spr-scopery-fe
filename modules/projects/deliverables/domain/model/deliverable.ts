/** Matches BE `DeliverableResponse` (`/api/projects/{projectId}/deliverables`). */
export interface Deliverable {
  id: string
  projectId: string
  type: string
  code: string
  title: string
  description: string | null
  status: string
  acceptanceRequired: boolean
  acceptedAt: string | null
  acceptedBy: string | null
  createdAt: string
}

export interface CreateDeliverablePayload {
  type: string
  code: string
  title: string
  description?: string | null
  acceptanceRequired?: boolean
}

export interface UpdateDeliverablePayload {
  type?: string
  title?: string
  description?: string | null
  acceptanceRequired?: boolean
}

export interface ChangeDeliverableStatusPayload {
  status: string
}

export interface ReopenDeliverablePayload {
  reason?: string | null
}

/** Matches BE `AcceptanceCriteriaResponse` (`.../deliverables/{deliverableId}/acceptance-criteria`). */
export interface AcceptanceCriteria {
  id: string
  deliverableId: string
  projectId: string
  type: string
  title: string
  description: string | null
  mandatory: boolean
  status: string
  createdAt: string
}

export interface CreateAcceptanceCriteriaPayload {
  title: string
  type: string
  description?: string | null
  mandatory?: boolean
}
