import type { EventDefinitionStatus } from '../enums/event-definition.enum'

export interface EventDefinitionVariable {
  variablePath: string
  variableLabel: string | null
  variableType: string
  required: boolean
  description: string | null
  exampleValue: string | null
}

export interface EventDefinition {
  id: string
  code: string
  name: string
  sourceSystem: string
  eventKey: string
  description: string | null
  inputSchema: unknown | null
  outputSchema: unknown | null
  status: EventDefinitionStatus
  variables: EventDefinitionVariable[]
  createdAt: string
  updatedAt: string
}

export interface CreateEventDefinitionPayload {
  code: string
  name: string
  sourceSystem: string
  eventKey: string
  description?: string
  inputSchema?: unknown
  outputSchema?: unknown
}

export interface UpdateEventDefinitionPayload {
  name: string
  description?: string
  inputSchema?: unknown
  outputSchema?: unknown
}

export interface SearchEventDefinitionsParams {
  keyword?: string
  sourceSystem?: string
  eventKey?: string
  status?: EventDefinitionStatus
  page?: number
  size?: number
}
