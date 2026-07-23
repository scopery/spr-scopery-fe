'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { ArchitectureNodeType } from '../model/architecture-workbench'
import { CatalogBulkAddModal, type CatalogAddKind } from './CatalogBulkAddModal'
import { CatalogSingleAddModal } from './CatalogSingleAddModal'

type AddMode = 'single' | 'bulk'
type MenuStep = 'kinds' | 'mode'

const KIND_OPTIONS: { value: CatalogAddKind; label: string }[] = [
  { value: 'MODULE', label: 'Module' },
  { value: 'SCREEN', label: 'Screen' },
  { value: 'API_ENDPOINT', label: 'API Endpoint' },
  { value: 'COMPONENT', label: 'Component' },
  { value: 'DATA_ENTITY', label: 'Data Entity' },
]

/** Kinds that expose at least one enum field in the create form. */
const KINDS_WITH_ENUM: ReadonlySet<CatalogAddKind> = new Set(['API_ENDPOINT'])

interface CatalogCreateInput {
  kind: ArchitectureNodeType
  code: string
  name: string
  extra?: string
}

interface CatalogAddBarProps {
  /** Create one item — prefer `{ refresh: false }` in the hook; batch refreshes once. */
  onCreate: (input: CatalogCreateInput) => Promise<void>
  onBatchComplete?: () => Promise<void> | void
}

export function CatalogAddBar({ onCreate, onBatchComplete }: CatalogAddBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuStep, setMenuStep] = useState<MenuStep>('kinds')
  const [pendingKind, setPendingKind] = useState<CatalogAddKind | null>(null)
  const [modal, setModal] = useState<{ kind: CatalogAddKind; mode: AddMode } | null>(null)
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

  const openMenu = () => {
    setMenuStep('kinds')
    setPendingKind(null)
    setMenuOpen((v) => !v)
  }

  const pickKind = (kind: CatalogAddKind) => {
    if (KINDS_WITH_ENUM.has(kind)) {
      setPendingKind(kind)
      setMenuStep('mode')
      return
    }
    setMenuOpen(false)
    setModal({ kind, mode: 'bulk' })
  }

  const pickMode = (mode: AddMode) => {
    if (!pendingKind) return
    setMenuOpen(false)
    setModal({ kind: pendingKind, mode })
  }

  const modalTitle =
    modal != null
      ? `Add ${KIND_OPTIONS.find((k) => k.value === modal.kind)?.label ?? 'node'}`
      : 'Add node'

  return (
    <div ref={rootRef} className="relative flex justify-end">
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

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[200px] border border-neutral-200 bg-white py-1 shadow-md"
        >
          {menuStep === 'kinds'
            ? KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                  onClick={() => pickKind(opt.value)}
                >
                  {opt.label}
                  {KINDS_WITH_ENUM.has(opt.value) ? (
                    <span className="ml-1 text-xs text-neutral-400">›</span>
                  ) : null}
                </button>
              ))
            : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-xs text-neutral-500 hover:bg-neutral-50"
                    onClick={() => setMenuStep('kinds')}
                  >
                    ← {KIND_OPTIONS.find((k) => k.value === pendingKind)?.label}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                    onClick={() => pickMode('single')}
                  >
                    Single add
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                    onClick={() => pickMode('bulk')}
                  >
                    Bulk add
                  </button>
                </>
              )}
        </div>
      ) : null}

      {modal?.mode === 'single' ? (
        <CatalogSingleAddModal
          open
          kind={modal.kind}
          title={modalTitle}
          onClose={() => setModal(null)}
          onCreate={async (input) => {
            await onCreate(input)
            await onBatchComplete?.()
          }}
        />
      ) : null}

      {modal?.mode === 'bulk' ? (
        <CatalogBulkAddModal
          open
          kind={modal.kind}
          title={modalTitle}
          onClose={() => setModal(null)}
          onCreate={onCreate}
          onBatchComplete={onBatchComplete}
        />
      ) : null}
    </div>
  )
}
