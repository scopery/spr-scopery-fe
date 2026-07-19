import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { CreateLayoutPayload, LayoutDefinition } from '../../domain/model/layout'

export async function listLayouts(workspaceId: string): Promise<LayoutDefinition[]> {
  return apiClient.get<LayoutDefinition[]>(CONFIGURATION_ENDPOINTS.layouts.list(workspaceId))
}

export async function createLayout(
  workspaceId: string,
  body: CreateLayoutPayload
): Promise<LayoutDefinition> {
  return apiClient.post<LayoutDefinition>(
    CONFIGURATION_ENDPOINTS.layouts.create(workspaceId),
    body
  )
}

export async function publishLayout(
  workspaceId: string,
  layoutId: string
): Promise<LayoutDefinition> {
  return apiClient.post<LayoutDefinition>(
    CONFIGURATION_ENDPOINTS.layouts.publish(workspaceId, layoutId)
  )
}
