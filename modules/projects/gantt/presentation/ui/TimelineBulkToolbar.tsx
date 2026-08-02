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
import { UserIdentity, type PersonIdentity } from '@/modules/platform'

type Props = {
  selectedCount: number
  assigneePeople: PersonIdentity[]
  /** Hide Assign when all selected tasks are done/closed. */
  showAssign?: boolean
  onClear: () => void
  onAssign: (userId: string) => void
  onShift: (deltaWorkingDays: number) => void
  onSequential: () => void
  onParallel: () => void
  onArchive: () => void
  onCopyDates: () => void
}

export function TimelineBulkToolbar({
  selectedCount,
  assigneePeople,
  showAssign = true,
  onClear,
  onAssign,
  onShift,
  onSequential,
  onParallel,
  onArchive,
  onCopyDates,
}: Props) {
  const [assignOpen, setAssignOpen] = useState(false)
  const assignRef = useRef<HTMLDivElement>(null)

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
      {showAssign && (
        <div ref={assignRef} className="relative shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-[11rem] justify-between"
            disabled={assigneePeople.length === 0}
            onClick={() => setAssignOpen((v) => !v)}
          >
            Assign to…
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
          <AnchoredMenu
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            anchorRef={assignRef}
            minWidth={260}
          >
            {assigneePeople.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">No members</div>
            ) : (
              assigneePeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className={anchoredMenuItemClassName}
                  onClick={() => {
                    setAssignOpen(false)
                    onAssign(person.id)
                  }}
                >
                  <UserIdentity userId={person.id} person={person} showEmail size="sm" />
                </button>
              ))
            )}
          </AnchoredMenu>
        </div>
      )}
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
