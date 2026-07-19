import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AddToolPermissionPayload,
  AiTool,
  AiToolAgentBinding,
  AiToolPage,
  AiToolPermission,
  BindToolAgentPayload,
  CreateAiToolPayload,
  ExecuteToolPayload,
  ExecuteToolResult,
  SearchAiToolsParams,
  UpdateAiToolPayload,
} from '../../domain/model/tool'

export async function listTools(params?: SearchAiToolsParams): Promise<AiToolPage> {
  const res = await apiClient.get<unknown>(
    AI_AGENT_ADMIN_ENDPOINTS.tools({
      q: params?.q,
      category: params?.category,
      status: params?.status || undefined,
      page: params?.page,
      size: params?.size,
    })
  )
  return normalizeAiAdminPage<AiTool>(res)
}

export async function getTool(id: string): Promise<AiTool> {
  return apiClient.get<AiTool>(AI_AGENT_ADMIN_ENDPOINTS.tool(id))
}

export async function createTool(body: CreateAiToolPayload): Promise<AiTool> {
  return apiClient.post<AiTool>(AI_AGENT_ADMIN_ENDPOINTS.tools(), body)
}

export async function updateTool(id: string, body: UpdateAiToolPayload): Promise<AiTool> {
  return apiClient.put<AiTool>(AI_AGENT_ADMIN_ENDPOINTS.tool(id), body)
}

export async function activateTool(id: string): Promise<AiTool> {
  return apiClient.patch<AiTool>(AI_AGENT_ADMIN_ENDPOINTS.activateTool(id))
}

export async function deactivateTool(id: string): Promise<AiTool> {
  return apiClient.patch<AiTool>(AI_AGENT_ADMIN_ENDPOINTS.deactivateTool(id))
}

export async function addToolPermission(
  toolId: string,
  body: AddToolPermissionPayload
): Promise<AiToolPermission> {
  return apiClient.post<AiToolPermission>(
    AI_AGENT_ADMIN_ENDPOINTS.toolPermissions(toolId),
    body
  )
}

export async function removeToolPermission(
  toolId: string,
  permissionId: string
): Promise<void> {
  await apiClient.delete<void>(AI_AGENT_ADMIN_ENDPOINTS.toolPermission(toolId, permissionId), {
    parseJson: false,
  })
}

export async function listToolBindings(toolId: string): Promise<AiToolAgentBinding[]> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.toolBindings(toolId))
  if (Array.isArray(res)) return normalizeBindings(res)
  if (res && typeof res === 'object') {
    const items = (res as { items?: unknown; data?: unknown }).items
      ?? (res as { data?: unknown }).data
    if (Array.isArray(items)) return normalizeBindings(items)
  }
  return []
}

function normalizeBindings(raw: unknown[]): AiToolAgentBinding[] {
  const out: AiToolAgentBinding[] = []
  for (const item of raw) {
    const o = item as Record<string, unknown>
    const agentId = String(o.agentId ?? o.id ?? '')
    if (!agentId) continue
    out.push({
      agentId,
      agentCode:
        o.agentCode != null ? String(o.agentCode) : o.code != null ? String(o.code) : undefined,
      agentName:
        o.agentName != null ? String(o.agentName) : o.name != null ? String(o.name) : undefined,
      status: o.status != null ? String(o.status) : undefined,
    })
  }
  return out
}

export async function bindToolAgent(
  toolId: string,
  body: BindToolAgentPayload
): Promise<AiToolAgentBinding> {
  return apiClient.post<AiToolAgentBinding>(
    AI_AGENT_ADMIN_ENDPOINTS.toolBindings(toolId),
    body
  )
}

export async function unbindToolAgent(toolId: string, agentId: string): Promise<void> {
  await apiClient.delete<void>(AI_AGENT_ADMIN_ENDPOINTS.toolBinding(toolId, agentId), {
    parseJson: false,
  })
}

export async function executeTool(
  toolId: string,
  body?: ExecuteToolPayload
): Promise<ExecuteToolResult> {
  return apiClient.post<ExecuteToolResult>(
    AI_AGENT_ADMIN_ENDPOINTS.executeTool(toolId),
    body ?? {}
  )
}
