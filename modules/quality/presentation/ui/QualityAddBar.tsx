'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { AnchoredMenu, Button, anchoredMenuItemClassName } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { QualityBulkAddModal } from './QualityBulkAddModal'
import { QualitySingleAddModal } from './QualitySingleAddModal'
import { TraceLinkBulkAddModal } from './TraceLinkBulkAddModal'
import { TestCaseJsonImportModal } from './TestCaseJsonImportModal'
import {
  QUALITY_ADD_LABELS,
  type QualityBulkKind,
  type QualityCreateInput,
} from './quality-bulk.model'

type AddMode = 'single' | 'bulk' | 'json'

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
  const anchorRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const buttonLabel = label ?? QUALITY_ADD_LABELS[kind]
  const showJson = kind === 'TEST_CASE'

  const pick = (next: AddMode) => {
    setMenuOpen(false)
    setModal(next)
  }

  return (
    <div ref={anchorRef} className="relative inline-flex">
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

      <AnchoredMenu open={menuOpen} onClose={closeMenu} anchorRef={anchorRef}>
        <button type="button" role="menuitem" className={anchoredMenuItemClassName} onClick={() => pick('single')}>
          Single add
        </button>
        <button type="button" role="menuitem" className={anchoredMenuItemClassName} onClick={() => pick('bulk')}>
          Bulk add
        </button>
        {showJson ? (
          <button type="button" role="menuitem" className={anchoredMenuItemClassName} onClick={() => pick('json')}>
            JSON import
          </button>
        ) : null}
      </AnchoredMenu>

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

      {showJson ? (
        <TestCaseJsonImportModal
          open={modal === 'json'}
          onClose={() => setModal(null)}
          onComplete={onBatchComplete}
        />
      ) : null}
    </div>
  )
}
