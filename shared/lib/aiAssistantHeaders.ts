/**
 * AI Assistant API request headers (Wave 5).
 * Inject trusted X-Workspace-Id / X-Actor-Id on `/api/v1/ai-assistant/**` calls.
 * Actor and workspace come from auth/session context — never from user-editable form fields.
 */

import {
  registerRequestInterceptor,
  type ApiRequestContext,
} from '@/shared/lib/apiInterceptors'

export interface AiAssistantHeaderContext {
  workspaceId: string | null
  actorId: string | null
}

let aiAssistantContext: AiAssistantHeaderContext = {
  workspaceId: null,
  actorId: null,
}

export function setAiAssistantHeaderContext(
  ctx: Partial<AiAssistantHeaderContext>
): void {
  aiAssistantContext = { ...aiAssistantContext, ...ctx }
}

export function getAiAssistantHeaderContext(): AiAssistantHeaderContext {
  return aiAssistantContext
}

export function clearAiAssistantHeaderContext(): void {
  aiAssistantContext = { workspaceId: null, actorId: null }
}

function isAiAssistantUrl(url: string): boolean {
  return (
    url.includes('/api/v1/ai-assistant/') ||
    url.includes('/api/ai-assistant/') ||
    /\/v1\/ai-assistant\//.test(url)
  )
}

function injectAiAssistantHeaders(ctx: ApiRequestContext): ApiRequestContext {
  if (!isAiAssistantUrl(ctx.url)) return ctx
  if (!aiAssistantContext.workspaceId || !aiAssistantContext.actorId) return ctx

  const headers: Record<string, string> = {
    ...(ctx.init.headers as Record<string, string>),
    'X-Workspace-Id': aiAssistantContext.workspaceId,
    'X-Actor-Id': aiAssistantContext.actorId,
  }

  return {
    ...ctx,
    init: { ...ctx.init, headers },
  }
}

/** Register once from app providers. Safe to call multiple times. */
export function registerAiAssistantHeaderInterceptor(): () => void {
  return registerRequestInterceptor(injectAiAssistantHeaders)
}

/** Build headers for one-off fetch (e.g. SSE) outside apiClient. */
export function buildAiAssistantHeaders(
  base?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = { ...(base ?? {}) }
  if (aiAssistantContext.workspaceId) {
    headers['X-Workspace-Id'] = aiAssistantContext.workspaceId
  }
  if (aiAssistantContext.actorId) {
    headers['X-Actor-Id'] = aiAssistantContext.actorId
  }
  return headers
}
