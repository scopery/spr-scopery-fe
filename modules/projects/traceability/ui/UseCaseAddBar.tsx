'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnchoredMenu, Button, anchoredMenuItemClassName } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'
import type { CreateUseCaseBody, BulkCreateUseCaseItem } from '../model/use-case'
import { UseCaseSingleAddModal } from './UseCaseSingleAddModal'
import { UseCaseBulkAddModal } from './UseCaseBulkAddModal'
import { UseCaseJsonImportModal } from './UseCaseJsonImportModal'

type AddMode = 'single' | 'bulk' | 'json'

interface Props {
  projectId: string
  onCreate: (body: CreateUseCaseBody) => Promise<unknown>
  onSubmitBulk: (items: BulkCreateUseCaseItem[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function UseCaseAddBar({ projectId, onCreate, onSubmitBulk, onBatchComplete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<AddMode | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const pick = (next: AddMode) => {
    setMenuOpen(false)
    setMode(next)
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
        Add Use Case
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

      <UseCaseSingleAddModal
        open={mode === 'single'}
        onClose={() => setMode(null)}
        onCreate={async (body) => {
          await onCreate(body)
          await onBatchComplete?.()
        }}
      />

      <UseCaseBulkAddModal
        open={mode === 'bulk'}
        onClose={() => setMode(null)}
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={onBatchComplete}
      />

      <UseCaseJsonImportModal
        open={mode === 'json'}
        projectId={projectId}
        onClose={() => setMode(null)}
        onSubmitBulk={onSubmitBulk}
        onBatchComplete={onBatchComplete}
      />
    </div>
  )
}
