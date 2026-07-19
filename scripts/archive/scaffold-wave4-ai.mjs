import fs from 'fs'
import path from 'path'

const root = process.cwd()
function write(rel, content) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content.trimStart())
  console.log('W', rel)
}

// ── AI Assistant ─────────────────────────────────────────────
write(
  'modules/ai-assistant/domain/enums/ai-assistant.enum.ts',
  `export const AiMessageRole = {
  User: 'USER',
  Assistant: 'ASSISTANT',
  System: 'SYSTEM',
} as const
export type AiMessageRole = (typeof AiMessageRole)[keyof typeof AiMessageRole]

export const AiSuggestionState = {
  Suggested: 'SUGGESTED',
  Accepted: 'ACCEPTED',
  Applied: 'APPLIED',
  Rejected: 'REJECTED',
} as const
export type AiSuggestionState = (typeof AiSuggestionState)[keyof typeof AiSuggestionState]
`
)

write(
  'modules/ai-assistant/domain/model/conversation.ts',
  `import type { AiMessageRole } from '../enums/ai-assistant.enum'

export interface AiConversation {
  id: string
  title: string
  scopeType?: string | null
  scopeId?: string | null
  createdAt: string
  updatedAt?: string
}

export interface AiMessage {
  id: string
  conversationId: string
  role: AiMessageRole | string
  content: string
  createdAt: string
}

export interface AiConversationListResponse {
  items: AiConversation[]
}
`
)

write(
  'modules/ai-assistant/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

export const AI_ASSISTANT_ENDPOINTS = {
  conversations: () => apiPath('/ai-assistant/conversations'),
  conversation: (id: string) => apiPath(\`/ai-assistant/conversations/\${id}\`),
  messages: (conversationId: string) =>
    apiPath(\`/ai-assistant/conversations/\${conversationId}/messages\`),
  messageStream: (messageId: string) =>
    apiPath(\`/ai-assistant/messages/\${messageId}/stream\`),
  cancelMessage: (messageId: string) =>
    apiPath(\`/ai-assistant/messages/\${messageId}/cancel\`),
} as const
`
)

write(
  'modules/ai-assistant/infrastructure/api/ai-assistant.api.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { AI_ASSISTANT_ENDPOINTS } from './endpoints'
import type {
  AiConversation,
  AiConversationListResponse,
  AiMessage,
} from '../../domain/model/conversation'

export async function listConversations(): Promise<AiConversationListResponse> {
  return apiClient.get<AiConversationListResponse>(AI_ASSISTANT_ENDPOINTS.conversations())
}

export async function getConversation(id: string): Promise<AiConversation> {
  return apiClient.get<AiConversation>(AI_ASSISTANT_ENDPOINTS.conversation(id))
}

export async function createMessage(
  conversationId: string,
  body: { content: string }
): Promise<{ messageId: string; streamUrl?: string }> {
  return apiClient.post(AI_ASSISTANT_ENDPOINTS.messages(conversationId), body)
}

export async function cancelMessage(messageId: string): Promise<void> {
  await apiClient.post(AI_ASSISTANT_ENDPOINTS.cancelMessage(messageId), undefined, {
    parseJson: false,
  })
}

export async function listMessages(conversationId: string): Promise<{ items: AiMessage[] }> {
  return apiClient.get(AI_ASSISTANT_ENDPOINTS.messages(conversationId))
}
`
)

write(
  'modules/ai-assistant/presentation/hooks/useAiAssistant.ts',
  `'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { openSseStream } from '@/shared/lib/sseClient'
import { AI_ASSISTANT_ENDPOINTS } from '../../infrastructure/api/endpoints'
import * as api from '../../infrastructure/api/ai-assistant.api'
import type { AiConversation, AiMessage } from '../../domain/model/conversation'

export function useAiAssistant() {
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listConversations()
      setConversations(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
    return () => {
      cancelRef.current?.()
    }
  }, [loadConversations])

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id)
    const res = await api.listMessages(id)
    setMessages(res.items)
    setStreamingText('')
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeId || !content.trim()) return
      cancelRef.current?.()
      setStreamingText('')
      const result = await api.createMessage(activeId, { content: content.trim() })
      const streamUrl =
        result.streamUrl ?? AI_ASSISTANT_ENDPOINTS.messageStream(result.messageId)

      const { cancel } = openSseStream({
        url: streamUrl,
        onEvent: (ev) => {
          if (ev.event === 'message.delta' || ev.event === 'content.delta') {
            try {
              const parsed = JSON.parse(ev.data) as { delta?: string; text?: string }
              setStreamingText((prev) => prev + (parsed.delta ?? parsed.text ?? ''))
            } catch {
              setStreamingText((prev) => prev + ev.data)
            }
          }
          if (ev.event === 'message.completed' || ev.event === 'turn.completed') {
            void openConversation(activeId)
            setStreamingText('')
          }
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Stream error')
        },
      })
      cancelRef.current = cancel
    },
    [activeId, openConversation]
  )

  const cancelStream = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
  }, [])

  return {
    conversations,
    activeId,
    messages,
    streamingText,
    loading,
    error,
    openConversation,
    sendMessage,
    cancelStream,
    refetch: loadConversations,
  }
}
`
)

write(
  'modules/ai-assistant/presentation/ui/AiAssistantView.tsx',
  `'use client'

