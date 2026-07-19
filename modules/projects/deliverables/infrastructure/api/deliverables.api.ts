import { apiClient } from '@/shared/lib/apiClient'
import { DELIVERABLE_ENDPOINTS } from './endpoints'
import type {
  AcceptanceCriteria,
  ChangeDeliverableStatusPayload,
  CreateAcceptanceCriteriaPayload,
  CreateDeliverablePayload,
  Deliverable,
  ReopenDeliverablePayload,
  UpdateDeliverablePayload,
} from '../../domain/model/deliverable'

export async function listDeliverables(projectId: string): Promise<Deliverable[]> {
  return apiClient.get<Deliverable[]>(DELIVERABLE_ENDPOINTS.list(projectId))
}

export async function createDeliverable(
  projectId: string,
  body: CreateDeliverablePayload
): Promise<Deliverable> {
  return apiClient.post<Deliverable>(DELIVERABLE_ENDPOINTS.create(projectId), body)
}

export async function getDeliverable(
  projectId: string,
  deliverableId: string
): Promise<Deliverable> {
  return apiClient.get<Deliverable>(DELIVERABLE_ENDPOINTS.get(projectId, deliverableId))
}

export async function updateDeliverable(
  projectId: string,
  deliverableId: string,
  body: UpdateDeliverablePayload
): Promise<Deliverable> {
  return apiClient.put<Deliverable>(DELIVERABLE_ENDPOINTS.update(projectId, deliverableId), body)
}

export async function changeDeliverableStatus(
  projectId: string,
  deliverableId: string,
  body: ChangeDeliverableStatusPayload
): Promise<Deliverable> {
  return apiClient.patch<Deliverable>(
    DELIVERABLE_ENDPOINTS.changeStatus(projectId, deliverableId),
    body
  )
}

export async function archiveDeliverable(
  projectId: string,
  deliverableId: string
): Promise<Deliverable> {
  return apiClient.patch<Deliverable>(DELIVERABLE_ENDPOINTS.archive(projectId, deliverableId))
}

export async function acceptDeliverable(
  projectId: string,
  deliverableId: string
): Promise<Deliverable> {
  return apiClient.post<Deliverable>(DELIVERABLE_ENDPOINTS.accept(projectId, deliverableId))
}

export async function reopenDeliverable(
  projectId: string,
  deliverableId: string,
  body?: ReopenDeliverablePayload
): Promise<Deliverable> {
  return apiClient.post<Deliverable>(DELIVERABLE_ENDPOINTS.reopen(projectId, deliverableId), body)
}

export async function listAcceptanceCriteria(
  projectId: string,
  deliverableId: string
): Promise<AcceptanceCriteria[]> {
  return apiClient.get<AcceptanceCriteria[]>(
    DELIVERABLE_ENDPOINTS.acceptanceCriteria.list(projectId, deliverableId)
  )
}

export async function createAcceptanceCriteria(
  projectId: string,
  deliverableId: string,
  body: CreateAcceptanceCriteriaPayload
): Promise<AcceptanceCriteria> {
  return apiClient.post<AcceptanceCriteria>(
    DELIVERABLE_ENDPOINTS.acceptanceCriteria.create(projectId, deliverableId),
    body
  )
}

export async function satisfyAcceptanceCriteria(
  projectId: string,
  criteriaId: string
): Promise<AcceptanceCriteria> {
  return apiClient.patch<AcceptanceCriteria>(
    DELIVERABLE_ENDPOINTS.acceptanceCriteria.satisfy(projectId, criteriaId)
  )
}

export async function waiveAcceptanceCriteria(
  projectId: string,
  criteriaId: string,
  body?: { reason?: string | null }
): Promise<AcceptanceCriteria> {
  return apiClient.patch<AcceptanceCriteria>(
    DELIVERABLE_ENDPOINTS.acceptanceCriteria.waive(projectId, criteriaId),
    body
  )
}
