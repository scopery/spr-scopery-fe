'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { KEYS } from 'platejs'
import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react'
import { getDOMSelectionBoundingClientRect, offset, useVirtualFloating } from '@platejs/floating'
import { useEditorRef, useEditorSelector } from 'platejs/react'
import { useParams } from 'next/navigation'
import type { BaseRange } from 'slate'
import { Bold, Check, Code2, Italic, Link2, Loader2, Sparkles, Underline, X } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { TextHighlightToolbarControl } from './TextHighlightPlugin'
import { openSseStream, SseEventType } from '@/shared/lib/sseClient'
import { buildAiAssistantHeaders } from '@/shared/lib/aiAssistantHeaders'
import * as aiApi from '@/modules/ai-assistant/infrastructure/api/ai-assistant.api'
import { AI_ASSISTANT_ENDPOINTS } from '@/modules/ai-assistant/infrastructure/api/endpoints'

// ─── Formatting buttons ───────────────────────────────────────────────────────

function MarkButton({
  label,
  mark,
  icon,
}: {
  label: string
  mark: string
  icon: React.ReactNode
}) {
  const editor = useEditorRef()
  const pressed = useEditorSelector((ed) => !!ed.selection && ed.api.hasMark(mark), [mark])

  return (
    <Button
      size="sm"
      variant={pressed ? 'secondary' : 'ghost'}
      iconOnly
      icon={icon}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
      onClick={() => editor.tf.toggleMark(mark)}
    />
  )
}

// ─── AI edit helpers ──────────────────────────────────────────────────────────

type AiPhase = 'input' | 'loading' | 'review' | 'error'
type FloatingRect = ReturnType<typeof getDOMSelectionBoundingClientRect>

