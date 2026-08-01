'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  appendMention,
  appendText,
  backspaceDoc,
  parseFlowContent,
  removeContentAt,
  serializeFlowContent,
  type FlowMentionAttrs,
  type FlowMentionDoc,
  type UseCaseMentionOption,
} from '../model/flow-mention'
import { FlowMentionPicker } from './FlowMentionPicker'

interface Props {
  value: string | null
  disabled?: boolean
  screenContextId: string | null
  listMentionOptions: (params: {
    query?: string
    types?: string
    screenId?: string
    mode?: 'browse' | 'search'
    limit?: number
  }) => Promise<UseCaseMentionOption[]>
  onChange: (contentJson: string) => void
  placeholder?: string
}

export function FlowMentionInput({
  value,
  disabled,
  screenContextId,
  listMentionOptions,
  onChange,
  placeholder = 'Describe this step… Type @ to mention',
}: Props) {
  const [doc, setDoc] = useState<FlowMentionDoc>(() => parseFlowContent(value))
  const [draft, setDraft] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const focusedRef = useRef(false)

  useEffect(() => {
    if (focusedRef.current) return
    setDoc(parseFlowContent(value))
    setDraft('')
  }, [value])

  const emit = (next: FlowMentionDoc, nextDraft = '') => {
    const withDraft = nextDraft ? appendText(next, nextDraft) : next
    onChange(serializeFlowContent(withDraft))
  }

  const commit = (next: FlowMentionDoc, nextDraft = '') => {
    setDoc(next)
    setDraft(nextDraft)
    emit(next, nextDraft)
  }

  const openPicker = (query = '') => {
    setMentionQuery(query)
    setPickerOpen(true)
  }

  const insertMention = (attrs: FlowMentionAttrs) => {
    // Drop trailing `@query` from draft if present
    let baseDraft = draft
    const at = baseDraft.lastIndexOf('@')
    if (at >= 0) baseDraft = baseDraft.slice(0, at)
    const base = baseDraft ? appendText(doc, baseDraft) : doc
    const next = appendMention(base, attrs)
    // Space after mention for continued typing
    commit(appendText(next, ' '), '')
    setPickerOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const onDraftChange = (next: string) => {
    const at = next.lastIndexOf('@')
    if (at >= 0) {
      const after = next.slice(at + 1)
      if (!/\s/.test(after)) {
        setDraft(next)
        // Persist only committed doc + text before `@…` query
        emit(doc, next.slice(0, at))
        openPicker(after)
        return
      }
    }
    setDraft(next)
    emit(doc, next)
    if (pickerOpen) setPickerOpen(false)
  }

  const isEmpty = doc.content.length === 0 && !draft
  const inputWidthCh = Math.max(draft.length + 1, isEmpty ? 0 : 1)

  return (
    <div className="space-y-1">
      <div
        ref={wrapRef}
        className={cn(
          'min-h-[72px] w-full border border-neutral-200 bg-white px-2 py-1.5 text-sm leading-6',
          disabled && 'bg-neutral-50 opacity-60'
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.focus()
        }}
      >
        <div className="inline">
          {doc.content.map((node, idx) =>
            node.type === 'text' ? (
              <span key={`t-${idx}`} className="whitespace-pre-wrap text-neutral-800">
                {node.text}
              </span>
            ) : (
              <span
                key={`m-${idx}`}
                className={cn(
                  'mx-0.5 inline-flex max-w-full items-center gap-0.5 align-baseline rounded-sm px-1.5 py-0 text-xs font-medium leading-5',
                  node.attrs.outOfScope
                    ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                    : 'bg-teal-50 text-teal-800'
                )}
                title={
                  node.attrs.outOfScope
                    ? 'Out of current Function scope'
                    : `${node.attrs.entityType}: ${node.attrs.entityId}`
                }
              >
                <span className="truncate">@{node.attrs.label}</span>
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={`Remove @${node.attrs.label}`}
                    className="shrink-0 text-teal-700/70 hover:text-teal-950"
                    onClick={(e) => {
                      e.stopPropagation()
                      commit(removeContentAt(doc, idx), draft)
                    }}
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </span>
            )
          )}
          <input
            ref={inputRef}
            disabled={disabled}
            value={draft}
            placeholder={isEmpty ? placeholder : undefined}
            size={Math.max(draft.length + 1, 1)}
            style={
              isEmpty
                ? { width: '100%', minWidth: '100%' }
                : { width: `${inputWidthCh}ch`, minWidth: '1ch' }
            }
            className="m-0 inline border-0 bg-transparent p-0 align-baseline text-sm leading-6 outline-none placeholder:text-neutral-400"
            onChange={(e) => onDraftChange(e.target.value)}
            onFocus={() => {
              focusedRef.current = true
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && draft.length === 0 && doc.content.length > 0) {
                e.preventDefault()
                commit(backspaceDoc(doc), '')
                return
              }
              if (e.key === 'Escape' && pickerOpen) {
                e.preventDefault()
                setPickerOpen(false)
              }
            }}
            onBlur={() => {
              focusedRef.current = false
              if (pickerOpen) return
              if (!draft) return
              commit(appendText(doc, draft), '')
            }}
          />
        </div>
      </div>

      {!disabled ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              inputRef.current?.focus()
              if (!draft.endsWith('@')) {
                onDraftChange(`${draft}@`)
              } else {
                openPicker('')
              }
            }}
            className="text-xs text-neutral-500 underline-offset-2 hover:underline"
          >
            @ Mention
          </button>
          {doc.content.length > 0 || draft ? (
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false)
                commit({ type: 'doc', content: [] }, '')
              }}
              className="text-xs text-neutral-400 hover:text-red-500"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <FlowMentionPicker
        open={pickerOpen && !disabled}
        anchorRef={wrapRef}
        screenContextId={screenContextId}
        initialQuery={mentionQuery}
        listMentionOptions={listMentionOptions}
        onSelect={insertMention}
        onClose={() => {
          setPickerOpen(false)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
      />
    </div>
  )
}
