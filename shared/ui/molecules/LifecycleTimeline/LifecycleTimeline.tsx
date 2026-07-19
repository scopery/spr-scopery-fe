import React from 'react'
import { cn } from '@/utils/cn'
import { Typography } from '../../atoms/Typography'
import {
  LifecycleStepState,
  type LifecycleTimelineProps,
} from './LifecycleTimeline.types'

const stateDotClass = {
  [LifecycleStepState.Completed]: 'bg-success',
  [LifecycleStepState.Current]: 'bg-primary ring-2 ring-primary/30',
  [LifecycleStepState.Upcoming]: 'bg-neutral-300',
  [LifecycleStepState.Skipped]: 'bg-neutral-200',
} as const

const stateLabelTone = {
  [LifecycleStepState.Completed]: 'default' as const,
  [LifecycleStepState.Current]: 'primary' as const,
  [LifecycleStepState.Upcoming]: 'muted' as const,
  [LifecycleStepState.Skipped]: 'muted' as const,
}

/**
 * LifecycleTimeline — generic status path for quotes, baselines, CRs, scenarios.
 * Labels and step ids come from callers; no domain enums imported.
 */
export const LifecycleTimeline = React.forwardRef<HTMLOListElement, LifecycleTimelineProps>(
  (
    {
      steps,
      orientation = 'horizontal',
      className,
      'aria-label': ariaLabel = 'Lifecycle',
    },
    ref
  ) => {
    const horizontal = orientation === 'horizontal'

    return (
      <ol
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          'flex',
          horizontal ? 'flex-row flex-wrap items-start gap-sm' : 'flex-col gap-md',
          className
        )}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex',
                horizontal ? 'min-w-[6rem] flex-1 flex-col items-start gap-xs' : 'gap-sm'
              )}
              aria-current={step.state === LifecycleStepState.Current ? 'step' : undefined}
            >
              <div className={cn('flex items-center gap-sm', horizontal && 'w-full')}>
                <span
                  className={cn('h-2.5 w-2.5 shrink-0 rounded-full', stateDotClass[step.state])}
                  aria-hidden
                />
                {horizontal && !isLast ? (
                  <span
                    className="h-px min-w-[1.5rem] flex-1 bg-neutral-200"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={cn(!horizontal && 'pt-0')}>
                <Typography
                  as="span"
                  variant="small"
                  weight={step.state === LifecycleStepState.Current ? 'semibold' : 'medium'}
                  tone={stateLabelTone[step.state]}
                >
                  {step.label}
                </Typography>
                {step.timestamp ? (
                  <Typography as="p" variant="caption" tone="muted" className="mt-xs">
                    {step.timestamp}
                  </Typography>
                ) : null}
                {step.description ? (
                  <Typography as="p" variant="caption" tone="muted" className="mt-xs">
                    {step.description}
                  </Typography>
                ) : null}
                {step.meta ? <div className="mt-xs">{step.meta}</div> : null}
              </div>
              {!horizontal && !isLast ? (
                <span
                  className="absolute left-[4px] top-4 h-[calc(100%-0.5rem)] w-px bg-neutral-200"
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    )
  }
)

LifecycleTimeline.displayName = 'LifecycleTimeline'
