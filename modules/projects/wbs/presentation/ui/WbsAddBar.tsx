'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnchoredMenu, Button, anchoredMenuItemClassName } from '@/shared/ui'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'
import { cn } from '@/utils/cn'
import type { CreateWbsNodePayload } from '../../domain/model/wbs'
import { CreateWbsNodeModal } from './CreateWbsNodeModal'
import { WbsBulkAddModal } from './WbsBulkAddModal'
import { WbsJsonImportModal } from './WbsJsonImportModal'

type AddMode = 'single' | 'bulk' | 'json'

interface PhaseOption {
  value: string
  label: string
}

interface Props {
  phaseOptions: PhaseOption[]
  defaultPhaseId?: string | null
  parentId?: string | null
  parentTitle?: string | null
  onCreate: (body: CreateWbsNodePayload) => Promise<unknown>
  onSubmitBulk: (items: CreateWbsNodePayload[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
  className?: string
  disabled?: boolean
}

export function WbsAddBar({
  phaseOptions,
  defaultPhaseId,
  parentId,
  parentTitle,
  onCreate,
  onSubmitBulk,
  onBatchComplete,
  className,
  disabled,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<AddMode | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const pick = (next: AddMode) => {
    setMenuOpen(false)
    setMode(next)
  }

  return (
    <div ref={anchorRef} className={cn('relative', className)}>
      <Button
        size="sm"
        variant="primary"
        disabled={disabled || phaseOptions.length === 0}
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        Add element
        <ChevronDown
          size={14}
          className={cn('ml-1.5 inline transition-transform', menuOpen && 'rotate-180')}
        />
      </Button>

      <AnchoredMenu open={menuOpen} onClose={closeMenu} anchorRef={anchorRef}>
        <button
          type="button"
          role="menuitem"
          className={anchoredMenuItemClassName}
          onClick={() => pick('single')}
        >
          Single add
        </button>
        <button
          type="button"
          role="menuitem"
          className={anchoredMenuItemClassName}
          onClick={() => pick('bulk')}
        >
          Bulk add
        </button>
        <button
          type="button"
          role="menuitem"
          className={anchoredMenuItemClassName}
          onClick={() => pick('json')}
        >
          JSON import
        </button>
      </AnchoredMenu>

      <CreateWbsNodeModal
        open={mode === 'single'}
        onClose={() => setMode(null)}
        phaseOptions={phaseOptions}
        defaultPhaseId={defaultPhaseId}
        parentId={parentId}
        parentTitle={parentTitle}
        onSubmit={async (body) => {
          await onCreate(body)
        }}
      />

      <WbsBulkAddModal
        open={mode === 'bulk'}
        phaseOptions={phaseOptions}
        defaultPhaseId={defaultPhaseId}
        onClose={() => setMode(null)}
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={onBatchComplete}
      />

      <WbsJsonImportModal
        open={mode === 'json'}
        phaseOptions={phaseOptions}
        onClose={() => setMode(null)}
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={onBatchComplete}
      />
    </div>
  )
}
