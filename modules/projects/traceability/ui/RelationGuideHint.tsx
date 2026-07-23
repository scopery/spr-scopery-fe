'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

const SUGGESTIONS = [
  {
    type: 'RELATED',
    example: 'Module → Screen',
    note: 'A module is related to screens in the same business area.',
  },
  {
    type: 'IMPLEMENTS',
    example: 'Screen → Component',
    note: 'A screen implements or composes UI components.',
  },
  {
    type: 'USES',
    example: 'Module → Entity',
    note: 'A module uses data entities in its data flow.',
  },
  {
    type: 'IMPLEMENTS',
    example: 'Module → API',
    note: 'Example: a module implements or owns API endpoints.',
  },
] as const

/** Soft convention guide — not enforced by the API. */
export function RelationGuideHint({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Relation conventions"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center text-neutral-400 transition-colors',
          'hover:text-neutral-700',
          open && 'text-neutral-700'
        )}
      >
        <CircleHelp size={16} strokeWidth={1.75} aria-hidden />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Suggested relation conventions"
          className="absolute left-0 top-full z-20 mt-2 w-[min(100vw-2rem,22rem)] border border-neutral-200 bg-white p-3 shadow-sm"
        >
          <Typography weight="medium" size="sm">
            Suggested links
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Guidance only — not required. Relations stay optional between any node types.
          </Typography>

          <ul className="mt-3 space-y-2.5">
            {SUGGESTIONS.map((s) => (
              <li key={`${s.type}-${s.example}`} className="text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="bg-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
                    {s.type}
                  </span>
                  <span className="text-neutral-900">{s.example}</span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{s.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
