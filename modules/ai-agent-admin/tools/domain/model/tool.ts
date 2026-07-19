import type { AiAdminPage } from '../../../infrastructure/api/page-response'
import type { ToolMutationType, ToolStatus } from '../enums/tool.enum'

export interface AiToolPermission {
  id: string
  permissionCode: string
  description: string | null
}

export interface AiToolAgentBinding {
  agentId: string
  agentCode?: string
  agentName?: string
  status?: string
}

export interface AiTool {
  id: string
  code: string
  name: string
  description: string | null
  category: string | null
  mutationType: ToolMutationType | null
  requiresHumanApproval: boolean | null
  status: ToolStatus
  permissionCount?: number | null
  agentBindingCount?: number | null
  permissions?: AiToolPermission[] | null
  createdAt: string
  updatedAt: string
}

export interface CreateAiToolPayload {
  code: string
  name: string
  description?: string | null
  category?: string | null
  mutationType?: ToolMutationType | null
  requiresHumanApproval?: boolean | null
}

export type UpdateAiToolPayload = Omit<CreateAiToolPayload, 'code'> & {
  name: string
}

export interface AddToolPermissionPayload {
  permissionCode: string
  description?: string | null
}

export interface BindToolAgentPayload {
  agentId: string
}

export interface ExecuteToolPayload {
  input?: Record<string, unknown> | null
}

export interface ExecuteToolResult {
  status?: string
  message?: string | null
  output?: string | null
  requestId?: string | null
  executionId?: string | null
  stub?: boolean
}

export interface SearchAiToolsParams {
  q?: string
  category?: string
  status?: ToolStatus | ''
  page?: number
  size?: number
}

export type AiToolPage = AiAdminPage<AiTool>
