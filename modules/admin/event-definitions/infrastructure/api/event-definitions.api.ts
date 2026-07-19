import { apiClient } from '@/shared/lib/apiClient'
import { EVENT_DEFINITION_ENDPOINTS } from './endpoints'
import type {
  EventDefinition,
  EventDefinitionVariable,
  CreateEventDefinitionPayload,
  UpdateEventDefinitionPayload,
  SearchEventDefinitionsParams,
} from '../../domain/model/event-definition'

export interface EventDefinitionPageResponse {
  items: EventDefinition[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export async function createEventDefinition(
  body: CreateEventDefinitionPayload
): Promise<EventDefinition> {
  return apiClient.post<EventDefinition>(EVENT_DEFINITION_ENDPOINTS.create(), body)
}

export async function getEventDefinition(id: string): Promise<EventDefinition> {
  return apiClient.get<EventDefinition>(EVENT_DEFINITION_ENDPOINTS.get(id))
}

export async function searchEventDefinitions(
  params?: SearchEventDefinitionsParams
): Promise<EventDefinitionPageResponse> {
  return apiClient.get<EventDefinitionPageResponse>(EVENT_DEFINITION_ENDPOINTS.search(params))
}

export async function updateEventDefinition(
  id: string,
  body: UpdateEventDefinitionPayload
): Promise<EventDefinition> {
  return apiClient.put<EventDefinition>(EVENT_DEFINITION_ENDPOINTS.update(id), body)
}

export async function activateEventDefinition(id: string): Promise<EventDefinition> {
  return apiClient.patch<EventDefinition>(EVENT_DEFINITION_ENDPOINTS.activate(id))
}

export async function deactivateEventDefinition(id: string): Promise<EventDefinition> {
  return apiClient.patch<EventDefinition>(EVENT_DEFINITION_ENDPOINTS.deactivate(id))
}

export async function deprecateEventDefinition(
  id: string,
  body?: { replacementEventDefinitionId?: string | null; reason?: string | null }
): Promise<EventDefinition> {
  return apiClient.patch<EventDefinition>(EVENT_DEFINITION_ENDPOINTS.deprecate(id), body ?? {})
}

export async function upsertEventDefinitionVariables(
  id: string,
  variables: EventDefinitionVariable[]
): Promise<EventDefinitionVariable[]> {
  return apiClient.put<EventDefinitionVariable[]>(
    EVENT_DEFINITION_ENDPOINTS.upsertVariables(id),
    variables
  )
}

export async function listEventDefinitionVariables(id: string): Promise<EventDefinitionVariable[]> {
  return apiClient.get<EventDefinitionVariable[]>(EVENT_DEFINITION_ENDPOINTS.listVariables(id))
}
