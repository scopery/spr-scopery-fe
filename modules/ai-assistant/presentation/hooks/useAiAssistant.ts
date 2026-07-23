'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { clearAiAssistantHeaderContext } from '@/shared/lib/aiAssistantHeaders'
import { AiConversationStatus, AiMessageRole } from '../../domain/enums/ai-assistant.enum'
import type {
  AiCapabilityLevel,
  AiConversationType,
} from '../../domain/enums/ai-assistant.enum'
import * as api from '../../infrastructure/api/ai-assistant.api'
import type {
  AiChatDocumentContext,
  AiConversation,
  AiMessage,
} from '../../domain/model/conversation'
import { useAiMessageStream } from './useAiMessageStream'

export type ConversationListTab = 'active' | 'archived'

function sameDocContext(
  a: AiChatDocumentContext | null,
  b: AiChatDocumentContext | null
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.projectId === b.projectId &&
    a.documentId === b.documentId &&
    a.title === b.title
  )
}

function isArchived(c: AiConversation): boolean {
  return c.status === AiConversationStatus.Archived || c.status === 'ARCHIVED'
}

function isDeleted(c: AiConversation): boolean {
  return c.status === AiConversationStatus.Deleted || c.status === 'DELETED'
}

export function useAiAssistant() {
  const params = useParams<{
    workspaceId?: string
    projectId?: string
    conversationId?: string
  }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId ?? null
  const routeConversationId = params.conversationId ?? null

  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(routeConversationId)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listTab, setListTab] = useState<ConversationListTab>('active')
  const [listSearch, setListSearch] = useState('')
  const [documentContext, setDocumentContextState] = useState<AiChatDocumentContext | null>(
    null
  )
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<
    Record<string, 'THUMBS_UP' | 'THUMBS_DOWN'>
  >({})
  const createLockRef = useRef(false)
  const prevWorkspaceRef = useRef<string | null>(workspaceId)
  // Tracks navigation triggered by openConversation so the deep-link effect doesn't re-fetch.
  const skipDeeplinkRef = useRef<string | null>(null)

  const {
    streamState,
    streamingText,
    tools: streamTools,
    uiState: streamUiState,
    isStreaming,
    startFromSend,
    cancelGeneration,
    retryConnection,
    closeStreamOnly,
    resetStream,
  } = useAiMessageStream()

  const conversationHref = useCallback(
    (conversationId: string) => {
      if (!workspaceId) return '#'
      return ROUTES.workspace.aiAssistantConversation(workspaceId, conversationId)
    },
    [workspaceId]
  )

  const homeHref = useCallback(() => {
    if (!workspaceId) return '#'
    return ROUTES.workspace.aiAssistant(workspaceId)
  }, [workspaceId])

  const setDocumentContext = useCallback((next: AiChatDocumentContext | null) => {
    setDocumentContextState((prev) => (sameDocContext(prev, next) ? prev : next))
  }, [])

  const clearDocumentContext = useCallback(() => {
    setDocumentContextState(null)
  }, [])

  const resetLocalState = useCallback(() => {
    closeStreamOnly()
    resetStream()
    setConversations([])
    setActiveId(null)
    setMessages([])
    setError(null)
    setDocumentContextState(null)
    setSuggestedQuestions([])
    setFeedbackByMessageId({})
  }, [closeStreamOnly, resetStream])

  // Clear AI Assistant cache when workspace switches (spec §5.1)
  useEffect(() => {
    if (prevWorkspaceRef.current && prevWorkspaceRef.current !== workspaceId) {
      resetLocalState()
      clearAiAssistantHeaderContext()
    }
    prevWorkspaceRef.current = workspaceId
  }, [workspaceId, resetLocalState])

  const loadConversations = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listConversations({ page: 0, size: 100 })
      setConversations(res.items.filter((c) => !isDeleted(c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void loadConversations()
    return () => {
      // Unmount: close SSE only — do not auto-cancel generation (spec §8.7)
      closeStreamOnly()
    }
  }, [loadConversations, closeStreamOnly])

  const filteredConversations = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    return conversations.filter((c) => {
      const archived = isArchived(c)
      if (listTab === 'active' && archived) return false
      if (listTab === 'archived' && !archived) return false
      if (!q) return true
      return (c.title ?? '').toLowerCase().includes(q)
    })
  }, [conversations, listTab, listSearch])

  const qProjectId = searchParams.get('projectId')
  const qDocumentId = searchParams.get('documentId')
  const qDocumentTitle = searchParams.get('documentTitle')

  useEffect(() => {
    if (!qProjectId || !qDocumentId) return
    setDocumentContext({
      projectId: qProjectId,
      documentId: qDocumentId,
      title: qDocumentTitle?.trim() || 'Document',
    })
  }, [qProjectId, qDocumentId, qDocumentTitle, setDocumentContext])

  const openConversation = useCallback(
    async (id: string, opts?: { navigate?: boolean }) => {
      closeStreamOnly()
      setActiveId(id)
      setError(null)
      try {
        const res = await api.listMessages(id)
        setMessages(res.items)
        if (opts?.navigate !== false && workspaceId) {
          const href = conversationHref(id)
          if (typeof window !== 'undefined' && window.location.pathname !== href) {
            skipDeeplinkRef.current = id
            router.push(href)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open conversation')
      }
    },
    [workspaceId, conversationHref, router, closeStreamOnly]
  )

  // Deep-link: /workspace/.../ai/c/:conversationId
  useEffect(() => {
    if (!routeConversationId) return
    if (skipDeeplinkRef.current === routeConversationId) {
      skipDeeplinkRef.current = null
      return
    }
    if (activeId === routeConversationId && messages.length > 0) return
    void openConversation(routeConversationId, { navigate: false })
  }, [routeConversationId]) // eslint-disable-line react-hooks/exhaustive-deps -- one-shot per route id

  // Home /ai — workspace landing (do not keep a stale active conversation)
  useEffect(() => {
    if (routeConversationId) return
    setActiveId(null)
    setMessages([])
    closeStreamOnly()
    resetStream()
  }, [routeConversationId, closeStreamOnly, resetStream])

  const goToLanding = useCallback(() => {
    closeStreamOnly()
    resetStream()
    setActiveId(null)
    setMessages([])
    if (workspaceId) router.push(homeHref())
  }, [closeStreamOnly, resetStream, workspaceId, homeHref, router])

  const startConversation = useCallback(
    async (opts?: {
      projectId?: string | null
      title?: string | null
      conversationType?: AiConversationType | string
      capabilityLevel?: AiCapabilityLevel | string
      assistantAgentId?: string | null
    }) => {
      if (!workspaceId) {
        setError('Workspace is required to start a conversation')
        return null
      }
      if (createLockRef.current || mutating) return null
      createLockRef.current = true
      setMutating(true)
      setError(null)
      try {
        const conversationType = opts?.conversationType ?? 'GENERAL_GUIDE'
        const projectId =
          opts?.projectId ??
          documentContext?.projectId ??
          params.projectId ??
          null
        if (conversationType === 'PROJECT_ASSISTANT' && !projectId) {
          setError('Project is required for project assistant conversations')
          return null
        }
        const created = await api.createConversation({
          workspaceId,
          projectId,
          title: opts?.title ?? (documentContext ? `Ask: ${documentContext.title}` : null),
          conversationType,
          capabilityLevel: opts?.capabilityLevel ?? 'CONTEXTUAL_ANSWER',
          assistantAgentId: opts?.assistantAgentId ?? null,
        })
        await loadConversations()
        await openConversation(created.id)
        return created
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create conversation')
        return null
      } finally {
        createLockRef.current = false
        setMutating(false)
      }
    },
    [
      workspaceId,
      documentContext,
      params.projectId,
      loadConversations,
      openConversation,
      mutating,
    ]
  )

  // Document query params set grounding context only — landing stays until the user starts work.

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) {
        setError('Title is required')
        return false
      }
      setMutating(true)
      setError(null)
      try {
        const updated = await api.patchConversationTitle(id, trimmed.slice(0, 200))
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: updated.title ?? trimmed } : c))
        )
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rename')
        return false
      } finally {
        setMutating(false)
      }
    },
    []
  )

  const archiveConversation = useCallback(
    async (id: string) => {
      setMutating(true)
      setError(null)
      try {
        await api.archiveConversation(id)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, status: AiConversationStatus.Archived } : c
          )
        )
        if (activeId === id) {
          setActiveId(null)
          setMessages([])
          if (workspaceId) router.push(homeHref())
        }
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to archive')
        return false
      } finally {
        setMutating(false)
      }
    },
    [activeId, workspaceId, homeHref, router]
  )

  const deleteConversation = useCallback(
    async (id: string) => {
      setMutating(true)
      setError(null)
      try {
        await api.deleteConversation(id)
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeId === id) {
          setActiveId(null)
          setMessages([])
          if (workspaceId) router.push(homeHref())
        }
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete')
        return false
      } finally {
        setMutating(false)
      }
    },
    [activeId, workspaceId, homeHref, router]
  )

  const sendMessage = useCallback(
    async (content: string, conversationId?: string) => {
      const targetId = conversationId ?? activeId
      if (!targetId || !content.trim() || isStreaming) return
      setError(null)
      const trimmed = content.trim()
      try {
        await startFromSend({
          conversationId: targetId,
          content: trimmed,
          pageCode: documentContext ? 'DOCUMENT_DETAIL' : 'AI_ASSISTANT',
          entityType: documentContext ? 'DOCUMENT' : null,
          entityId: documentContext?.documentId ?? null,
          sourceProjectId: documentContext?.projectId ?? null,
          onUserAccepted: (userMessageId) => {
            setMessages((prev) => [
              ...prev,
              {
                id: userMessageId ?? `local-user-${Date.now()}`,
                conversationId: targetId,
                role: AiMessageRole.User,
                content: trimmed,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              },
            ])
          },
          onTerminal: () => {
            void openConversation(targetId, { navigate: false })
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Send failed')
      }
    },
    [activeId, documentContext, isStreaming, startFromSend, openConversation]
  )

  const startWork = useCallback(
    async (prompt: string, opts?: { projectId?: string | null; title?: string | null }) => {
      const trimmed = prompt.trim()
      if (!trimmed) return null
      const projectId =
        opts?.projectId ?? documentContext?.projectId ?? params.projectId ?? null
      const created = await startConversation({
        projectId,
        title: (opts?.title ?? trimmed).slice(0, 80),
        conversationType: projectId ? 'PROJECT_ASSISTANT' : 'GENERAL_GUIDE',
      })
      if (!created) return null
      await sendMessage(trimmed, created.id)
      return created
    },
    [documentContext?.projectId, params.projectId, startConversation, sendMessage]
  )

  const cancelStream = useCallback(async () => {
    await cancelGeneration()
  }, [cancelGeneration])

  const retryStreamConnection = useCallback(() => {
    retryConnection()
  }, [retryConnection])

  useEffect(() => {
    let cancelled = false
    const pageCode = documentContext?.documentId ? 'DOCUMENT_DETAIL' : 'AI_ASSISTANT'
    void api
      .listSuggestedQuestions({ pageCode })
      .then((res) => {
        if (cancelled) return
        setSuggestedQuestions(
          res.items
            .map((q) => (typeof q === 'string' ? q : q.questionText ?? q.code ?? ''))
            .filter(Boolean)
        )
      })
      .catch(() => {
        if (!cancelled) setSuggestedQuestions([])
      })
    return () => {
      cancelled = true
    }
  }, [documentContext?.documentId])

  const rateMessage = useCallback(
    async (
      messageId: string,
      rating: 'THUMBS_UP' | 'THUMBS_DOWN',
      opts?: { reasonCode?: string | null; comment?: string }
    ): Promise<boolean> => {
      if (!activeId) return false
      // Create-once (W5-GAP-05) — no update/delete endpoint
      if (feedbackByMessageId[messageId]) {
        setError('Feedback already submitted for this message')
        return false
      }
      setError(null)
      setMutating(true)
      try {
        await api.submitFeedback({
          conversationId: activeId,
          messageId,
          rating,
          reasonCode: opts?.reasonCode ?? null,
          comment: opts?.comment,
        })
        setFeedbackByMessageId((prev) => ({ ...prev, [messageId]: rating }))
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Feedback failed')
        return false
      } finally {
        setMutating(false)
      }
    },
    [activeId, feedbackByMessageId]
  )

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  )

  return {
    workspaceId,
    conversations: filteredConversations,
    allConversations: conversations,
    activeId,
    activeConversation,
    messages,
    streamingText,
    streamTools,
    streamUiState,
    streamState,
    isStreaming,
    suggestedQuestions,
    documentContext,
    setDocumentContext,
    clearDocumentContext,
    loading,
    mutating,
    error: error ?? streamState.error,
    listTab,
    setListTab,
    listSearch,
    setListSearch,
    openConversation,
    startConversation,
    startWork,
    goToLanding,
    renameConversation,
    archiveConversation,
    deleteConversation,
    sendMessage,
    cancelStream,
    retryStreamConnection,
    rateMessage,
    feedbackByMessageId,
    refetch: loadConversations,
    homeHref,
  }
}
