'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import type { FlowMentionAttrs, UseCaseMentionOption } from '../model/flow-mention'
import { FlowMentionEntityType } from '../model/flow-mention'

const TYPE_TABS: Array<{ value: string; label: string }> = [
  { value: 'SCREEN,COMPONENT,API,ENTITY', label: 'All' },
  { value: 'SCREEN', label: 'Screens' },
  { value: 'COMPONENT', label: 'Components' },
  { value: 'API', label: 'APIs' },
  { value: 'ENTITY', label: 'Entities' },
]

interface Props {
  open: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  screenContextId: string | null
  /** Prefill search from text typed after `@`. */
  initialQuery?: string
  listMentionOptions: (params: {
    query?: string
    types?: string
    screenId?: string
    mode?: 'browse' | 'search'
    limit?: number
  }) => Promise<UseCaseMentionOption[]>
  onSelect: (attrs: FlowMentionAttrs) => void
  onClose: () => void
}

export function FlowMentionPicker({
  open,
  anchorRef,
  screenContextId,
  initialQuery = '',
  listMentionOptions,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [types, setTypes] = useState(TYPE_TABS[0].value)
  const [items, setItems] = useState<UseCaseMentionOption[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestId = useRef(0)

  const load = useCallback(
    async (q: string, typeCsv: string) => {
      const id = ++requestId.current
      setLoading(true)
      try {
        const trimmed = q.trim()
        const mode = trimmed ? 'search' : 'browse'
        const res = await listMentionOptions({
          query: trimmed || undefined,
          types: typeCsv,
          screenId:
            typeCsv === 'COMPONENT' || typeCsv.includes('COMPONENT')
              ? screenContextId ?? undefined
              : undefined,
          mode,
          limit: 30,
        })
        if (id !== requestId.current) return
        if (typeCsv === 'COMPONENT' && !screenContextId) {
          setItems([])
        } else {
          setItems(res)
        }
        setActiveIndex(0)
      } catch {
        if (id !== requestId.current) return
        setItems([])
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [listMentionOptions, screenContextId]
  )

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const update = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const width = Math.min(Math.max(rect.width, 280), 420)
      let left = rect.left
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      let top = rect.bottom + 6
      const panelH = panelRef.current?.offsetHeight ?? 280
      if (top + panelH > window.innerHeight - 8) {
        top = Math.max(8, rect.top - panelH - 6)
      }
      setPos({ top, left, width })
    }
    update()
    const raf = window.requestAnimationFrame(update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    setQuery(initialQuery)
    setTypes(TYPE_TABS[0].value)
    void load(initialQuery, TYPE_TABS[0].value)
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open, initialQuery, load])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void load(query, types)
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, types, open, load])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', onDoc)
      document.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, anchorRef])

  if (!open || typeof document === 'undefined') return null

  const pick = (opt: UseCaseMentionOption) => {
    onSelect({
      entityType: opt.entityType,
      entityId: opt.entityId,
      label: opt.label,
      screenId: opt.screenId ?? null,
    })
    onClose()
  }

  return createPortal(
    <div
      ref={panelRef}
      role="listbox"
      style={{
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: pos?.width ?? 320,
        visibility: pos ? 'visible' : 'hidden',
      }}
      className="fixed z-[300] border border-neutral-200 bg-white shadow-lg"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="border-b border-neutral-100 p-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onClose()
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && items[activeIndex]) {
              e.preventDefault()
              pick(items[activeIndex])
            }
          }}
          placeholder="Search in Function scope…"
          className="w-full border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTypes(tab.value)}
              className={cn(
                'px-2 py-0.5 text-xs',
                types === tab.value
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {types === 'COMPONENT' && !screenContextId ? (
          <p className="px-3 py-4 text-xs text-neutral-500">
            Select a Screen Context first to mention Components.
          </p>
        ) : loading ? (
          <p className="px-3 py-4 text-xs text-neutral-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-4 text-xs text-neutral-400">No matches in Function scope.</p>
        ) : (
          items.map((opt, idx) => (
            <button
              key={`${opt.entityType}:${opt.entityId}`}
              type="button"
              role="option"
              aria-selected={idx === activeIndex}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => pick(opt)}
              className={cn(
                'flex w-full items-start gap-2 px-3 py-2 text-left text-sm',
                idx === activeIndex ? 'bg-neutral-100' : 'hover:bg-neutral-50'
              )}
            >
              <span className="shrink-0 font-mono text-[10px] uppercase text-neutral-400">
                {opt.entityType === FlowMentionEntityType.Component
                  ? 'CMP'
                  : opt.entityType.slice(0, 3)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-neutral-900">{opt.label}</span>
                {opt.parentLabel ? (
                  <span className="block truncate text-xs text-neutral-500">{opt.parentLabel}</span>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  )
}
