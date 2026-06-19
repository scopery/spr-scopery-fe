'use client'

import Link from 'next/link'
import { cn } from '@/utils/cn'
import { ChevronRight } from 'lucide-react'
import type { StepperProps, StepperStep } from './Stepper.types'

function StepContent({ step }: { step: StepperStep }) {
  const content = (
    <>
      <span
        className={cn(
          'relative inline-flex h-7 w-8 shrink-0 items-center justify-center text-sm',
          '[clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]',
          step.active ? 'bg-primary text-white' : 'bg-neutral-300'
        )}
        aria-current={step.active ? 'step' : undefined}
      >
        {!step.active && (
          <span
            className="absolute inset-[1px] bg-white [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]"
            aria-hidden
          />
        )}
        <span className={cn('relative z-10', step.active ? 'text-white' : 'text-neutral-500')}>
          {step.id}
        </span>
      </span>
      <span
        className={cn('text-sm', step.active ? 'text-neutral-900' : 'font-normal text-neutral-400')}
      >
        {step.label}
      </span>
    </>
  )
  if (step.href) {
    return (
      <Link
        href={step.href}
        className="flex items-center gap-2 transition-opacity hover:opacity-90"
        aria-current={step.active ? 'step' : undefined}
      >
        {content}
      </Link>
    )
  }
  return <span className="flex items-center gap-2">{content}</span>
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="list"
      aria-label="Steps"
    >
      {steps.map((step, i) => (
        <span key={step.id} className="flex items-center gap-2" role="listitem">
          <StepContent step={step} />
          {i < steps.length - 1 && (
            <span className="font-normal text-neutral-500" aria-hidden>
              <ChevronRight size={12} />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
