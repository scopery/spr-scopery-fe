'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnchoredMenu, Button, anchoredMenuItemClassName } from '@/shared/ui'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'
import { cn } from '@/utils/cn'
import type { CreateRequirementPayload } from '../model/requirements'
import { CreateRequirementModal } from './CreateRequirementModal'
import { RequirementBulkAddModal } from './RequirementBulkAddModal'
import { RequirementJsonImportModal } from './RequirementJsonImportModal'

type AddMode = 'single' | 'bulk' | 'json'

interface RequirementAddBarProps {
  onCreate: (body: CreateRequirementPayload, opts?: { quiet?: boolean }) => Promise<unknown>
  onSubmitBulk: (items: CreateRequirementPayload[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
  /** Called after a successful single create with the new id if available. */
  onCreated?: (id: string | null) => void
  className?: string
}

export function RequirementAddBar({
  onCreate,
  onSubmitBulk,
  onBatchComplete,
  onCreated,
  className,
}: RequirementAddBarProps) {
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
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={async () => {
          await onBatchComplete?.()
        }}
      />

      <RequirementJsonImportModal
        open={mode === 'json'}
        onClose={() => setMode(null)}
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={onBatchComplete}
      />
    </div>
  )
}
