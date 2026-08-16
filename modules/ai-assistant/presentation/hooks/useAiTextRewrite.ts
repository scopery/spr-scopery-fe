'use client'

import { useCallback, useRef, useState } from 'react'
import { buildAiAssistantHeaders } from '@/shared/lib/aiAssistantHeaders'
import {
  extractSseTextDelta,
  isSseCompletedEvent,
  isSseFailedEvent,
  isSseTokenEvent,
  openSseStream,
  resolveSseUrl,
} from '@/shared/lib/sseClient'
import * as aiApi from '../../infrastructure/api/ai-assistant.api'

export type AiTextRewritePhase = 'input' | 'loading' | 'review' | 'error'

/** Prompt context — keeps rewrite tone aligned with the surface being edited. */
export type AiTextRewriteDocumentKind =
  | 'meeting_notes'
  | 'requirement'
  | 'functional_item'
  | 'document'

function documentKindLabel(kind: AiTextRewriteDocumentKind): string {
  switch (kind) {
    case 'requirement':
      return 'a software requirement description'
    case 'functional_item':
      return 'a functional item (function) description'
    case 'document':
      return 'a document'
    case 'meeting_notes':
    default:
      return 'meeting notes'
  }
}

/**
 * Shared select → instruct → stream → review rewrite flow
 * (same pattern as document floating toolbar AI Edit).
 */
export function useAiTextRewrite(
  workspaceId?: string,
  documentKind: AiTextRewriteDocumentKind = 'meeting_notes'
) {
  const [phase, setPhase] = useState<AiTextRewritePhase | null>(null)
  const [instruction, setInstruction] = useState('')
  const [streamingPreview, setStreamingPreview] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedTextRef = useRef('')
  const cancelStreamRef = useRef<(() => void) | null>(null)
  const kindRef = useRef(documentKind)
  kindRef.current = documentKind

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
        `You are a writing assistant editing ${documentKindLabel(kindRef.current)}. ` +
        `The user selected this text:\n\n` +
        `<selected_text>\n${selectedText}\n</selected_text>\n\n` +
        `Instruction: ${instr}\n\n` +
        `Rewrite the selected text following the instruction. ` +
        `Return ONLY the rewritten text — no explanations, no prefixes, no surrounding quotes.`

      const result = await aiApi.createMessage(conv.id, { content: prompt })
      const rawStreamUrl = aiApi.resolveMessageStreamUrl(result)

      if (!rawStreamUrl) throw new Error('No stream URL')

      let accumulated = ''

      const { cancel } = openSseStream({
        url: resolveSseUrl(rawStreamUrl),
        headers: buildAiAssistantHeaders(),
        onEvent: (ev) => {
          if (isSseTokenEvent(ev.event)) {
            accumulated += extractSseTextDelta(ev.data)
            setStreamingPreview(accumulated)
          }

          if (isSseCompletedEvent(ev.event)) {
            setSuggestion(accumulated)
            setPhase('review')
          }

          if (isSseFailedEvent(ev.event)) {
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
