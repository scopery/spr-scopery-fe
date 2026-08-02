'use client'

import { useRef, useState } from 'react'
import {
  AnchoredMenu,
  anchoredMenuItemClassName,
  Button,
  Stack,
  Typography,
} from '@/shared/ui'
import { Check, ChevronDown } from 'lucide-react'
import { UserIdentity, type PersonIdentity } from '@/modules/platform'
import { cn } from '@/utils/cn'

export type CurrentAssigneeSummary = {
  kind: 'none' | 'single' | 'mixed'
  person: PersonIdentity | null
  ids: string[]
}

type Props = {
  selectedCount: number
  assigneePeople: PersonIdentity[]
  /** Hide Assign when all selected tasks are done/closed. */
  showAssign?: boolean
  currentAssignee?: CurrentAssigneeSummary
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
  currentAssignee = { kind: 'none', person: null, ids: [] },
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

  const assignLabel =
    currentAssignee.kind === 'single' && currentAssignee.person
      ? currentAssignee.person.fullName || 'Assigned'
      : currentAssignee.kind === 'mixed'
        ? 'Mixed assignees'
        : 'Unassigned'

  return (
    <Stack
      direction="horizontal"
      spacing="sm"
      className="relative z-20 flex-nowrap items-start overflow-visible border border-primary-200 bg-primary-50 px-md py-sm"
    >
      <Typography variant="caption" weight="medium" className="shrink-0 pt-2">
        {selectedCount} task{selectedCount === 1 ? '' : 's'} selected
      </Typography>
      <Button
        variant="outline"
        size="sm"
        className="h-9 shrink-0"
        disabled={selectedCount < 2}
        title={
          selectedCount < 2
            ? 'Select 2+ tasks: place them one after another on working days'
            : 'Place selected tasks one after another (back-to-back). Draft only — Apply to save.'
        }
        onClick={onSequential}
      >
        Schedule Sequentially
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 shrink-0"
        disabled={selectedCount < 2}
        title={
          selectedCount < 2
            ? 'Select 2+ tasks: start them all on the same day'
            : 'Start all selected tasks on the same day (each keeps its own duration). Draft only — Apply to save.'
        }
        onClick={onParallel}
      >
        Schedule in Parallel
      </Button>
      {showAssign && (
        <div ref={assignRef} className="relative shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-[12rem] max-w-[16rem] justify-between gap-1"
            disabled={assigneePeople.length === 0}
            title={`Current: ${assignLabel}. Click to reassign.`}
            onClick={() => setAssignOpen((v) => !v)}
          >
            <span className="truncate text-left">
              <span className="text-neutral-500">Assign: </span>
              {assignLabel}
            </span>
            <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0" />
          </Button>
          <AnchoredMenu
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            anchorRef={assignRef}
            minWidth={280}
          >
            {assigneePeople.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">No members</div>
            ) : (
              assigneePeople.map((person) => {
                const isCurrent = currentAssignee.ids.includes(person.id)
                return (
                  <button
                    key={person.id}
                    type="button"
                    className={cn(
                      anchoredMenuItemClassName,
                      'flex items-center justify-between gap-2',
                      isCurrent && 'bg-primary-50'
                    )}
                    onClick={() => {
                      setAssignOpen(false)
                      onAssign(person.id)
                    }}
                  >
                    <UserIdentity userId={person.id} person={person} showEmail size="sm" />
                    {isCurrent ? (
                      <Check className="h-4 w-4 shrink-0 text-primary-700" aria-label="Current" />
                    ) : null}
                  </button>
                )
              })
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
