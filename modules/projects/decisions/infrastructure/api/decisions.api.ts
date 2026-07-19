import { apiClient } from '@/shared/lib/apiClient'
import { DECISION_ENDPOINTS } from './endpoints'
import type {
  CreateDecisionLinkPayload,
  CreateDecisionOptionPayload,
  CreateDecisionPayload,
  DecideDecisionPayload,
  DecisionImpact,
  DecisionLink,
  DecisionOption,
  DecisionRecord,
  RejectDecisionPayload,
  SupersedeDecisionPayload,
  UpdateDecisionImpactPayload,
  UpdateDecisionOptionPayload,
  UpdateDecisionPayload,
} from '../../domain/model/decision'

export async function listDecisions(projectId: string): Promise<DecisionRecord[]> {
  return apiClient.get<DecisionRecord[]>(DECISION_ENDPOINTS.list(projectId))
}

export async function createDecision(
  projectId: string,
  body: CreateDecisionPayload
): Promise<DecisionRecord> {
  return apiClient.post<DecisionRecord>(DECISION_ENDPOINTS.create(projectId), body)
}

export async function getDecision(
  projectId: string,
  decisionId: string
): Promise<DecisionRecord> {
  return apiClient.get<DecisionRecord>(DECISION_ENDPOINTS.get(projectId, decisionId))
}

export async function updateDecision(
  projectId: string,
  decisionId: string,
  body: UpdateDecisionPayload
): Promise<DecisionRecord> {
  return apiClient.put<DecisionRecord>(DECISION_ENDPOINTS.update(projectId, decisionId), body)
}

export async function supersedeDecision(
  projectId: string,
  decisionId: string,
  body?: SupersedeDecisionPayload
): Promise<DecisionRecord> {
  return apiClient.post<DecisionRecord>(DECISION_ENDPOINTS.supersede(projectId, decisionId), body)
}

export async function decideDecision(
  projectId: string,
  decisionId: string,
  body: DecideDecisionPayload
): Promise<DecisionRecord> {
  return apiClient.post<DecisionRecord>(DECISION_ENDPOINTS.decide(projectId, decisionId), body)
}

export async function rejectDecision(
  projectId: string,
  decisionId: string,
  body?: RejectDecisionPayload
): Promise<DecisionRecord> {
  return apiClient.post<DecisionRecord>(DECISION_ENDPOINTS.reject(projectId, decisionId), body)
}

export async function archiveDecision(
  projectId: string,
  decisionId: string
): Promise<DecisionRecord> {
  return apiClient.patch<DecisionRecord>(DECISION_ENDPOINTS.archive(projectId, decisionId))
}

export async function listDecisionOptions(
  projectId: string,
  decisionId: string
): Promise<DecisionOption[]> {
  return apiClient.get<DecisionOption[]>(DECISION_ENDPOINTS.options.list(projectId, decisionId))
}

export async function createDecisionOption(
  projectId: string,
  decisionId: string,
  body: CreateDecisionOptionPayload
): Promise<DecisionOption> {
  return apiClient.post<DecisionOption>(
    DECISION_ENDPOINTS.options.create(projectId, decisionId),
    body
  )
}

export async function updateDecisionOption(
  projectId: string,
  decisionId: string,
  optionId: string,
  body: UpdateDecisionOptionPayload
): Promise<DecisionOption> {
  return apiClient.patch<DecisionOption>(
    DECISION_ENDPOINTS.options.update(projectId, decisionId, optionId),
    body
  )
}

export async function deleteDecisionOption(
  projectId: string,
  decisionId: string,
  optionId: string
): Promise<void> {
  await apiClient.delete<void>(
    DECISION_ENDPOINTS.options.delete(projectId, decisionId, optionId),
    { parseJson: false }
  )
}

export async function getDecisionImpact(
  projectId: string,
  decisionId: string
): Promise<DecisionImpact> {
  return apiClient.get<DecisionImpact>(DECISION_ENDPOINTS.impact.get(projectId, decisionId))
}

export async function updateDecisionImpact(
  projectId: string,
  decisionId: string,
  body: UpdateDecisionImpactPayload
): Promise<DecisionImpact> {
  return apiClient.put<DecisionImpact>(
    DECISION_ENDPOINTS.impact.update(projectId, decisionId),
    body
  )
}

export async function listDecisionLinks(
  projectId: string,
  decisionId: string
): Promise<DecisionLink[]> {
  return apiClient.get<DecisionLink[]>(DECISION_ENDPOINTS.links.list(projectId, decisionId))
}

export async function createDecisionLink(
  projectId: string,
  decisionId: string,
  body: CreateDecisionLinkPayload
): Promise<DecisionLink> {
  return apiClient.post<DecisionLink>(
    DECISION_ENDPOINTS.links.create(projectId, decisionId),
    body
  )
}

export async function deleteDecisionLink(
  projectId: string,
  decisionId: string,
  linkId: string
): Promise<void> {
  await apiClient.delete<void>(
    DECISION_ENDPOINTS.links.delete(projectId, decisionId, linkId),
    { parseJson: false }
  )
}
