'use client'

import { useCallback, useRef, useState } from 'react'
import { AiMessageRole } from '../../domain/enums/ai-assistant.enum'
import type { AiConversation, AiMessage } from '../../domain/model/conversation'
import * as api from '../../infrastructure/api/ai-assistant.api'
import { useAiMessageStream } from './useAiMessageStream'

function sessionKey(projectId: string | null) {
  return `scopery.ai-sidebar.cid.${projectId ?? 'workspace'}`
}

export function useAiSidebarChat(opts: {
  workspaceId: string | null
  projectId: string | null
}) {
  const [conversationId, setConversationId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      return sessionStorage.getItem(sessionKey(opts.projectId))
    } catch {
      return null
    }
  })
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [conversationsLoaded, setConversationsLoaded] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const createLockRef = useRef(false)

  const {
    streamingText,
    tools: streamTools,
    uiState: streamUiState,
    streamState,
    isStreaming,
    startFromSend,
    cancelGeneration,
    closeStreamOnly,
    resetStream,
  } = useAiMessageStream()

  const loadMessages = useCallback(async (cid: string) => {
    try {
      const res = await api.listMessages(cid)
      setMessages(res.items)
    } catch {
      // keep existing messages if reload fails
    } finally {
      setMessagesLoaded(true)
    }
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.listConversations({ size: 50 })
      const filtered = res.items
        .filter((c) => {
          if (c.status === 'DELETED') return false
          if (opts.projectId) return c.projectId === opts.projectId
          return true
        })
        .sort((a, b) => {
          const ta = a.lastMessageAt ?? a.updatedAt ?? a.createdAt
          const tb = b.lastMessageAt ?? b.updatedAt ?? b.createdAt
          return tb > ta ? 1 : -1
        })
      setConversations(filtered)
    } catch {
      // ignore — conversations list is non-critical
    } finally {
      setConversationsLoaded(true)
    }
  }, [opts.projectId])

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationId) {
      if (!messagesLoaded) await loadMessages(conversationId)
      return conversationId
    }
    if (!opts.workspaceId || createLockRef.current) return null
    createLockRef.current = true
    setCreating(true)
    try {
      const created = await api.createConversation({
        workspaceId: opts.workspaceId,
        projectId: opts.projectId,
        title: null,
        conversationType: opts.projectId ? 'PROJECT_ASSISTANT' : 'GENERAL_GUIDE',
        capabilityLevel: 'CONTEXTUAL_ANSWER',
        assistantAgentId: null,
      })
      setConversationId(created.id)
      setConversations((prev) => [created, ...prev.filter((c) => c.id !== created.id)])
      try {
        sessionStorage.setItem(sessionKey(opts.projectId), created.id)
      } catch { /* ignore */ }
      setMessages([])
      setMessagesLoaded(true)
      return created.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
      return null
    } finally {
      createLockRef.current = false
      setCreating(false)
    }
  }, [conversationId, messagesLoaded, opts.workspaceId, opts.projectId, loadMessages])

  const openConversation = useCallback(async (id: string) => {
    closeStreamOnly()
    resetStream()
    setConversationId(id)
    setMessages([])
    setMessagesLoaded(false)
    setError(null)
    try {
      sessionStorage.setItem(sessionKey(opts.projectId), id)
    } catch { /* ignore */ }
    await loadMessages(id)
  }, [closeStreamOnly, resetStream, opts.projectId, loadMessages])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return
      setError(null)
      const cid = await ensureConversation()
      if (!cid) return
      await startFromSend({
        conversationId: cid,
        content: trimmed,
        onUserAccepted: (userMessageId) => {
          setMessages((prev) => [
            ...prev,
            {
              id: userMessageId ?? `local-user-${Date.now()}`,
              conversationId: cid,
              role: AiMessageRole.User,
              content: trimmed,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            },
          ])
        },
        onTerminal: () => {
          void loadMessages(cid)
          // Refresh conversation list so title/lastMessageAt updates
          void loadConversations()
        },
      })
    },
    [isStreaming, ensureConversation, startFromSend, loadMessages, loadConversations]
  )

  const reset = useCallback(() => {
    closeStreamOnly()
    resetStream()
    setConversationId(null)
    setMessages([])
    setMessagesLoaded(false)
    setError(null)
    try {
      sessionStorage.removeItem(sessionKey(opts.projectId))
    } catch { /* ignore */ }
    // conversations list is preserved
  }, [closeStreamOnly, resetStream, opts.projectId])

  const initLoad = useCallback(async () => {
    const tasks: Promise<void>[] = []
    if (!conversationsLoaded) tasks.push(loadConversations())
    if (conversationId && !messagesLoaded) tasks.push(loadMessages(conversationId))
    await Promise.all(tasks)
  }, [conversationId, messagesLoaded, conversationsLoaded, loadMessages, loadConversations])

  const cancelStream = useCallback(async () => {
    await cancelGeneration()
  }, [cancelGeneration])

  return {
    conversationId,
    conversations,
    messages,
    streamingText,
    streamTools,
    streamUiState,
    streamState,
    isStreaming,
    creating,
    error,
    send,
    reset,
    cancelStream,
    initLoad,
    openConversation,
  }
}
