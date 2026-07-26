'use client'

import { useCallback, useRef, useState } from 'react'
import { buildAiAssistantHeaders } from '@/shared/lib/aiAssistantHeaders'
import { openSseStream, SseEventType } from '@/shared/lib/sseClient'
import * as aiApi from '../../infrastructure/api/ai-assistant.api'
import { AI_ASSISTANT_ENDPOINTS } from '../../infrastructure/api/endpoints'

export type AiTextRewritePhase = 'input' | 'loading' | 'review' | 'error'

function resolveStreamUrl(url: string): string {
  if (url.startsWith('http')) return url
  const base =
    typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SSE_BASE_URL ?? '') : ''
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

/**
 * Shared select → instruct → stream → review rewrite flow
 * (same pattern as document floating toolbar AI Edit).
 */
export function useAiTextRewrite(workspaceId?: string) {
  const [phase, setPhase] = useState<AiTextRewritePhase | null>(null)
  const [instruction, setInstruction] = useState('')
  const [streamingPreview, setStreamingPreview] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedTextRef = useRef('')
  const cancelStreamRef = useRef<(() => void) | null>(null)

  const close = useCallback(() => {
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    setPhase(null)
    setInstruction('')
    setSuggestion('')
    setStreamingPreview('')
    setError(null)
    selectedTextRef.current = ''
  }, [])

  const open = useCallback((selectedText: string) => {
    const text = selectedText.trim()
    if (!text) return false
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    selectedTextRef.current = selectedText
    setPhase('input')
    setInstruction('')
    setSuggestion('')
    setStreamingPreview('')
    setError(null)
    return true
  }, [])

  const submit = useCallback(async () => {
    const selectedText = selectedTextRef.current
    const instr = instruction.trim()
    if (!selectedText || !instr) return

    setPhase('loading')
    setStreamingPreview('')
    setSuggestion('')
    setError(null)

    try {
      const conv = await aiApi.createConversation({
        workspaceId,
        conversationType: 'GENERAL_GUIDE',
        capabilityLevel: 'CONTEXTUAL_ANSWER',
      })

      const prompt =
        `You are a writing assistant editing meeting notes. ` +
        `The user selected this text:\n\n` +
        `<selected_text>\n${selectedText}\n</selected_text>\n\n` +
        `Instruction: ${instr}\n\n` +
        `Rewrite the selected text following the instruction. ` +
        `Return ONLY the rewritten text — no explanations, no prefixes, no surrounding quotes.`

      const result = await aiApi.createMessage(conv.id, { content: prompt })
      const rawStreamUrl =
        result.streamUrl ??
        (result.messageId ? AI_ASSISTANT_ENDPOINTS.messageStream(result.messageId) : null)

      if (!rawStreamUrl) throw new Error('No stream URL')

      let accumulated = ''

      const { cancel } = openSseStream({
        url: resolveStreamUrl(rawStreamUrl),
        headers: buildAiAssistantHeaders(),
        onEvent: (ev) => {
          const isToken =
            ev.event === SseEventType.Token ||
            ev.event === SseEventType.MessageDelta ||
            ev.event === SseEventType.ContentDelta ||
            ev.event === 'answer.delta'

          if (isToken) {
            let token = ev.data
            try {
              const parsed = JSON.parse(ev.data) as {
                token?: string
                delta?: string
                text?: string
              }
              token = parsed.token ?? parsed.delta ?? parsed.text ?? ev.data
            } catch {
              /* raw text */
            }
            accumulated += token
            setStreamingPreview(accumulated)
          }

          const isDone =
            ev.event === SseEventType.Completed ||
            ev.event === SseEventType.MessageCompleted ||
            ev.event === SseEventType.TurnCompleted ||
            ev.event === 'answer.completed'

          if (isDone) {
            setSuggestion(accumulated)
            setPhase('review')
          }

          const isErr =
            ev.event === SseEventType.Error ||
            ev.event === SseEventType.MessageError ||
            ev.event === 'answer.failed'

          if (isErr) {
            setError('AI could not generate a suggestion.')
            setPhase('error')
          }
        },
        onDone: () => {
          setSuggestion(accumulated)
          setPhase((prev) => (prev === 'loading' ? 'review' : prev))
        },
        onError: () => {
          setError('Connection error. Please try again.')
          setPhase('error')
        },
      })
      cancelStreamRef.current = cancel
    } catch {
      setError('Failed to contact AI. Please try again.')
      setPhase('error')
    }
  }, [instruction, workspaceId])

  return {
    phase,
    instruction,
    setInstruction,
    streamingPreview,
    suggestion,
    error,
    selectedText: selectedTextRef.current,
    getSelectedText: () => selectedTextRef.current,
    open,
    close,
    submit,
    setPhase,
  }
}
