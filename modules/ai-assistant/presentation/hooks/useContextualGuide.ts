'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildAiAssistantHeaders } from '@/shared/lib/aiAssistantHeaders'
import { openSseStream, SseEventType } from '@/shared/lib/sseClient'
import * as api from '../../infrastructure/api/ai-assistant.api'

export type GuideMode = 'page' | 'field' | 'disabled_action' | null

export interface GuideContext {
  workspaceId: string
  projectId?: string | null
  pageCode: string
  fieldCode?: string
  actionCode?: string
  locale?: string
  title?: string
}

function resolveStreamUrl(streamUrl: string): string {
  if (streamUrl.startsWith('http') || streamUrl.startsWith('/')) return streamUrl
  return `/${streamUrl}`
}

export function useContextualGuide(args: {
  workspaceId: string | null
  projectId?: string | null
  pageCode: string
  entityType?: string | null
  locale?: string
}) {
  const { workspaceId, projectId = null, pageCode, entityType = null, locale = 'en-US' } =
    args

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<GuideMode>(null)
  const [contextTitle, setContextTitle] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const closeStream = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
    setStreaming(false)
  }, [])

  useEffect(() => {
    if (!pageCode) return
    let cancelled = false
    setLoadingSuggestions(true)
    void api
      .listSuggestedQuestions({
        pageCode,
        entityType: entityType ?? undefined,
        locale,
      })
      .then((res) => {
        if (cancelled) return
        setSuggestedQuestions(
          res.items
            .map((q) =>
              typeof q === 'string'
                ? q
                : (q as { question?: string; questionText?: string; code?: string })
                    .question ??
                  (q as { questionText?: string }).questionText ??
                  (q as { code?: string }).code ??
                  ''
            )
            .filter(Boolean)
        )
      })
      .catch(() => {
        if (!cancelled) setSuggestedQuestions([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false)
      })
    return () => {
      cancelled = true
    }
  }, [pageCode, entityType, locale])

  useEffect(() => {
    return () => closeStream()
  }, [closeStream])

  const startStream = useCallback(
    async (start: () => Promise<{ streamUrl?: string; messageId?: string; assistantMessageId?: string }>, title: string, nextMode: GuideMode) => {
      if (!workspaceId) {
        setError('Workspace is required')
        return
      }
      closeStream()
      setError(null)
      setStreamingText('')
      setContextTitle(title)
      setMode(nextMode)
      setDrawerOpen(true)
      setStreaming(true)
      try {
        const res = await start()
        const streamUrl = res.streamUrl
        if (!streamUrl) {
          setStreaming(false)
          setError('No stream URL returned')
          return
        }
        const { cancel } = openSseStream({
          url: resolveStreamUrl(streamUrl),
          headers: buildAiAssistantHeaders(),
          maxReconnects: 2,
          onEvent: (ev) => {
            if (
              ev.event === SseEventType.Token ||
              ev.event === 'message.delta' ||
              ev.event === 'content.delta'
            ) {
              try {
                const parsed = JSON.parse(ev.data) as {
                  token?: string
                  delta?: string
                  text?: string
                }
                setStreamingText(
                  (prev) => prev + (parsed.token ?? parsed.delta ?? parsed.text ?? '')
                )
              } catch {
                setStreamingText((prev) => prev + ev.data)
              }
            }
            if (
              ev.event === SseEventType.Completed ||
              ev.event === SseEventType.Error ||
              ev.event === 'message.completed' ||
              ev.event === 'message.error'
            ) {
              setStreaming(false)
              if (ev.event === SseEventType.Error || ev.event === 'message.error') {
                try {
                  const parsed = JSON.parse(ev.data) as { message?: string }
                  setError(parsed.message ?? 'Guide stream failed')
                } catch {
                  setError('Guide stream failed')
                }
              }
            }
          },
          onError: (err) => {
            setError(err instanceof Error ? err.message : 'Guide stream failed')
            setStreaming(false)
          },
          onDone: () => setStreaming(false),
        })
        cancelRef.current = cancel
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start explanation')
        setStreaming(false)
      }
    },
    [workspaceId, closeStream]
  )

  const explainPage = useCallback(async () => {
    if (!workspaceId) return
    await startStream(
      () =>
        api.explainPage({
          workspaceId,
          projectId,
          pageCode,
          locale,
        }),
      `Explain page · ${pageCode}`,
      'page'
    )
  }, [workspaceId, projectId, pageCode, locale, startStream])

  const explainField = useCallback(
    async (fieldCode: string, label?: string) => {
      if (!workspaceId) return
      await startStream(
        () =>
          api.explainField({
            workspaceId,
            projectId,
            pageCode,
            fieldCode,
            locale,
          }),
        label ? `Field · ${label}` : `Field · ${fieldCode}`,
        'field'
      )
    },
    [workspaceId, projectId, pageCode, locale, startStream]
  )

  const explainDisabledAction = useCallback(
    async (actionCode: string, label?: string) => {
      if (!workspaceId) return
      await startStream(
        () =>
          api.explainDisabledAction({
            workspaceId,
            projectId,
            pageCode,
            actionCode,
            locale,
          }),
        label ? `Why disabled · ${label}` : `Why disabled · ${actionCode}`,
        'disabled_action'
      )
    },
    [workspaceId, projectId, pageCode, locale, startStream]
  )

  const closeDrawer = useCallback(() => {
    closeStream()
    setDrawerOpen(false)
    setMode(null)
  }, [closeStream])

  return {
    suggestedQuestions,
    loadingSuggestions,
    drawerOpen,
    mode,
    contextTitle,
    streamingText,
    streaming,
    error,
    explainPage,
    explainField,
    explainDisabledAction,
    closeDrawer,
    openDrawer: () => setDrawerOpen(true),
  }
}
