'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { CreateRequirementPayload } from '../model/requirements'
import { CreateRequirementModal } from './CreateRequirementModal'
import { RequirementBulkAddModal } from './RequirementBulkAddModal'

type AddMode = 'single' | 'bulk'

interface RequirementAddBarProps {
  onCreate: (body: CreateRequirementPayload, opts?: { quiet?: boolean }) => Promise<unknown>
  onBatchComplete?: () => Promise<void> | void
  /** Called after a successful single create with the new id if available. */
  onCreated?: (id: string | null) => void
  className?: string
}

export function RequirementAddBar({
  onCreate,
  onBatchComplete,
  onCreated,
  className,
}: RequirementAddBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<AddMode | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        Add requirement
        <ChevronDown
          size={14}
          className={cn('ml-1.5 inline transition-transform', menuOpen && 'rotate-180')}
        />
      </Button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[180px] border border-neutral-200 bg-white py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
            onClick={() => {
              setMenuOpen(false)
              setMode('single')
            }}
          >
            Single add
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
            onClick={() => {
              setMenuOpen(false)
              setMode('bulk')
            }}
          >
            Bulk add
          </button>
        </div>
      ) : null}

      <CreateRequirementModal
        open={mode === 'single'}
        onClose={() => setMode(null)}
        onSubmit={async (body) => {
          const created = await onCreate(body)
          const id =
            created && typeof created === 'object' && 'id' in created
              ? String((created as { id: string }).id)
              : null
          onCreated?.(id)
        }}
      />

      <RequirementBulkAddModal
        open={mode === 'bulk'}
        onClose={() => setMode(null)}
        onCreate={async (body) => {
          await onCreate(body, { quiet: true })
        }}
        onBatchComplete={async () => {
          await onBatchComplete?.()
        }}
      />
    </div>
  )
}
