'use client'

import { useRef, useState } from 'react'
import {
  AnchoredMenu,
  anchoredMenuItemClassName,
  Button,
  Stack,
  Typography,
} from '@/shared/ui'
import { ChevronDown } from 'lucide-react'
import { UserSearchSelect, type PersonIdentity } from '@/modules/platform/identity'

export type BulkPhaseOption = { value: string; label: string }

type Props = {
  selectedCount: number
  assigneePeople: PersonIdentity[]
  phases: BulkPhaseOption[]
  onClear: () => void
  onAssign: (userId: string) => void
  onMovePhase: (phaseId: string) => void
  onShift: (deltaWorkingDays: number) => void
  onSequential: () => void
  onParallel: () => void
  onArchive: () => void
  onCopyDates: () => void
}

export function TimelineBulkToolbar({
  selectedCount,
  assigneePeople,
  phases,
  onClear,
  onAssign,
  onMovePhase,
  onShift,
  onSequential,
  onParallel,
  onArchive,
  onCopyDates,
}: Props) {
  const [assignKey, setAssignKey] = useState(0)
  const [phaseOpen, setPhaseOpen] = useState(false)
  const phaseRef = useRef<HTMLDivElement>(null)

  if (selectedCount === 0) return null

  return (
    <Stack
      direction="horizontal"
      spacing="sm"
      className="relative z-20 flex-nowrap items-start overflow-visible border border-primary-200 bg-primary-50 px-md py-sm"
    >
      <Typography variant="caption" weight="medium" className="shrink-0 pt-2">
        {selectedCount} task{selectedCount === 1 ? '' : 's'} selected
      </Typography>
      <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={onSequential}>
        Schedule Sequentially
      </Button>
      <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={onParallel}>
        Schedule in Parallel
      </Button>
      <div className="w-[16rem] shrink-0" key={assignKey}>
        <UserSearchSelect
          placeholder="Assign to…"
          value=""
          seedPeople={assigneePeople}
          allowRemoteSearch={false}
          onChange={(userId) => {
            if (!userId) return
            onAssign(userId)
            setAssignKey((k) => k + 1)
          }}
        />
      </div>
      <div ref={phaseRef} className="relative shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[11rem] justify-between"
          disabled={phases.length === 0}
          onClick={() => setPhaseOpen((v) => !v)}
        >
          Move phase…
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
        <AnchoredMenu
          open={phaseOpen}
          onClose={() => setPhaseOpen(false)}
          anchorRef={phaseRef}
          minWidth={220}
        >
          {phases.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">No phases</div>
          ) : (
            phases.map((p) => (
              <button
                key={p.value}
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  setPhaseOpen(false)
                  onMovePhase(p.value)
                }}
              >
                {p.label}
              </button>
            ))
          )}
        </AnchoredMenu>
      </div>
      <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={() => onShift(-1)}>
        Shift −1d
      </Button>
      <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={() => onShift(1)}>
        Shift +1d
      </Button>
      <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={onCopyDates}>
        Copy Dates
      </Button>
      <Button variant="ghost" size="sm" className="h-9 shrink-0" onClick={onClear}>
        Clear
      </Button>
      <Button variant="ghost" size="sm" className="h-9 shrink-0" onClick={onArchive}>
        Archive
      </Button>
    </Stack>
  )
}
