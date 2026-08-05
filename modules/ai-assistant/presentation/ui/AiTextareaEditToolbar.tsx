'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  useAiTextRewrite,
  type AiTextRewriteDocumentKind,
} from '../hooks/useAiTextRewrite'

interface AiTextareaEditToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  workspaceId?: string
  documentKind?: AiTextRewriteDocumentKind
  onApply: (nextValue: string, selection: { start: number; end: number }) => void
  disabled?: boolean
}

type ToolbarPos = { top: number; left: number }

/**
 * Floating AI Edit for any textarea — select text → instruct → review → accept.
 * Same UX as meeting notes / document AI Edit.
 */
export function AiTextareaEditToolbar({
  textareaRef,
  value,
  workspaceId,
  documentKind = 'meeting_notes',
  onApply,
  disabled = false,
}: AiTextareaEditToolbarProps) {
  const rewrite = useAiTextRewrite(workspaceId, documentKind)
  const [pos, setPos] = useState<ToolbarPos | null>(null)
  const [hasSelection, setHasSelection] = useState(false)
  const rangeRef = useRef<{ start: number; end: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lockedPosRef = useRef<ToolbarPos | null>(null)

  const updateSelection = useCallback(() => {
    if (disabled) return
    const ta = textareaRef.current
    if (!ta || document.activeElement !== ta) {
      if (rewrite.phase === null) {
        setHasSelection(false)
        setPos(null)
      }
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) {
      if (rewrite.phase === null) {
        setHasSelection(false)
        setPos(null)
        rangeRef.current = null
      }
      return
    }
    rangeRef.current = { start, end }
    setHasSelection(true)
    if (rewrite.phase === null) {
      const rect = getTextareaSelectionRect(ta, start, end)
      if (rect) {
        const next = { top: rect.top - 8, left: rect.left + rect.width / 2 }
        setPos(next)
        lockedPosRef.current = next
      }
    }
  }, [disabled, rewrite.phase, textareaRef])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta || disabled) return
    const onSelect = () => updateSelection()
    const onKeyUp = () => updateSelection()
    const onMouseUp = () => updateSelection()
    ta.addEventListener('select', onSelect)
    ta.addEventListener('keyup', onKeyUp)
    ta.addEventListener('mouseup', onMouseUp)
    return () => {
      ta.removeEventListener('select', onSelect)
      ta.removeEventListener('keyup', onKeyUp)
      ta.removeEventListener('mouseup', onMouseUp)
    }
  }, [textareaRef, updateSelection, disabled])

  useLayoutEffect(() => {
    if (rewrite.phase === 'input') {
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [rewrite.phase])

  const isOpen = !disabled && (hasSelection || rewrite.phase !== null)
  if (!isOpen || !pos) return null

  const displayPos = lockedPosRef.current ?? pos

  const openAi = () => {
    const range = rangeRef.current
    const ta = textareaRef.current
    if (!range || !ta) return
    const text = value.slice(range.start, range.end)
    if (!rewrite.open(text)) return
    if (lockedPosRef.current) setPos(lockedPosRef.current)
  }

  const closeAi = () => {
    rewrite.close()
    lockedPosRef.current = null
    setHasSelection(false)
    setPos(null)
    rangeRef.current = null
  }

  const acceptAi = () => {
    const range = rangeRef.current
    if (!range || !rewrite.suggestion) {
      closeAi()
      return
    }
    const next =
      value.slice(0, range.start) + rewrite.suggestion + value.slice(range.end)
    const end = range.start + rewrite.suggestion.length
    onApply(next, { start: range.start, end })
    closeAi()
  }

  return (
    <div
      className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-none border border-neutral-200 bg-white shadow-md"
      style={{ top: displayPos.top, left: displayPos.left }}
      onMouseDown={(e) => e.preventDefault()}
      role="toolbar"
      aria-label="AI edit"
    >
      {rewrite.phase === null ? (
        <div className="flex items-center gap-0.5 p-1">
          <button
            type="button"
            aria-label="AI Edit"
            title="AI Edit"
            onClick={openAi}
            className="inline-flex items-center gap-1 rounded-none bg-blue-400 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
          >
            <Sparkles size={13} />
            AI
          </button>
          <button
            type="button"
            aria-label="Close"
            title="Close"
            onClick={closeAi}
            className="rounded-none p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X size={13} />
          </button>
        </div>
      ) : null}

      {rewrite.phase === 'input' ? (
        <div className="w-72 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <Sparkles size={14} /> AI Edit
            </span>
            <button
              type="button"
              onClick={closeAi}
              className="rounded-none p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X size={13} />
            </button>
          </div>
          <input
            ref={inputRef}
            value={rewrite.instruction}
            onChange={(e) => rewrite.setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void rewrite.submit()
              }
              if (e.key === 'Escape') closeAi()
            }}
            placeholder="Tell AI what to change…"
            className="w-full rounded-none border border-neutral-200 px-2.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
          />
          <button
            type="button"
            onClick={() => void rewrite.submit()}
            disabled={!rewrite.instruction.trim()}
            className={cn(
              'mt-2 w-full rounded-none px-3 py-2 text-sm font-medium text-white transition-colors',
              rewrite.instruction.trim()
                ? 'bg-blue-400 hover:bg-blue-500'
                : 'cursor-not-allowed bg-blue-400/40'
            )}
          >
            Generate
          </button>
        </div>
      ) : null}

      {rewrite.phase === 'loading' ? (
        <div className="w-72 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Loader2 size={12} className="animate-spin text-blue-400" />
              Generating…
            </span>
            <button type="button" onClick={closeAi} className="text-neutral-400 hover:text-neutral-600">
              <X size={13} />
            </button>
          </div>
          {rewrite.streamingPreview ? (
            <div className="rounded-none bg-blue-400/10 px-2.5 py-2 text-xs leading-relaxed text-neutral-700">
              {rewrite.streamingPreview}
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-blue-400" />
            </div>
          ) : null}
        </div>
      ) : null}

      {rewrite.phase === 'review' ? (
        <div className="w-80 space-y-3 p-3">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <Sparkles size={14} /> AI Suggestion
            </span>
            <button
              type="button"
              onClick={closeAi}
              className="rounded-none p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X size={13} />
            </button>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-500">Original</p>
            <div className="max-h-28 overflow-auto rounded-none border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-sm leading-relaxed text-neutral-400 line-through">
              {rewrite.getSelectedText()}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-500">Suggestion</p>
            <div className="max-h-40 overflow-auto rounded-none border border-neutral-200 bg-white px-2.5 py-2 text-sm leading-relaxed text-neutral-900">
              {rewrite.suggestion}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={closeAi}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-none border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <X size={14} /> Deny
            </button>
            <button
              type="button"
              onClick={acceptAi}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-none bg-blue-400 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Check size={14} /> Accept
            </button>
          </div>
        </div>
      ) : null}

      {rewrite.phase === 'error' ? (
        <div className="w-72 p-3">
          <p className="mb-2 text-xs text-red-600">{rewrite.error}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => rewrite.setPhase('input')}
              className="text-xs text-blue-400 hover:underline"
            >
              Try again
            </button>
            <button type="button" onClick={closeAi} className="text-xs text-neutral-500 hover:underline">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function getTextareaSelectionRect(
  ta: HTMLTextAreaElement,
  start: number,
  end: number
): DOMRect | null {
  const style = window.getComputedStyle(ta)
  const mirror = document.createElement('div')
  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.top = '0'
  mirror.style.left = '-9999px'
  for (const key of Array.from(style)) {
    mirror.style.setProperty(key, style.getPropertyValue(key))
  }
  mirror.style.width = `${ta.clientWidth}px`
  mirror.style.height = 'auto'
  mirror.style.overflow = 'hidden'

  const before = document.createTextNode(ta.value.slice(0, start))
  const mark = document.createElement('span')
  mark.textContent = ta.value.slice(start, end) || '\u200b'
  mirror.appendChild(before)
  mirror.appendChild(mark)
  document.body.appendChild(mirror)

  const taRect = ta.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()
  const markRect = mark.getBoundingClientRect()
  const top = taRect.top + (markRect.top - mirrorRect.top) - ta.scrollTop
  const left = taRect.left + (markRect.left - mirrorRect.left) - ta.scrollLeft

  document.body.removeChild(mirror)

  return new DOMRect(left, top, Math.max(markRect.width, 8), markRect.height)
}
