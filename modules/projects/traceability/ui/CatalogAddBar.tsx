'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { AnchoredMenu, Button, anchoredMenuItemClassName } from '@/shared/ui'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'
import { cn } from '@/utils/cn'
import type { ScreenImportItem } from '@/modules/projects/traceability/screen-spec'
import type { ArchitectureNodeType } from '../model/architecture-workbench'
import { CatalogBulkAddModal, type CatalogAddKind, type CatalogBulkCreateInput } from './CatalogBulkAddModal'
import { CatalogSingleAddModal } from './CatalogSingleAddModal'
import { CatalogJsonImportModal } from './CatalogJsonImportModal'

type AddMode = 'single' | 'bulk' | 'json'

const KIND_OPTIONS: { value: CatalogAddKind; label: string }[] = [
  { value: 'MODULE', label: 'Module' },
  { value: 'SCREEN', label: 'Screen' },
  { value: 'API_ENDPOINT', label: 'API Endpoint' },
  { value: 'COMPONENT', label: 'Component' },
  { value: 'DATA_ENTITY', label: 'Data Entity' },
  { value: 'COMMUNICATION', label: 'Communication' },
]

const MODE_OPTIONS: { value: AddMode; label: string }[] = [
  { value: 'single', label: 'Single add' },
  { value: 'bulk', label: 'Bulk add' },
  { value: 'json', label: 'JSON import' },
]

interface CatalogCreateInput {
  kind: ArchitectureNodeType
  code: string
  name: string
  extra?: string
}

interface CatalogAddBarProps {
  /** Create one item — prefer `{ refresh: false }` in the hook; batch refreshes once. */
  onCreate: (input: CatalogCreateInput) => Promise<void>
  onSubmitBulk: (kind: CatalogAddKind, items: CatalogBulkCreateInput[]) => Promise<BulkJobResponse>
  onSubmitScreenFullSpec: (items: ScreenImportItem[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function CatalogAddBar({
  onCreate,
  onSubmitBulk,
  onSubmitScreenFullSpec,
  onBatchComplete,
}: CatalogAddBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredKind, setHoveredKind] = useState<CatalogAddKind | null>(null)
  const [modal, setModal] = useState<{ kind: CatalogAddKind; mode: AddMode } | null>(null)
  const [lastKind, setLastKind] = useState<CatalogAddKind>('MODULE')
  const anchorRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setHoveredKind(null)
  }, [])

  const openMenu = () => {
    setHoveredKind(null)
    setMenuOpen((v) => !v)
  }

  const pickMode = (kind: CatalogAddKind, mode: AddMode) => {
    setMenuOpen(false)
    setHoveredKind(null)
    setLastKind(kind)
    setModal({ kind, mode })
  }

  const activeKind = modal?.kind ?? lastKind
  const modalTitle = `Add ${KIND_OPTIONS.find((k) => k.value === activeKind)?.label ?? 'node'}`
  const activeHover = hoveredKind ?? KIND_OPTIONS[0]?.value ?? null

  return (
    <div ref={anchorRef} className="relative shrink-0">
      <Button
        size="sm"
        variant="secondary"
        onClick={openMenu}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        Add node
        <ChevronDown
          size={14}
          className={cn('ml-1.5 inline transition-transform', menuOpen && 'rotate-180')}
        />
      </Button>

      <AnchoredMenu open={menuOpen} onClose={closeMenu} anchorRef={anchorRef} minWidth={320}>
        <div
          className="flex"
          onMouseLeave={() => setHoveredKind(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-[160px] border-r border-neutral-100 py-0.5">
            {KIND_OPTIONS.map((opt) => {
              const active = activeHover === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  className={cn(
                    anchoredMenuItemClassName,
                    'flex items-center justify-between gap-2',
                    active && 'bg-neutral-50'
                  )}
                  onMouseEnter={() => setHoveredKind(opt.value)}
                  onFocus={() => setHoveredKind(opt.value)}
                  onClick={() => setHoveredKind(opt.value)}
                >
                  <span>{opt.label}</span>
                  <ChevronRight size={14} className="shrink-0 text-neutral-400" />
                </button>
              )
            })}
          </div>
          <div className="min-w-[140px] py-0.5">
            {activeHover
              ? (activeHover === 'COMMUNICATION'
                  ? MODE_OPTIONS.filter((m) => m.value === 'single')
                  : MODE_OPTIONS
                ).map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    role="menuitem"
                    className={anchoredMenuItemClassName}
                    onClick={() => pickMode(activeHover, mode.value)}
                  >
                    {mode.label}
                  </button>
                ))
              : null}
          </div>
        </div>
      </AnchoredMenu>

      <CatalogSingleAddModal
        open={modal?.mode === 'single'}
        kind={activeKind}
        title={modalTitle}
        onClose={() => setModal(null)}
        onCreate={async (input) => {
          await onCreate(input)
          await onBatchComplete?.()
        }}
      />

      {/* Always mounted so background poll + result modal survive onClose. */}
      <CatalogBulkAddModal
        open={modal?.mode === 'bulk'}
        kind={activeKind}
        title={modalTitle}
        onClose={() => setModal(null)}
        onSubmitBulk={(items) => onSubmitBulk(activeKind, items)}
        onBatchComplete={onBatchComplete}
      />

      <CatalogJsonImportModal
        open={modal?.mode === 'json'}
        kind={activeKind}
        title={modalTitle}
        onClose={() => setModal(null)}
        onSubmitBulk={(items) => onSubmitBulk(activeKind, items)}
        onSubmitScreenFullSpec={onSubmitScreenFullSpec}
        onBatchComplete={onBatchComplete}
      />
    </div>
  )
}
