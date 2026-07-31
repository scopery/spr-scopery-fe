'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { CreateUseCaseBody } from '../model/use-case'
import type { FunctionalItem } from '../model/functional-catalog'
import { UseCaseSingleAddModal } from './UseCaseSingleAddModal'
import { UseCaseBulkAddModal } from './UseCaseBulkAddModal'

type AddMode = 'single' | 'bulk'

interface Props {
  functionalItems: FunctionalItem[]
  onCreate: (body: CreateUseCaseBody) => Promise<unknown>
  onBatchComplete?: () => Promise<void> | void
}

export function UseCaseAddBar({ functionalItems, onCreate, onBatchComplete }: Props) {
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
    <div ref={rootRef} className="relative flex justify-end">
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

      <UseCaseSingleAddModal
        open={mode === 'single'}
        functionalItems={functionalItems}
        onClose={() => setMode(null)}
        onCreate={async (body) => {
          await onCreate(body)
          await onBatchComplete?.()
        }}
      />

      <UseCaseBulkAddModal
        open={mode === 'bulk'}
        functionalItems={functionalItems}
        onClose={() => setMode(null)}
        onCreate={onCreate}
        onBatchComplete={onBatchComplete}
      />
    </div>
  )
}