function resolveStreamUrl(url: string): string {
  if (url.startsWith('http')) return url
  const base =
    typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SSE_BASE_URL ?? '') : ''
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EditorFloatingToolbar() {
  const editor = useEditorRef()

  const selectionExpanded = useEditorSelector((ed) => !!ed.selection && !ed.api.isCollapsed(), [])

  const linkState = useLinkToolbarButtonState()
  const linkBtn = useLinkToolbarButton(linkState)

  const params = useParams()
  const workspaceId =
    typeof params?.workspaceId === 'string' ? params.workspaceId : undefined

  // ── AI edit state ─────────────────────────────────────────────────────────
  const [aiPhase, setAiPhase] = useState<AiPhase | null>(null)
  const [instruction, setInstruction] = useState('')
  const [streamingPreview, setStreamingPreview] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)

  const savedSelectionRef = useRef<BaseRange | null>(null)
  const savedTextRef = useRef('')
  const cancelStreamRef = useRef<(() => void) | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Floating position ─────────────────────────────────────────────────────
  // Lock the bounding rect once open so focusing the AI input doesn't cause
  // the popup to jump (editor loses DOM selection → stale rect).
  const savedRectRef = useRef<FloatingRect | null>(null)

  const getBoundingClientRect = useCallback(() => {
    if (savedRectRef.current) return savedRectRef.current
    return getDOMSelectionBoundingClientRect()
  }, [])

  // Show toolbar when text is selected (regardless of focused state — the
  // selectionExpanded selector already scopes to this editor's internal state).
  // strategy: 'fixed' is required because parent containers have overflow:hidden,
  // which would clip an absolutely-positioned toolbar.
  const isOpen = selectionExpanded || aiPhase !== null

  const floating = useVirtualFloating({
    open: isOpen,
    getBoundingClientRect,
    placement: 'top',
    middleware: [offset(8)],
    strategy: 'fixed',
  })

  useEffect(() => {
    if (isOpen) floating.update()
  }, [isOpen, floating])

  // Save rect when selection expands so we can lock it after input is focused
  useEffect(() => {
    if (selectionExpanded && aiPhase === null) {
      savedRectRef.current = getDOMSelectionBoundingClientRect()
    }
    if (!isOpen) {
      savedRectRef.current = null
    }
  }, [selectionExpanded, aiPhase, isOpen])

  // Auto-focus input when AI mode opens
  useEffect(() => {
    if (aiPhase === 'input') {
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [aiPhase])

  // ── AI edit actions ───────────────────────────────────────────────────────

  const openAiEdit = useCallback(() => {
    const sel = editor.selection as BaseRange | null
    if (!sel) return
    const text = editor.api.string(sel) ?? ''
    if (!text.trim()) return
    savedSelectionRef.current = sel
    savedTextRef.current = text
    // Lock position now before editor loses focus to the input
    savedRectRef.current = getDOMSelectionBoundingClientRect()
    setAiPhase('input')
    setInstruction('')
    setSuggestion('')
    setStreamingPreview('')
    setAiError(null)
  }, [editor])

  const closeAi = useCallback(() => {
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    savedRectRef.current = null
    setAiPhase(null)
    setInstruction('')
    setSuggestion('')
    setStreamingPreview('')
    setAiError(null)
  }, [])

  const submitAi = useCallback(async () => {
    const selectedText = savedTextRef.current
    const instr = instruction.trim()
    if (!selectedText || !instr) return

    setAiPhase('loading')
    setStreamingPreview('')
    setSuggestion('')
    setAiError(null)

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
              const parsed = JSON.parse(ev.data) as { token?: string; delta?: string; text?: string }
              token = parsed.token ?? parsed.delta ?? parsed.text ?? ev.data
            } catch { /* raw text */ }
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
            setAiPhase('review')
          }

          const isErr =
            ev.event === SseEventType.Error ||
            ev.event === SseEventType.MessageError ||
            ev.event === 'answer.failed'

          if (isErr) {
            setAiError('AI could not generate a suggestion.')
            setAiPhase('error')
          }
        },
        onDone: () => {
          setSuggestion(accumulated)
          setAiPhase((prev) => (prev === 'loading' ? 'review' : prev))
        },
        onError: () => {
          setAiError('Connection error. Please try again.')
          setAiPhase('error')
        },
      })
      cancelStreamRef.current = cancel
    } catch {
      setAiError('Failed to contact AI. Please try again.')
      setAiPhase('error')
    }
  }, [instruction, workspaceId])

  const acceptAi = useCallback(() => {
    const sel = savedSelectionRef.current
    if (!sel || !suggestion) { closeAi(); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = editor as any
    e.tf.focus()
    e.apply({ type: 'set_selection', properties: e.selection, newProperties: sel })
    editor.tf.insertText(suggestion)
    closeAi()
  }, [editor, suggestion, closeAi])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null

  return (
    <div
      ref={floating.refs.setFloating}
      style={floating.style}
      className="z-50 rounded-none border border-neutral-200 bg-white shadow-md"
      onMouseDown={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label="Text formatting"
    >
      {/* ── Formatting mode ─────────────────────────────────────────────── */}
      {aiPhase === null && (
        <div className="flex items-center gap-0.5 p-1">
          <MarkButton label="Bold" mark={KEYS.bold} icon={<Bold size={15} />} />
          <MarkButton label="Italic" mark={KEYS.italic} icon={<Italic size={15} />} />
          <MarkButton label="Underline" mark={KEYS.underline} icon={<Underline size={15} />} />
          <MarkButton label="Code" mark={KEYS.code} icon={<Code2 size={15} />} />
          <TextHighlightToolbarControl />
          <Button
            size="sm"
            variant={linkBtn.props.pressed ? 'secondary' : 'ghost'}
            iconOnly
            icon={<Link2 size={15} />}
            aria-label="Link"
            title="Link"
            aria-pressed={linkBtn.props.pressed}
            onMouseDown={linkBtn.props.onMouseDown}
            onClick={linkBtn.props.onClick}
          />

          {/* Divider */}
          <span className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />

          {/* AI Edit trigger */}
          <button
            type="button"
            aria-label="AI Edit"
            title="AI Edit"
            onMouseDown={(e) => e.preventDefault()}
            onClick={openAiEdit}
            className="inline-flex items-center gap-1 rounded-none bg-blue-400 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
          >
            <Sparkles size={13} />
            AI
          </button>
        </div>
      )}

      {/* ── AI input mode ───────────────────────────────────────────────── */}
      {aiPhase === 'input' && (
        <div className="w-72 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <Sparkles size={14} /> AI Edit
            </span>
            <button
              onClick={closeAi}
              className="rounded-none p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X size={13} />
            </button>
          </div>
          <input
            ref={inputRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitAi() }
              if (e.key === 'Escape') closeAi()
            }}
            placeholder="Tell AI what to change…"
            className="w-full rounded-none border border-neutral-200 px-2.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
          />
          <button
            onClick={() => void submitAi()}
            disabled={!instruction.trim()}
            className={cn(
              'mt-2 w-full rounded-none px-3 py-2 text-sm font-medium text-white transition-colors',
              instruction.trim() ? 'bg-blue-400 hover:bg-blue-500' : 'cursor-not-allowed bg-blue-400/40'
            )}
          >
            Generate
          </button>
        </div>
      )}

      {/* ── AI loading mode ─────────────────────────────────────────────── */}
      {aiPhase === 'loading' && (
        <div className="w-72 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Loader2 size={12} className="animate-spin text-blue-400" />
              Generating…
            </span>
            <button onClick={closeAi} className="text-neutral-400 hover:text-neutral-600">
              <X size={13} />
            </button>
          </div>
          {streamingPreview && (
            <div className="rounded-none bg-blue-400/10 px-2.5 py-2 text-xs leading-relaxed text-neutral-700">
              {streamingPreview}
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-blue-400" />
            </div>
          )}
        </div>
      )}

      {/* ── AI review mode ──────────────────────────────────────────────── */}
      {aiPhase === 'review' && (
        <div className="w-80 space-y-3 p-3">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <Sparkles size={14} /> AI Suggestion
            </span>
            <button
              onClick={closeAi}
              className="rounded-none p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X size={13} />
            </button>
          </div>

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

          {/* Accept / Deny */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={closeAi}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-none border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <X size={14} /> Deny
            </button>
            <button
              onClick={acceptAi}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-none bg-blue-400 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Check size={14} /> Accept
            </button>
          </div>
        </div>
      )}

      {/* ── AI error mode ───────────────────────────────────────────────── */}
      {aiPhase === 'error' && (
        <div className="w-72 p-3">
          <p className="mb-2 text-xs text-red-600">{aiError}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setAiPhase('input')}
              className="text-xs text-blue-400 hover:underline"
            >
              Try again
            </button>
            <button onClick={closeAi} className="text-xs text-neutral-500 hover:underline">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
