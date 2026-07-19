export interface PlaygroundOptionItem {
  id: string
  label: string
  code?: string
  status?: string
  agentId?: string
  templateId?: string
}

export interface PlaygroundOptions {
  eventConfigs: PlaygroundOptionItem[]
  agents: PlaygroundOptionItem[]
  promptVersions: PlaygroundOptionItem[]
  modelDeployments: PlaygroundOptionItem[]
}

export interface PlaygroundRunPayload {
  requestId?: string | null
  inputVariables?: Record<string, unknown>
}

export interface PlaygroundDirectRunPayload extends PlaygroundRunPayload {
  agentId: string
  promptVersionId: string
  modelDeploymentId: string
}

export interface PlaygroundPromptPreviewPayload {
  promptVersionId: string
  inputVariables?: Record<string, unknown>
}

export interface PlaygroundRunResult {
  executionId?: string
  requestId?: string
  eventConfigId?: string | null
  status: string
  output: string | null
  errorCode?: string | null
  errorMessage?: string | null
  inputTokenCount?: number | null
  outputTokenCount?: number | null
  totalTokenCount?: number | null
  estimatedCost?: string | null
  durationMs?: number | null
}

export interface PlaygroundPromptPreviewResult {
  renderedSystemPrompt: string
  renderedUserPrompt: string
  variables: string[]
  missingVariables: string[]
}
