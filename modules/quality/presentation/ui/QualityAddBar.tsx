'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { QualityBulkAddModal } from './QualityBulkAddModal'
import { QualitySingleAddModal } from './QualitySingleAddModal'
import { TraceLinkBulkAddModal } from './TraceLinkBulkAddModal'
import {
  QUALITY_ADD_LABELS,
  type QualityBulkKind,
  type QualityCreateInput,
} from './quality-bulk.model'

type AddMode = 'single' | 'bulk'

interface QualityAddBarProps {
  kind: QualityBulkKind
  /** Optional label override for the trigger button */
  label?: string
  onCreate: (input: QualityCreateInput) => Promise<void>
  onBatchComplete?: () => Promise<void> | void
  disabled?: boolean
}

export function QualityAddBar({
  kind,
  label,
  onCreate,
  onBatchComplete,
  disabled,
}: QualityAddBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<AddMode | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonLabel = label ?? QUALITY_ADD_LABELS[kind]

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
    <div ref={rootRef} className="relative inline-flex">
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        icon={<Plus size={14} />}
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        Add {buttonLabel}
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
              setModal('single')
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
              setModal('bulk')
            }}
          >
            Bulk add
          </button>
        </div>
      ) : null}

      {modal === 'single' ? (
        <QualitySingleAddModal
          open
          kind={kind}
          onClose={() => setModal(null)}
          onCreate={async (input) => {
            await onCreate(input)
            await onBatchComplete?.()
          }}
        />
      ) : null}

      {modal === 'bulk' && kind === 'TRACE_LINK' ? (
        <TraceLinkBulkAddModal
          open
          onClose={() => setModal(null)}
          onCreate={onCreate}
          onBatchComplete={onBatchComplete}
        />
      ) : null}

      {modal === 'bulk' && kind !== 'TRACE_LINK' ? (
        <QualityBulkAddModal
          open
          kind={kind}
          onClose={() => setModal(null)}
          onCreate={onCreate}
          onBatchComplete={onBatchComplete}
        />
      ) : null}
    </div>
  )
}
