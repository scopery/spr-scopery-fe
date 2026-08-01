'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  FlowMentionEntityType,
  parseFlowContent,
  type FlowMentionAttrs,
  type FlowMentionDoc,
} from '../model/flow-mention'

function typeMeta(entityType: string): {
  label: string
  tone: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'default'
} {
  switch (entityType) {
    case FlowMentionEntityType.Screen:
      return { label: 'Screen', tone: 'primary' }
    case FlowMentionEntityType.Component:
      return { label: 'Component', tone: 'info' }
    case FlowMentionEntityType.Api:
      return { label: 'API', tone: 'secondary' }
    case FlowMentionEntityType.Entity:
      return { label: 'Entity', tone: 'success' }
    case FlowMentionEntityType.Communication:
      return { label: 'Comm', tone: 'warning' }
    default:
      return { label: entityType || 'Object', tone: 'default' }
  }
}

function MentionChip({ attrs }: { attrs: FlowMentionAttrs }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const meta = typeMeta(attrs.entityType)

  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const update = () => {
      const el = btnRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const width = 220
      let left = rect.left
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      let top = rect.bottom + 4
      if (top + 120 > window.innerHeight - 8) {
        top = Math.max(8, rect.top - 120)
      }
      setPos({ top, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const id = window.setTimeout(() => document.addEventListener('mousedown', onDoc), 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'mx-0.5 inline max-w-full align-baseline text-sm text-neutral-800',
          'underline underline-offset-2 hover:text-neutral-950',
          attrs.outOfScope && 'text-amber-900 decoration-amber-500'
        )}
      >
        <span className="truncate">{attrs.label}</span>
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={`${meta.label} details`}
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                visibility: pos ? 'visible' : 'hidden',
              }}
              className="fixed z-[300] w-[220px] border border-neutral-200 bg-white p-3 shadow-md"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge size="sm" variant="solid" tone={meta.tone} className="border-0">
                  {meta.label}
                </Badge>
                {attrs.outOfScope ? (
                  <Badge size="sm" variant="solid" tone="warning" className="border-0">
                    Out of scope
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-neutral-900">{attrs.label}</p>
            </div>,
            document.body
          )
        : null}
    </>
  )
}

interface Props {
  contentJson: string | null | undefined
  className?: string
}

export function FlowMentionReadonly({ contentJson, className }: Props) {
  const doc: FlowMentionDoc = parseFlowContent(contentJson)
  if (doc.content.length === 0) return null

  return (
    <p className={cn('mt-0.5 text-sm leading-6 text-neutral-700', className)}>
      {doc.content.map((node, idx) =>
        node.type === 'text' ? (
          <span key={`t-${idx}`} className="whitespace-pre-wrap">
            {node.text}
          </span>
        ) : (
          <MentionChip key={`m-${idx}`} attrs={node.attrs} />
        )
      )}
    </p>
  )
}
