'use client'

import type { ReactNode } from 'react'
import { ArrowRight, Check, Minus, X } from 'lucide-react'
import { Badge, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  coverageStatusLabel,
  coverageStatusTone,
  type LayerStepState,
} from '../model/requirement-traceability'

export interface FilterChipItem {
  id: string
  label: string
  count: string | number
}

/** Same chip style as Test Execution quick filters. */
export function FilterChipBar({
  items,
  activeId,
  onSelect,
  className,
}: {
  items: FilterChipItem[]
  activeId: string
  onSelect: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((f) => {
        const active = activeId === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f.id)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 border px-2.5 text-sm transition-colors',
              active
                ? 'border-secondary bg-secondary text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            )}
          >
            <span>{f.label}</span>
            <span
              className={cn(
                'inline-flex min-w-[1.25rem] items-center justify-center px-1 text-xs font-medium',
                active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
              )}
            >
              {f.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Status badge — solid bg + white text. */
export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge
      size="sm"
      variant="solid"
      tone={coverageStatusTone(status)}
      className={cn('border-0 font-medium', className)}
    >
      {coverageStatusLabel(status)}
    </Badge>
  )
}

const STEP_STATE_CLASS: Record<LayerStepState['state'], string> = {
  ok: 'text-success',
  missing: 'text-error',
  blocked: 'text-neutral-400',
  na: 'text-neutral-400',
}

function StepStateIcon({ state }: { state: LayerStepState['state'] }) {
  const className = 'size-3 shrink-0'
  if (state === 'ok') return <Check className={className} aria-hidden strokeWidth={2.5} />
  if (state === 'missing') return <X className={className} aria-hidden strokeWidth={2.5} />
  return <Minus className={className} aria-hidden strokeWidth={2.5} />
}

/** Compact coverage path: F ✕ → UC — → I — → T ✕ */
export function CoveragePath({
  steps,
  className,
}: {
  steps: LayerStepState[]
  className?: string
}) {
  const title = steps.map((s) => `${s.label}: ${s.state}`).join('\n')
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1 text-sm font-semibold', className)}
      title={title}
    >
      {steps.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1">
          {i > 0 ? (
            <ArrowRight className="size-3 shrink-0 text-neutral-300" aria-hidden />
          ) : null}
          <span className={cn('inline-flex items-center gap-0.5 tabular-nums', STEP_STATE_CLASS[s.state])}>
            {s.short}
            <StepStateIcon state={s.state} />
          </span>
        </span>
      ))}
    </div>
  )
}

export function SummaryStrip({
  items,
}: {
  items: Array<{ label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'error' }>
}) {
  return (
    <div className="flex flex-wrap items-stretch gap-px border border-neutral-200 bg-neutral-200">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-h-[52px] min-w-[100px] flex-1 items-center gap-3 bg-white px-3 py-2"
        >
          <span className="text-xs text-neutral-500">{item.label}</span>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums text-neutral-900',
              item.tone === 'success' && 'text-success',
              item.tone === 'warning' && 'text-warning',
              item.tone === 'error' && 'text-error'
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PipelineBar({
  stages,
  note,
}: {
  stages: Array<{
    label: string
    value: string | number
    muted?: boolean
    /** Semantic color for the stage marker + value. */
    tone?: 'neutral' | 'error' | 'warning' | 'muted' | 'success' | 'info'
  }>
  note?: string
}) {
  return (
    <div className="border border-neutral-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-stretch gap-2">
        {stages.map((s, i) => {
          const hollow = Boolean(s.muted) || s.value === '—'
          const tone = s.tone ?? (hollow ? 'muted' : 'neutral')
          const toneClass =
            tone === 'error'
              ? 'text-error'
              : tone === 'warning'
                ? 'text-warning'
                : tone === 'success'
                  ? 'text-success'
                  : tone === 'info'
                    ? 'text-info'
                    : tone === 'muted'
                      ? 'text-neutral-400'
                      : 'text-neutral-800'

          return (
            <div key={s.label} className="flex min-w-[7rem] flex-1 items-center gap-2">
              {i > 0 ? (
                <ArrowRight
                  className="hidden size-3.5 shrink-0 text-neutral-300 sm:block"
                  aria-hidden
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <Typography variant="small" tone="muted">
                  {s.label}
                </Typography>
                <Typography
                  weight="semibold"
                  className={cn('mt-0.5 tabular-nums', toneClass, hollow && 'text-neutral-400')}
                >
                  {s.value}
                </Typography>
              </div>
            </div>
          )
        })}
      </div>
      {note ? (
        <Typography variant="small" tone="muted" className="mt-3">
          {note}
        </Typography>
      ) : null}
    </div>
  )
}

export function ActionBanner({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="min-w-0">
        <Typography weight="medium">{title}</Typography>
        {description ? (
          <Typography variant="small" tone="muted" className="mt-0.5">
            {description}
          </Typography>
        ) : null}
      </div>
      {action}
    </div>
  )
}
