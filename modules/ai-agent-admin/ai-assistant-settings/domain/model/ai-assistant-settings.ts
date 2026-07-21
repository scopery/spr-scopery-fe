export interface AiAssistantWorkspaceConfig {
  id: string
  workspaceId: string
  modelDeploymentId: string | null
  modelProvider: string | null
  modelName: string | null
  systemPromptOverride: string | null
  temperatureOverride: number | null
  maxOutputTokensOverride: number | null
  createdAt: string
  updatedAt: string
}

export interface UpsertAiAssistantWorkspaceConfigPayload {
  modelDeploymentId: string | null
  modelProvider: string | null
  modelName: string | null
  systemPromptOverride: string | null
  temperatureOverride: number | null
  maxOutputTokensOverride: number | null
}
