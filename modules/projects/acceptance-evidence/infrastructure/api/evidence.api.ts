import { apiClient } from '@/shared/lib/apiClient'
import { EVIDENCE_ENDPOINTS } from './endpoints'
import type { AcceptanceEvidence, AddEvidencePayload } from '../../domain/model/evidence'

export async function listEvidence(
  projectId: string,
  deliverableId: string
): Promise<AcceptanceEvidence[]> {
  return apiClient.get<AcceptanceEvidence[]>(
    EVIDENCE_ENDPOINTS.listCreate(projectId, deliverableId)
  )
}

export async function getEvidence(
  projectId: string,
  evidenceId: string
): Promise<AcceptanceEvidence> {
  return apiClient.get<AcceptanceEvidence>(EVIDENCE_ENDPOINTS.get(projectId, evidenceId))
}

export async function addEvidence(
  projectId: string,
  deliverableId: string,
  body: AddEvidencePayload
): Promise<AcceptanceEvidence> {
  return apiClient.post<AcceptanceEvidence>(
    EVIDENCE_ENDPOINTS.listCreate(projectId, deliverableId),
    body
  )
}
