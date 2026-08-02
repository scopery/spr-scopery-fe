'use client'

import { useRef, useState } from 'react'
import {
  AnchoredMenu,
  anchoredMenuItemClassName,
  Button,
} from '@/shared/ui'
import { ChevronDown } from 'lucide-react'
import type { TimelineFlatRow } from '../../domain/model/timeline'

type Props = {
  phases: TimelineFlatRow[]
  onJump: (phaseRowId: string) => void
}

export function PhaseJumpSelect({ phases, onJump }: Props) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  if (phases.length === 0) return null

  return (
    <div ref={anchorRef} className="relative shrink-0">
      <Button
        variant="outline"
        size="md"
        className="h-9 min-w-[12rem] justify-between px-3 text-[13px] shadow-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="Jump to Phase"
      >
        Jump to Phase
        <ChevronDown className="ml-1 h-3.5 w-3.5" />
      </Button>
      <AnchoredMenu open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} minWidth={240}>
        {phases.map((p) => (
          <button
            key={p.id}
            type="button"
            className={anchoredMenuItemClassName}
            onClick={() => {
              setOpen(false)
              onJump(p.id)
            }}
          >
            {p.phaseCode ? `${p.phaseCode} · ${p.displayPrimary}` : p.displayPrimary}
          </button>
        ))}
      </AnchoredMenu>
    </div>
  )
}
