'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getDOMSelectionBoundingClientRect, offset, useVirtualFloating } from '@platejs/floating'
import { useEditorRef, useEditorSelector, useFocused, useReadOnly } from 'platejs/react'
import { useParams } from 'next/navigation'
import type { BaseRange } from 'slate'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  extractSseTextDelta,
  isSseCompletedEvent,
  isSseFailedEvent,
  isSseTokenEvent,
  openSseStream,
  resolveSseUrl,
} from '@/shared/lib/sseClient'
import { buildAiAssistantHeaders } from '@/shared/lib/aiAssistantHeaders'
import * as aiApi from '@/modules/ai-assistant/infrastructure/api/ai-assistant.api'

type Phase = 'input' | 'loading' | 'review' | 'error'

export function EditorAiEditPopup() {
  const editor = useEditorRef()
  const focused = useFocused()
  const readOnly = useReadOnly()
  const selectionExpanded = useEditorSelector(
    (ed) => !!ed.selection && !ed.api.isCollapsed(),
    []
  )

  const params = useParams()
  const workspaceId =
    typeof params?.workspaceId === 'string' ? params.workspaceId : undefined

  const [phase, setPhase] = useState<Phase | null>(null)
  const [instruction, setInstruction] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [streamingPreview, setStreamingPreview] = useState('')
  const [error, setError] = useState<string | null>(null)

  const savedSelectionRef = useRef<BaseRange | null>(null)
  const savedTextRef = useRef('')
  const cancelStreamRef = useRef<(() => void) | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const getBoundingClientRect = useCallback(
    () => getDOMSelectionBoundingClientRect(),
    []
  )

  const floating = useVirtualFloating({
    open: phase !== null,
    getBoundingClientRect,
    placement: 'bottom',
    middleware: [offset(8)],
  })

  // Auto-open when selection expands — only if popup is not already open
  useEffect(() => {
    if (readOnly) return
    if (selectionExpanded && focused && phase === null) {
      const sel = editor.selection as BaseRange | null
      if (!sel) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (editor as any).string(sel) as string
      if (!text.trim()) return
      savedSelectionRef.current = sel
      savedTextRef.current = text
      setPhase('input')
      setInstruction('')
      setSuggestion('')
      setStreamingPreview('')
      setError(null)
    }
  }, [selectionExpanded, focused, readOnly, editor, phase])

  useEffect(() => {
    if (phase !== null) floating.update()
  }, [phase, floating])

  // Focus input when popup opens
  useEffect(() => {
    if (phase === 'input') {
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [phase])

  const close = useCallback(() => {
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    setPhase(null)
    setInstruction('')
    setSuggestion('')
    setStreamingPreview('')
    setError(null)
  }, [])

  const submit = useCallback(async () => {
    const selectedText = savedTextRef.current
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
        `You are a writing assistant editing a document. ` +
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
        initialLastEventId: '0',
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
            setError('AI could not generate a suggestion. Please try again.')
            setPhase('error')
          }
        },
        onDone: () => {
          if (accumulated.trim()) {
            setSuggestion(accumulated)
            setPhase((prev) => (prev === 'loading' || prev === 'error' ? 'review' : prev))
            return
          }
          setError('Connection error. Please try again.')
          setPhase((prev) => (prev === 'review' ? prev : 'error'))
        },
      })

      cancelStreamRef.current = cancel
    } catch {
      setError('Failed to contact AI. Please try again.')
      setPhase('error')
    }
  }, [instruction, workspaceId])

  const accept = useCallback(() => {
    const sel = savedSelectionRef.current
    if (!sel || !suggestion) {
      close()
      return
    }
    // PlateJS editor is a Slate editor at runtime; cast to any to call Slate-level APIs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = editor as any
    e.tf.focus()
    e.apply({ type: 'set_selection', properties: e.selection, newProperties: sel })
    editor.tf.insertText(suggestion)
    close()
  }, [editor, suggestion, close])

  const deny = useCallback(() => {
    close()
  }, [close])

  if (phase === null) return null

  return (
    <div
      ref={floating.refs.setFloating}
      style={floating.style}
      className="z-50 w-80 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
      // Prevent mousedown from collapsing editor selection before we save it
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
          <Sparkles size={14} />
          AI Edit
        </span>
        <button
          onClick={close}
          className="rounded-none p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Close"
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Input phase ─────────────────────────────────────────── */}
      {phase === 'input' && (
        <div className="p-2">
          <input
            ref={inputRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submit()
              }
              if (e.key === 'Escape') close()
            }}
            placeholder="Tell AI what to change…"
            className="w-full rounded-none border border-neutral-200 px-2.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
          />
          <button
            onClick={() => void submit()}
            disabled={!instruction.trim()}
            className={cn(
              'mt-2 w-full rounded-none px-3 py-2 text-sm font-medium text-white transition-colors',
              instruction.trim()
                ? 'bg-blue-400 hover:bg-blue-500'
                : 'cursor-not-allowed bg-blue-400/40'
            )}
          >
            Generate
          </button>
        </div>
      )}

      {/* ── Loading phase ────────────────────────────────────────── */}
      {phase === 'loading' && (
        <div className="p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
            <Loader2 size={12} className="animate-spin text-violet-500" />
            <span>Generating suggestion…</span>
          </div>
          {streamingPreview && (
            <div className="rounded bg-violet-50 px-2.5 py-2 text-xs text-neutral-700 leading-relaxed">
              {streamingPreview}
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-violet-400" />
            </div>
          )}
        </div>
      )}

      {/* ── Review phase ─────────────────────────────────────────── */}
      {phase === 'review' && (
        <div className="space-y-3 p-3">
          {/* Original — strikethrough */}
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-500">Original</p>
            <div className="rounded-none border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-sm leading-relaxed text-neutral-400 line-through">
              {savedTextRef.current}
            </div>
          </div>

          {/* Suggestion */}
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-500">Suggestion</p>
            <div className="rounded-none border border-neutral-200 bg-white px-2.5 py-2 text-sm leading-relaxed text-neutral-900">
              {suggestion}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={deny}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-none border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <X size={14} /> Deny
            </button>
            <button
              onClick={accept}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-none bg-blue-400 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Check size={14} /> Accept
            </button>
          </div>
        </div>
      )}

      {/* ── Error phase ──────────────────────────────────────────── */}
      {phase === 'error' && (
        <div className="p-3">
          <p className="mb-2 text-xs text-red-600">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPhase('input')}
              className="text-xs text-violet-600 hover:underline"
            >
              Try again
            </button>
            <button onClick={close} className="text-xs text-neutral-500 hover:underline">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