import { useState } from 'react'
import { Button, ContentLoader, Input, Stack, Typography } from '@/shared/ui'
import { useAiAssistant } from '../hooks/useAiAssistant'

export function AiAssistantView() {
  const {
    conversations,
    activeId,
    messages,
    streamingText,
    loading,
    error,
    openConversation,
    sendMessage,
    cancelStream,
  } = useAiAssistant()
  const [draft, setDraft] = useState('')

  if (loading && conversations.length === 0) return <ContentLoader />

  return (
    <div className="grid h-full min-h-[480px] grid-cols-1 gap-md p-lg md:grid-cols-[240px_1fr]">
      <aside className="border border-neutral-200">
        <Typography variant="h4" className="border-b border-neutral-200 p-sm">
          Conversations
        </Typography>
        <ul>
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={\`w-full px-sm py-xs text-left text-sm hover:bg-neutral-50 \${
                  activeId === c.id ? 'bg-neutral-50 font-medium' : ''
                }\`}
                onClick={() => void openConversation(c.id)}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <Stack direction="vertical" spacing="md">
        <Typography variant="h2">AI Assistant</Typography>
        {error ? <Typography tone="error">{error}</Typography> : null}
        <div className="flex-1 space-y-sm overflow-auto border border-neutral-200 p-md">
          {messages.map((m) => (
            <div key={m.id}>
              <Typography variant="caption" tone="muted">
                {m.role}
              </Typography>
              <Typography variant="small">{m.content}</Typography>
            </div>
          ))}
          {streamingText ? (
            <Typography variant="small" tone="primary">
              {streamingText}
            </Typography>
          ) : null}
        </div>
        <div className="flex gap-sm">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about the current context…"
            aria-label="AI message"
            disabled={!activeId}
          />
          <Button
            onClick={() => {
              void sendMessage(draft)
              setDraft('')
            }}
            disabled={!activeId || !draft.trim()}
          >
            Send
          </Button>
          <Button variant="ghost" onClick={cancelStream}>
            Cancel
          </Button>
        </div>
      </Stack>
    </div>
  )
}
`
)

write(
  'modules/ai-assistant/index.ts',
  `export { AiAssistantView } from './presentation/ui/AiAssistantView'
export { useAiAssistant } from './presentation/hooks/useAiAssistant'
export * as aiAssistantApi from './infrastructure/api/ai-assistant.api'
export type { AiConversation, AiMessage } from './domain/model/conversation'
`
)

// ── AI Planning ──────────────────────────────────────────────
write(
  'modules/ai-planning/domain/enums/ai-planning.enum.ts',
  `export const AiPlanningRunStatus = {
  Queued: 'QUEUED',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
} as const
export type AiPlanningRunStatus =
  (typeof AiPlanningRunStatus)[keyof typeof AiPlanningRunStatus]

export const SuggestionDecision = {
  Suggested: 'SUGGESTED',
  Accepted: 'ACCEPTED',
  Applied: 'APPLIED',
  Rejected: 'REJECTED',
} as const
export type SuggestionDecision =
  (typeof SuggestionDecision)[keyof typeof SuggestionDecision]
`
)

write(
  'modules/ai-planning/domain/model/planning.ts',
  `export interface AiPlanningRun {
  id: string
  projectId: string
  title?: string
  status: string
  createdAt: string
  completedAt?: string | null
}

export interface AiPlanningSuggestion {
  id: string
  runId: string
  title: string
  state: string
  summary?: string | null
  requiresChangeRequest?: boolean
}
`
)

write(
  'modules/ai-planning/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

export const AI_PLANNING_ENDPOINTS = {
  runs: (projectId: string) => apiPath(\`/projects/\${projectId}/ai-planning/runs\`),
  run: (projectId: string, runId: string) =>
    apiPath(\`/projects/\${projectId}/ai-planning/runs/\${runId}\`),
  suggestions: (projectId: string, runId: string) =>
    apiPath(\`/projects/\${projectId}/ai-planning/runs/\${runId}/suggestions\`),
  applyPreview: (projectId: string, suggestionId: string) =>
    apiPath(
      \`/projects/\${projectId}/ai-planning/suggestions/\${suggestionId}/apply-preview\`),
} as const
`
)

write(
  'modules/ai-planning/infrastructure/api/ai-planning.api.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { AI_PLANNING_ENDPOINTS } from './endpoints'
import type { AiPlanningRun, AiPlanningSuggestion } from '../../domain/model/planning'

export async function listPlanningRuns(
  projectId: string
): Promise<{ items: AiPlanningRun[] }> {
  return apiClient.get(AI_PLANNING_ENDPOINTS.runs(projectId))
}

export async function listSuggestions(
  projectId: string,
  runId: string
): Promise<{ items: AiPlanningSuggestion[] }> {
  return apiClient.get(AI_PLANNING_ENDPOINTS.suggestions(projectId, runId))
}
`
)

write(
  'modules/ai-planning/presentation/hooks/useAiPlanning.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/ai-planning.api'
import type { AiPlanningRun } from '../../domain/model/planning'

export function useAiPlanning(projectId: string | null) {
  const [items, setItems] = useState<AiPlanningRun[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listPlanningRuns(projectId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load planning runs')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
`
)

write(
  'modules/ai-planning/presentation/ui/AiPlanningCenterView.tsx',
  `'use client'

import { useParams } from 'next/navigation'
import { ContentLoader, Stack, Typography, GovernedObjectBadge } from '@/shared/ui'
import { useAiPlanning } from '../hooks/useAiPlanning'

export function AiPlanningCenterView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { items, loading, error } = useAiPlanning(projectId)

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">AI Planning Center</Typography>
      <Typography tone="muted">
        Review suggestions as suggested / accepted / applied. Baseline-guarded projects may
        require a Change Request before apply.
      </Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No planning runs yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((run) => (
            <li key={run.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {run.title ?? run.id}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {run.status}
                </Typography>
              </div>
              <GovernedObjectBadge baselineGuarded />
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
`
)

write(
  'modules/ai-planning/index.ts',
  `export { AiPlanningCenterView } from './presentation/ui/AiPlanningCenterView'
export { useAiPlanning } from './presentation/hooks/useAiPlanning'
export * as aiPlanningApi from './infrastructure/api/ai-planning.api'
export type { AiPlanningRun, AiPlanningSuggestion } from './domain/model/planning'
`
)

// ── AI Recommendation ────────────────────────────────────────
write(
  'modules/ai-recommendation/domain/enums/ai-recommendation.enum.ts',
  `export const RecommendationStatus = {
  Open: 'OPEN',
  Dismissed: 'DISMISSED',
  Applied: 'APPLIED',
} as const
export type RecommendationStatus =
  (typeof RecommendationStatus)[keyof typeof RecommendationStatus]
`
)

write(
  'modules/ai-recommendation/domain/model/recommendation.ts',
  `export interface AiRecommendation {
  id: string
  projectId?: string | null
  title: string
  summary?: string | null
  status: string
  entityType?: string | null
  entityId?: string | null
  createdAt: string
}
`
)

write(
  'modules/ai-recommendation/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const q = p.toString()
  return q ? \`\${base}?\${q}\` : base
}

export const AI_RECOMMENDATION_ENDPOINTS = {
  list: (params?: { projectId?: string }) =>
    withQuery(apiPath('/ai-recommendations'), params),
  get: (id: string) => apiPath(\`/ai-recommendations/\${id}\`),
} as const
`
)

write(
  'modules/ai-recommendation/infrastructure/api/ai-recommendation.api.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { AI_RECOMMENDATION_ENDPOINTS } from './endpoints'
import type { AiRecommendation } from '../../domain/model/recommendation'

export async function listRecommendations(params?: {
  projectId?: string
}): Promise<{ items: AiRecommendation[] }> {
  return apiClient.get(AI_RECOMMENDATION_ENDPOINTS.list(params))
}
`
)

write(
  'modules/ai-recommendation/presentation/hooks/useAiRecommendations.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/ai-recommendation.api'
import type { AiRecommendation } from '../../domain/model/recommendation'

export function useAiRecommendations(projectId: string | null) {
  const [items, setItems] = useState<AiRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listRecommendations({ projectId })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
`
)

write(
  'modules/ai-recommendation/presentation/ui/RecommendationCenterView.tsx',
  `'use client'

import { useParams } from 'next/navigation'
import { ContentLoader, Stack, Typography } from '@/shared/ui'
import { useAiRecommendations } from '../hooks/useAiRecommendations'

export function RecommendationCenterView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { items, loading, error } = useAiRecommendations(projectId)

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Recommendation Center</Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No recommendations.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="p-md">
              <Typography variant="small" weight="medium">
                {item.title}
              </Typography>
              <Typography variant="caption" tone="muted">
                {item.status}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
`
)

write(
  'modules/ai-recommendation/index.ts',
  `export { RecommendationCenterView } from './presentation/ui/RecommendationCenterView'
export { useAiRecommendations } from './presentation/hooks/useAiRecommendations'
export * as aiRecommendationApi from './infrastructure/api/ai-recommendation.api'
export type { AiRecommendation } from './domain/model/recommendation'
`
)

console.log('AI modules done')
