'use client'

import { Button, Input, Stack, Typography } from '@/shared/ui'
import type { TaskAllocationPlan } from '../../domain/model/allocation'
import { allocationBalance } from '../../domain/rules/allocation.rules'

type Props = {
  taskTitle: string
  estimateHours: number | null
  plan: TaskAllocationPlan
  onChangeDay: (workDate: string, hours: number) => void
  onRedistribute: () => void
  onClearManual: () => void
  onClose: () => void
}

export function AllocationEditorPanel({
  taskTitle,
  estimateHours,
  plan,
  onChangeDay,
  onRedistribute,
  onClearManual,
  onClose,
}: Props) {
  const bal = allocationBalance(plan, estimateHours)
  const days = Object.keys(plan.days).sort()

  return (
    <div className="border border-neutral-200 bg-white p-md shadow-sm">
      <Stack direction="vertical" spacing="sm">
        <Stack direction="horizontal" spacing="sm" className="items-start justify-between">
          <div>
            <Typography size="sm" weight="medium">
              Edit allocation
            </Typography>
            <Typography variant="caption" tone="muted" className="truncate">
              {taskTitle}
            </Typography>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Stack>

        <Typography variant="caption" tone="muted">
          {bal.estimateMinutes != null
            ? `Allocated ${(bal.allocatedMinutes / 60).toFixed(1)}h / Estimate ${(
                bal.estimateMinutes / 60
              ).toFixed(1)}h`
            : `Allocated ${(bal.allocatedMinutes / 60).toFixed(1)}h (no estimate)`}
          {bal.deltaMinutes != null && bal.deltaMinutes !== 0
            ? bal.deltaMinutes > 0
              ? ` · ${(bal.deltaMinutes / 60).toFixed(1)}h not allocated`
              : ` · ${Math.abs(bal.deltaMinutes / 60).toFixed(1)}h over-allocated`
            : null}
        </Typography>

        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-5">
          {days.map((day) => (
            <label key={day} className="text-[10px] text-neutral-600">
              {day.slice(5)}
              <Input
                className="mt-0.5 h-7 text-xs"
                value={String((plan.days[day] ?? 0) / 60)}
                onChange={(e) => {
                  const h = Number(e.target.value)
                  onChangeDay(day, Number.isFinite(h) ? h : 0)
                }}
              />
            </label>
          ))}
        </div>

        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          <Button size="sm" variant="outline" onClick={onRedistribute}>
            Redistribute evenly
          </Button>
          <Button size="sm" variant="ghost" onClick={onClearManual}>
            Reset to auto
          </Button>
        </Stack>
      </Stack>
    </div>
  )
}

