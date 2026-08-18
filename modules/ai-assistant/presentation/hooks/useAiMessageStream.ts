'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildAiAssistantHeaders } from '@/shared/lib/aiAssistantHeaders'
import {
  extractSseTextDelta,
  isSseTokenEvent,
  openSseStream,
  parseSseJson,
  resolveSseUrl,
  SseEventType,
} from '@/shared/lib/sseClient'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import * as api from '../../infrastructure/api/ai-assistant.api'
import {
  applyCancelled,
  applyCompleted,
  applyFailed,
  applyReconnect,
  applyReconnectExhausted,
  applyStatusChanged,
  applyToken,
  applyToolCall,
  applyToolResult,
  applyActionPlanReady,
  dismissActionPlan,
  createInitialStreamState,
  isTerminalUiState,
  markEventSeen,
  shouldIgnoreDuplicateEvent,
  type ActionPlanSummary,
  type StreamControllerState,
  type StreamToolCall,
} from './aiMessageStream.reducer'

const TOKEN_FLUSH_MS = 48
const CANCEL_TIMEOUT_MS = 20_000

function parseJsonSafe<T>(raw: string): T | null {
  const parsed = parseSseJson(raw)
  return parsed == null ? null : (parsed as T)
}

export interface UseAiMessageStreamResult {
  streamState: StreamControllerState
  streamingText: string
  tools: StreamToolCall[]
  uiState: AiStreamUiState
  isStreaming: boolean
  startFromSend: (args: {
    conversationId: string
    content: string
    pageCode?: string | null
    entityType?: string | null
    entityId?: string | null
    sourceProjectId?: string | null
    onUserAccepted?: (userMessageId: string | undefined) => void
    onTerminal?: () => void
  }) => Promise<void>
  cancelGeneration: () => Promise<void>
  retryConnection: () => void
  closeStreamOnly: () => void
  resetStream: () => void
  dismissActionPlan: (planId: string) => void
}

