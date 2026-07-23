'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  FunctionalCatalogBulkAddModal,
  type FunctionalCatalogAddKind,
  type FunctionalCatalogBulkCreateInput,
} from './FunctionalCatalogBulkAddModal'
import { FunctionalCatalogSingleAddModal } from './FunctionalCatalogSingleAddModal'

type AddMode = 'single' | 'bulk'

interface FunctionalCatalogAddBarProps {
  /** Prefer opening a specific kind (e.g. current tab). */
  defaultKind?: FunctionalCatalogAddKind
  /** Create one item without list refresh (batch/single complete handler refreshes). */
  onCreate: (input: FunctionalCatalogBulkCreateInput) => Promise<void>
  onBatchComplete?: (kind: FunctionalCatalogAddKind) => Promise<void> | void
}

export function FunctionalCatalogAddBar({
  defaultKind = 'FR',
  onCreate,
  onBatchComplete,
}: FunctionalCatalogAddBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<{ kind: FunctionalCatalogAddKind; mode: AddMode } | null>(
    null
  )
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

  const kindLabel = defaultKind === 'FR' ? 'FR' : 'NFR'

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        Add {kindLabel}
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
              setModal({ kind: defaultKind, mode: 'single' })
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
              setModal({ kind: defaultKind, mode: 'bulk' })
            }}
          >
            Bulk add
          </button>
        </div>
      ) : null}

      {modal?.mode === 'single' ? (
        <FunctionalCatalogSingleAddModal
          open
          kind={modal.kind}
          onClose={() => setModal(null)}
          onCreate={async (input) => {
            await onCreate(input)
            await onBatchComplete?.(modal.kind)
          }}
        />
      ) : null}

      {modal?.mode === 'bulk' ? (
        <FunctionalCatalogBulkAddModal
          open
          kind={modal.kind}
          onClose={() => setModal(null)}
          onCreate={onCreate}
          onBatchComplete={async () => {
            await onBatchComplete?.(modal.kind)
          }}
        />
      ) : null}
    </div>
  )
}
