'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnchoredMenu, Button, anchoredMenuItemClassName } from '@/shared/ui'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'
import { cn } from '@/utils/cn'
import {
  FunctionalCatalogBulkAddModal,
  type FunctionalCatalogAddKind,
  type FunctionalCatalogBulkCreateInput,
} from './FunctionalCatalogBulkAddModal'
import { FunctionalCatalogSingleAddModal } from './FunctionalCatalogSingleAddModal'
import { FunctionalCatalogJsonImportModal } from './FunctionalCatalogJsonImportModal'

type AddMode = 'single' | 'bulk' | 'json'

interface FunctionalCatalogAddBarProps {
  /** Prefer opening a specific kind (e.g. current tab). */
  defaultKind?: FunctionalCatalogAddKind
  /** Create one item without list refresh (batch/single complete handler refreshes). */
  onCreate: (input: FunctionalCatalogBulkCreateInput) => Promise<void>
  onSubmitBulk: (items: FunctionalCatalogBulkCreateInput[]) => Promise<BulkJobResponse>
  onBatchComplete?: (kind: FunctionalCatalogAddKind) => Promise<void> | void
}

export function FunctionalCatalogAddBar({
  defaultKind = 'FR',
  onCreate,
  onSubmitBulk,
  onBatchComplete,
}: FunctionalCatalogAddBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<{ kind: FunctionalCatalogAddKind; mode: AddMode } | null>(
    null
  )
  const anchorRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const kindLabel = defaultKind === 'FR' ? 'FR' : 'NFR'

  const pick = (mode: AddMode) => {
    setMenuOpen(false)
    setModal({ kind: defaultKind, mode })
  }

  return (
    <div ref={anchorRef} className="relative flex justify-end">
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

      <AnchoredMenu open={menuOpen} onClose={closeMenu} anchorRef={anchorRef}>
        <button type="button" role="menuitem" className={anchoredMenuItemClassName} onClick={() => pick('single')}>
          Single add
        </button>
        <button type="button" role="menuitem" className={anchoredMenuItemClassName} onClick={() => pick('bulk')}>
          Bulk add
        </button>
        <button type="button" role="menuitem" className={anchoredMenuItemClassName} onClick={() => pick('json')}>
          JSON import
        </button>
      </AnchoredMenu>

      <FunctionalCatalogSingleAddModal
        open={modal?.mode === 'single'}
        kind={modal?.kind ?? defaultKind}
        onClose={() => setModal(null)}
        onCreate={async (input) => {
          const kind = modal?.kind ?? defaultKind
          await onCreate(input)
          await onBatchComplete?.(kind)
        }}
      />

      {/* Always mounted so background poll + result modal survive onClose. */}
      <FunctionalCatalogBulkAddModal
        open={modal?.mode === 'bulk'}
        kind={modal?.kind ?? defaultKind}
        onClose={() => setModal(null)}
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={async () => {
          await onBatchComplete?.(modal?.kind ?? defaultKind)
        }}
      />

      <FunctionalCatalogJsonImportModal
        open={modal?.mode === 'json'}
        kind={modal?.kind ?? defaultKind}
        onClose={() => setModal(null)}
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={async () => {
          await onBatchComplete?.(modal?.kind ?? defaultKind)
        }}
      />
    </div>
  )
}
