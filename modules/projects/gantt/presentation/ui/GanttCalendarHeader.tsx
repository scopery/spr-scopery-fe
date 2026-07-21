'use client'

import { cn } from '@/utils/cn'
import { Typography } from '@/shared/ui'
import type { GanttScaleTick, GanttTimeScale } from '../../domain/rules/gantt.rules'

interface GanttCalendarHeaderProps {
  majors: GanttScaleTick[]
  days: GanttScaleTick[]
  scale: GanttTimeScale
  widthPx: number
}

export function GanttCalendarHeader({ majors, days, scale, widthPx }: GanttCalendarHeaderProps) {
  const showDayStrip = scale !== 'month'

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50" style={{ width: widthPx }}>
      <div className="relative h-7 border-b border-neutral-200">
        {majors.map((tick) => (
          <div
            key={tick.key}
            className="absolute inset-y-0 flex items-center justify-center overflow-hidden border-r border-neutral-200 px-1"
            style={{ left: `${tick.leftPercent}%`, width: `${tick.widthPercent}%` }}
          >
            <Typography as="span" size="xs" weight="medium" className="truncate text-neutral-700">
              {tick.label}
            </Typography>
          </div>
        ))}
      </div>
      {showDayStrip ? (
        <div className="relative h-6">
          {days.map((tick) => (
            <div
              key={tick.key}
              className={cn(
                'absolute inset-y-0 flex flex-col items-center justify-center border-r border-neutral-100',
                tick.isWeekend && 'bg-neutral-100/80'
              )}
              style={{ left: `${tick.leftPercent}%`, width: `${tick.widthPercent}%` }}
              title={tick.key}
            >
              <Typography
                as="span"
                size="xs"
                className={cn('leading-none', tick.isWeekend ? 'text-neutral-400' : 'text-neutral-600')}
              >
                {tick.label}
              </Typography>
              {scale === 'day' || scale === 'week' ? (
                <Typography as="span" size="xs" className="leading-none text-neutral-500">
                  {tick.subLabel}
                </Typography>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