export function useAiMessageStream(): UseAiMessageStreamResult {
  const [streamState, setStreamState] = useState<StreamControllerState>(
    createInitialStreamState
  )
  const stateRef = useRef(streamState)
  const cancelFnRef = useRef<(() => void) | null>(null)
  const tokenBufferRef = useRef('')
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeUrlRef = useRef<string | null>(null)
  const onTerminalRef = useRef<(() => void) | null>(null)
  const pendingCancelRef = useRef(false)

  useEffect(() => {
    stateRef.current = streamState
  }, [streamState])

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
  }, [])

  const flushTokenBuffer = useCallback(() => {
    clearFlushTimer()
    const chunk = tokenBufferRef.current
    if (!chunk) return
    tokenBufferRef.current = ''
    setStreamState((prev) => applyToken(prev, chunk))
  }, [clearFlushTimer])

  const queueToken = useCallback(
    (token: string) => {
      tokenBufferRef.current += token
      if (flushTimerRef.current) return
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null
        flushTokenBuffer()
      }, 0)
    },
    [flushTokenBuffer]
  )

  const clearCancelTimeout = useCallback(() => {
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current)
      cancelTimeoutRef.current = null
    }
  }, [])

  const closeTransport = useCallback(() => {
    cancelFnRef.current?.()
    cancelFnRef.current = null
    clearFlushTimer()
    clearCancelTimeout()
  }, [clearFlushTimer, clearCancelTimeout])

  const resetStream = useCallback(() => {
    closeTransport()
    tokenBufferRef.current = ''
    pendingCancelRef.current = false
    activeUrlRef.current = null
    onTerminalRef.current = null
    setStreamState(createInitialStreamState())
  }, [closeTransport])

  /** Close SSE without POSTing cancel (route unmount / workspace switch). */
  const closeStreamOnly = useCallback(() => {
    closeTransport()
    pendingCancelRef.current = false
    setStreamState((prev) =>
      isTerminalUiState(prev.uiState) ? prev : { ...prev, uiState: AiStreamUiState.Idle }
    )
  }, [closeTransport])

  const handleTerminal = useCallback(
    (next: StreamControllerState) => {
      clearFlushTimer()
      const buffered = tokenBufferRef.current
      tokenBufferRef.current = ''
      clearCancelTimeout()
      pendingCancelRef.current = false
      setStreamState((prev) => ({
        ...next,
        streamingText: prev.streamingText + buffered,
      }))
      closeTransport()
      const cb = onTerminalRef.current
      onTerminalRef.current = null
      cb?.()
    },
    [clearFlushTimer, clearCancelTimeout, closeTransport]
  )

  const connect = useCallback(
    (url: string, initialLastEventId?: string | null) => {
      closeTransport()
      activeUrlRef.current = url
      setStreamState((prev) => ({
        ...prev,
        uiState:
          prev.uiState === AiStreamUiState.Reconnecting
            ? AiStreamUiState.Reconnecting
            : AiStreamUiState.Connecting,
        error: null,
        canRetryConnection: false,
      }))

      const { cancel } = openSseStream({
        url,
        headers: buildAiAssistantHeaders(),
        initialLastEventId: initialLastEventId ?? stateRef.current.lastEventId,
        maxReconnects: 3,
        reconnectDelayMs: 800,
        onReconnect: () => {
          setStreamState((prev) => applyReconnect(prev))
        },
        onEvent: (ev) => {
          // Token events: call queueToken OUTSIDE setStreamState updater to
          // avoid React Concurrent Mode invoking the updater multiple times
          // and double-appending the token to the buffer.
          if (isSseTokenEvent(ev.event)) {
            if (!shouldIgnoreDuplicateEvent(stateRef.current, ev.id)) {
              const token = extractSseTextDelta(ev.data)
              if (token) queueToken(token)
            }
            setStreamState((prev) => {
              if (shouldIgnoreDuplicateEvent(prev, ev.id)) return prev
              const next = markEventSeen(prev, ev.id)
              return {
                ...next,
                uiState:
                  next.uiState === AiStreamUiState.Cancelling
                    ? AiStreamUiState.Cancelling
                    : AiStreamUiState.Connected,
              }
            })
            return
          }

          setStreamState((prev) => {
            if (shouldIgnoreDuplicateEvent(prev, ev.id)) return prev
            let next = markEventSeen(prev, ev.id)

            if (ev.event === SseEventType.StatusChanged) {
              const parsed = parseJsonSafe<{ status?: string }>(ev.data)
              if (parsed?.status) next = applyStatusChanged(next, parsed.status)
              if (parsed?.status === 'CANCELLED') {
                queueMicrotask(() => handleTerminal(applyCancelled(next)))
              } else if (parsed?.status === 'COMPLETED') {
                queueMicrotask(() => handleTerminal(applyCompleted(next)))
              } else if (parsed?.status === 'FAILED' || parsed?.status === 'BLOCKED') {
                queueMicrotask(() => handleTerminal(applyFailed(next, 'Generation failed')))
              }
              return next
            }

            if (ev.event === SseEventType.ToolCall || ev.event === 'tool.started') {
              const parsed = parseJsonSafe<{
                toolName?: string
                name?: string
                input?: unknown
                toolCallId?: string
                id?: string
              }>(ev.data)
              return applyToolCall(next, {
                toolName: parsed?.toolName ?? parsed?.name,
                input: parsed?.input,
                toolCallId: parsed?.toolCallId ?? parsed?.id,
              })
            }

            if (ev.event === SseEventType.ToolResult || ev.event === 'tool.completed') {
              const parsed = parseJsonSafe<{
                toolName?: string
                name?: string
                result?: unknown
                toolCallId?: string
                id?: string
                durationMs?: number
                error?: string
              }>(ev.data)
              return applyToolResult(next, {
                toolName: parsed?.toolName ?? parsed?.name,
                result: parsed?.result,
                toolCallId: parsed?.toolCallId ?? parsed?.id,
                durationMs: parsed?.durationMs,
                error: parsed?.error,
              })
            }

            if (
              ev.event === SseEventType.Completed ||
              ev.event === 'message.completed' ||
              ev.event === 'turn.completed' ||
              ev.event === 'answer.completed'
            ) {
              const completed = applyCompleted(next)
              queueMicrotask(() => handleTerminal(completed))
              return completed
            }

            if (
              ev.event === SseEventType.Error ||
              ev.event === 'message.error' ||
              ev.event === 'answer.failed'
            ) {
              const parsed = parseJsonSafe<{ message?: string; errorCode?: string }>(
                ev.data
              )
              const failed = applyFailed(
                next,
                parsed?.message ?? parsed?.errorCode ?? 'Stream error'
              )
              queueMicrotask(() => handleTerminal(failed))
              return failed
            }

            if (ev.event === 'answer.cancelled') {
              queueMicrotask(() => handleTerminal(applyCancelled(next)))
              return next
            }

            if (ev.event === 'action.plan_ready') {
              const parsed = parseJsonSafe<ActionPlanSummary>(ev.data)
              if (parsed?.planId) return applyActionPlanReady(next, parsed)
              return next
            }

            return next
          })
        },
        onError: () => {
          // openSseStream may still reconnect; surface only after exhaustion via onDone path
        },
        onDone: () => {
          const current = stateRef.current
          if (isTerminalUiState(current.uiState)) return
          if (pendingCancelRef.current) {
            handleTerminal(applyCancelled(current))
            return
          }
          const messageId = current.assistantMessageId
          if (messageId) {
            void api
              .getMessage(messageId)
              .then((msg) => {
                const latest = stateRef.current
                if (isTerminalUiState(latest.uiState)) return
                const status = String(msg.status ?? '').toUpperCase()
                const text = latest.streamingText || msg.content || ''
                if (status === 'COMPLETED' || text.trim()) {
                  handleTerminal(applyCompleted({ ...latest, streamingText: text }))
                  return
                }
                if (status === 'FAILED' || status === 'BLOCKED') {
                  handleTerminal(applyFailed(latest, 'Generation failed'))
                  return
                }
                if (status === 'CANCELLED') {
                  handleTerminal(applyCancelled(latest))
                  return
                }
                setStreamState((prev) => applyReconnectExhausted(prev))
                const cb = onTerminalRef.current
                if (cb) {
                  onTerminalRef.current = null
                  cb()
                }
              })
              .catch(() => {
                const latest = stateRef.current
                if (isTerminalUiState(latest.uiState)) return
                if (latest.streamingText.trim()) {
                  handleTerminal(applyCompleted(latest))
                  return
                }
                setStreamState((prev) => applyReconnectExhausted(prev))
                const cb = onTerminalRef.current
                if (cb) {
                  onTerminalRef.current = null
                  cb()
                }
              })
            return
          }
          if (current.streamingText.trim()) {
            handleTerminal(applyCompleted(current))
            return
          }
          setStreamState((prev) => applyReconnectExhausted(prev))
          const cb = onTerminalRef.current
          if (cb) {
            onTerminalRef.current = null
            cb()
          }
        },
      })
      cancelFnRef.current = cancel
    },
    [closeTransport, handleTerminal, queueToken]
  )

  const startFromSend = useCallback(
    async (args: {
      conversationId: string
      content: string
      pageCode?: string | null
      entityType?: string | null
      entityId?: string | null
      sourceProjectId?: string | null
      onUserAccepted?: (userMessageId: string | undefined) => void
      onTerminal?: () => void
    }) => {
      resetStream()
      onTerminalRef.current = args.onTerminal ?? null
      setStreamState((prev) => ({
        ...prev,
        uiState: AiStreamUiState.Starting,
      }))

      const result = await api.createMessage(args.conversationId, {
        content: args.content,
        pageCode: args.pageCode ?? null,
        entityType: args.entityType ?? null,
        entityId: args.entityId ?? null,
        sourceProjectId: args.sourceProjectId ?? null,
      })

      // Optimistic user message only after 202 accepted
      args.onUserAccepted?.(result.userMessageId)

      const streamId = result.assistantMessageId ?? result.messageId
      const streamUrl = api.resolveMessageStreamUrl(result)

      setStreamState((prev) => ({
        ...prev,
        assistantMessageId: streamId || null,
        uiState: AiStreamUiState.Connecting,
      }))

      if (!streamUrl) {
        handleTerminal(applyCompleted(stateRef.current))
        return
      }

      // Start replay from sequence 0 so events already persisted before connect are replayed
      connect(resolveSseUrl(streamUrl), '0')
    },
    [resetStream, connect, handleTerminal]
  )

  const cancelGeneration = useCallback(async () => {
    const messageId = stateRef.current.assistantMessageId
    if (!messageId) {
      closeStreamOnly()
      return
    }
    // Spec: POST cancel, keep SSE open until terminal / timeout
    pendingCancelRef.current = true
    setStreamState((prev) => ({
      ...prev,
      uiState: AiStreamUiState.Cancelling,
      messageStatus: 'CANCEL_REQUESTED',
    }))
    try {
      await api.cancelMessage(messageId)
    } catch {
      // keep waiting on SSE; timeout below still applies
    }
    clearCancelTimeout()
    cancelTimeoutRef.current = setTimeout(() => {
      handleTerminal(applyCancelled(stateRef.current))
    }, CANCEL_TIMEOUT_MS)
  }, [closeStreamOnly, clearCancelTimeout, handleTerminal])

  const retryConnection = useCallback(() => {
    const url = activeUrlRef.current
    if (!url) return
    const lastId = stateRef.current.lastEventId
    setStreamState((prev) => applyReconnect(prev))
    connect(url, lastId)
  }, [connect])

  const dismissActionPlanCallback = useCallback((planId: string) => {
    setStreamState((prev) => dismissActionPlan(prev, planId))
  }, [])

  // Unmount: close transport only (do not auto-cancel generation)
  useEffect(() => {
    return () => {
      closeTransport()
    }
  }, [closeTransport])

  const isStreaming =
    streamState.uiState === AiStreamUiState.Starting ||
    streamState.uiState === AiStreamUiState.Connecting ||
    streamState.uiState === AiStreamUiState.Connected ||
    streamState.uiState === AiStreamUiState.Reconnecting ||
    streamState.uiState === AiStreamUiState.Cancelling

  return {
    streamState,
    streamingText: streamState.streamingText,
    tools: streamState.tools,
    uiState: streamState.uiState,
    isStreaming,
    startFromSend,
    cancelGeneration,
    retryConnection,
    closeStreamOnly,
    resetStream,
    dismissActionPlan: dismissActionPlanCallback,
  }
}
