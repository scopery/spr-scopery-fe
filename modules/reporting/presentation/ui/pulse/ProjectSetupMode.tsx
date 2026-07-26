'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button, Stack, Typography } from '@/shared/ui'
import type {
  ActivityTimelineItem,
  AttentionItem,
  ProjectSetupChecklist,
} from '../../../domain/model/project-pulse'
import { PulsePanel, PulseTextAction } from './PulseWidget'

export function ProjectSetupMode({
  setup,
  attention,
  activity,
}: {
  setup: ProjectSetupChecklist
  attention: AttentionItem[]
  activity: ActivityTimelineItem[]
}) {
  const [showCompleted, setShowCompleted] = useState(false)
  const remaining = setup.steps.filter((step) => !step.done)
  const completed = setup.steps.filter((step) => step.done)
  const doneCount = completed.length
  const progress = Math.round((doneCount / Math.max(setup.steps.length, 1)) * 100)

  return (
    <Stack direction="vertical" spacing="md">
      <PulsePanel>
        <div className="space-y-md bg-warning/5 p-md">
          <div className="flex flex-wrap items-start justify-between gap-md">
            <div className="max-w-2xl space-y-xs">
              <Typography variant="h4">{setup.title}</Typography>
              <Typography variant="small" className="text-neutral-700">
                {setup.description}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="h3" className="text-neutral-900">
                {progress}%
              </Typography>
              <Typography variant="caption" tone="muted">
                {doneCount} of {setup.steps.length} steps completed
              </Typography>
            </div>
          </div>

          <div className="h-2 overflow-hidden bg-warning/20">
            <div className="h-full bg-warning" style={{ width: `${progress}%` }} />
          </div>

          <div className="space-y-sm">
            <Typography variant="overline" tone="muted">
              Remaining
            </Typography>
            {remaining.length === 0 ? (
              <Typography variant="small" tone="muted">
                All setup steps are complete.
              </Typography>
            ) : (
              <ol className="space-y-sm">
                {remaining.map((step, index) => (
                  <li key={step.id} className="border border-neutral-200 bg-neutral-50 p-sm">
                    <div className="flex flex-wrap items-start justify-between gap-sm">
                      <div className="min-w-0 flex-1 space-y-xs">
                        <Typography variant="small" className="font-semibold text-neutral-900">
                          {index + 1}. {step.label}
                        </Typography>
                        <Typography variant="caption" className="text-neutral-600">
                          {step.description}
                        </Typography>
                      </div>
                      {step.href ? (
                        <Button as={NextLink} href={step.href} size="sm" variant="primary" className="bg-primary">
                          {step.actionLabel}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {completed.length > 0 ? (
            <div>
              <button
                type="button"
                className="inline-flex items-center gap-xs text-sm text-neutral-700 hover:text-neutral-900"
                onClick={() => setShowCompleted((v) => !v)}
              >
                {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {completed.length} completed step{completed.length === 1 ? '' : 's'}
                <span className="text-neutral-500">· View</span>
              </button>
              {showCompleted ? (
                <ul className="mt-sm space-y-xs border border-neutral-200 bg-white p-sm">
                  {completed.map((step) => (
                    <li key={step.id} className="flex items-center gap-sm">
                      <Check size={14} className="shrink-0 text-success" aria-hidden />
                      <Typography variant="small" className="text-neutral-700">
                        {step.label}
                      </Typography>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </PulsePanel>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <PulsePanel>
          <div className="space-y-sm p-md">
            <Typography variant="h5">Available now</Typography>
            {setup.availableNow.length === 0 ? (
              <Typography variant="small" tone="muted">
                No live signals yet beyond project creation.
              </Typography>
            ) : (
              <ul className="space-y-sm">
                {setup.availableNow.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-baseline justify-between gap-sm border-b border-neutral-100 pb-sm last:border-b-0 last:pb-0"
                  >
                    <Typography variant="small" tone="muted">
                      {item.label}
                    </Typography>
                    {item.href ? (
                      <NextLink href={item.href} className="text-sm font-semibold text-neutral-900 underline-offset-2 hover:underline">
                        {item.value}
                      </NextLink>
                    ) : (
                      <Typography variant="small" className="font-semibold text-neutral-900">
                        {item.value}
                      </Typography>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PulsePanel>

        <PulsePanel>
          <div className="space-y-sm p-md">
            <Typography variant="h5">Needs your attention</Typography>
            {attention.length === 0 ? (
              <Typography variant="small" tone="muted">
                No urgent items while setup continues.
              </Typography>
            ) : (
              <ul className="space-y-sm">
                {attention.slice(0, 3).map((item) => (
                  <li key={item.id} className="space-y-xs">
                    <Typography variant="small" className="font-semibold text-neutral-900">
                      {item.title}
                    </Typography>
                    <Typography variant="caption" className="block text-neutral-600">
                      {item.impact}
                    </Typography>
                    {item.href ? (
                      <PulseTextAction href={item.href}>{item.actionLabel}</PulseTextAction>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PulsePanel>
      </div>

      {activity.length > 0 ? (
        <PulsePanel>
          <div className="space-y-sm p-md">
            <Typography variant="h5">Recent activity</Typography>
            <ul className="space-y-sm">
              {activity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-sm">
                  <div>
                    <Typography variant="small" className="text-neutral-900">
                      {item.summary}
                    </Typography>
                    {item.createdAt ? (
                      <Typography variant="caption" tone="muted">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    ) : null}
                  </div>
                  {item.href ? <PulseTextAction href={item.href}>Open</PulseTextAction> : null}
                </li>
              ))}
            </ul>
          </div>
        </PulsePanel>
      ) : null}

      <PulsePanel>
        <div className="p-md">
          <Typography variant="h5" className="mb-xs">
            Insights unlock after setup
          </Typography>
          <Typography variant="small" className="text-neutral-700">
            {setup.unlockNext.join(' · ')}
          </Typography>
        </div>
      </PulsePanel>
    </Stack>
  )
}
