/**
 * Knowledge API request headers (Wave 4).
 * Inject trusted X-Workspace-Id / X-Actor-Id / X-Acl-Tokens on knowledge calls.
 */

import {
  registerRequestInterceptor,
  type ApiRequestContext,
} from '@/shared/lib/apiInterceptors'

export interface KnowledgeHeaderContext {
  workspaceId: string | null
  actorId?: string | null
  aclTokens?: string[] | null
}

let knowledgeContext: KnowledgeHeaderContext = {
  workspaceId: null,
  actorId: null,
  aclTokens: null,
}

export function setKnowledgeHeaderContext(ctx: Partial<KnowledgeHeaderContext>): void {
  knowledgeContext = { ...knowledgeContext, ...ctx }
}

export function getKnowledgeHeaderContext(): KnowledgeHeaderContext {
  return knowledgeContext
}

export function clearKnowledgeHeaderContext(): void {
  knowledgeContext = { workspaceId: null, actorId: null, aclTokens: null }
}

function isKnowledgeUrl(url: string): boolean {
  return url.includes('/api/knowledge/') || url.includes('/knowledge/')
}

function injectKnowledgeHeaders(ctx: ApiRequestContext): ApiRequestContext {
  if (!isKnowledgeUrl(ctx.url)) return ctx
  if (!knowledgeContext.workspaceId) return ctx

  const headers: Record<string, string> = {
    ...(ctx.init.headers as Record<string, string>),
    'X-Workspace-Id': knowledgeContext.workspaceId,
  }
  if (knowledgeContext.actorId) {
    headers['X-Actor-Id'] = knowledgeContext.actorId
  }
  if (knowledgeContext.aclTokens?.length) {
    headers['X-Acl-Tokens'] = knowledgeContext.aclTokens.join(',')
  }

  return {
    ...ctx,
    init: { ...ctx.init, headers },
  }
}

/** Register once from app providers. Safe to call multiple times. */
export function registerKnowledgeHeaderInterceptor(): () => void {
  const unregister = registerRequestInterceptor(injectKnowledgeHeaders)
  return () => {
    unregister()
  }
}

/** Build headers for one-off fetch (e.g. SSE) outside apiClient. */
export function buildKnowledgeHeaders(
  base?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = { ...(base ?? {}) }
  if (knowledgeContext.workspaceId) {
    headers['X-Workspace-Id'] = knowledgeContext.workspaceId
  }
  if (knowledgeContext.actorId) {
    headers['X-Actor-Id'] = knowledgeContext.actorId
  }
  if (knowledgeContext.aclTokens?.length) {
    headers['X-Acl-Tokens'] = knowledgeContext.aclTokens.join(',')
  }
  return headers
}
