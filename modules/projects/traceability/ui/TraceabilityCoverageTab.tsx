'use client'

import { Button, PageSkeleton, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useCoverageSummary } from '../hooks/useCoverageSummary'
import { ActionBanner, PipelineBar } from './TraceabilityStatusBits'

interface TraceabilityCoverageTabProps {
  projectId: string
  onOpenMatrix?: (opts?: { showGapsOnly?: boolean; gapCode?: string }) => void
}

export function TraceabilityCoverageTab({
  projectId,
  onOpenMatrix,
}: TraceabilityCoverageTabProps) {
  const { data, loading, error, refetch } = useCoverageSummary(projectId)

  if (loading) return <PageSkeleton variant="list" />
  if (error) {
    return (
      <div>
        <Typography tone="error">{error}</Typography>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }
  if (!data) return null

  const noFunctions = data.missingFunctions === data.requirements && data.requirements > 0

  const fnCount = data.funnel.find((f) => f.stage === 'HAS_FUNCTION')?.count ?? 0
  const testCount = data.funnel.find((f) => f.stage === 'HAS_TEST')?.count ?? 0
  const ucValue = noFunctions
    ? '—'
    : String(data.funnel.find((f) => f.stage === 'HAS_USE_CASE')?.count ?? 0)
  const implValue = noFunctions
    ? '—'
    : String(data.funnel.find((f) => f.stage === 'HAS_IMPLEMENTATION')?.count ?? 0)

  const actionableGaps: Array<{
    label: string
    value: number
    tone: 'error' | 'warning'
    actionLabel: string
    gapCode: string
  }> = [
    {
      label: 'Missing Function',
      value: data.missingFunctions,
      tone: 'error' as const,
      actionLabel: 'Link Functions',
      gapCode: 'MISSING_FUNCTION',
    },
    {
      label: 'Missing Test',
      value: data.missingTests,
      tone: 'warning' as const,
      actionLabel: 'View in Matrix',
      gapCode: 'MISSING_TEST',
    },
    ...(!noFunctions
      ? [
          {
            label: 'Missing Use Case',
            value: data.missingUseCases,
            tone: 'warning' as const,
            actionLabel: 'View in Matrix',
            gapCode: 'MISSING_USE_CASE',
          },
          {
            label: 'Missing Implementation',
            value: data.missingImplementation,
            tone: 'warning' as const,
            actionLabel: 'View in Matrix',
            gapCode: 'MISSING_IMPLEMENTATION',
          },
        ]
      : []),
  ].filter((g) => g.value > 0)

  const blockedChecks: Array<{ label: string; detail: string }> = noFunctions
    ? [
        { label: 'Use Case', detail: 'Waiting for Function links' },
        { label: 'Implementation', detail: 'Waiting for Function links' },
      ]
    : []

  return (
    <div className="space-y-5">
      <PipelineBar
        stages={[
          { label: 'Requirements', value: data.requirements, tone: 'neutral' },
          {
            label: 'Functions',
            value: fnCount,
            tone: fnCount === 0 && data.requirements > 0 ? 'error' : 'neutral',
          },
          {
            label: 'Use Cases',
            value: ucValue,
            muted: noFunctions,
            tone: noFunctions ? 'muted' : 'neutral',
          },
          {
            label: 'Implementation',
            value: implValue,
            muted: noFunctions,
            tone: noFunctions ? 'muted' : 'neutral',
          },
          {
            label: 'Tests',
            value: testCount,
            tone:
              testCount === 0 && data.requirements > 0
                ? noFunctions
                  ? 'warning'
                  : 'error'
                : 'neutral',
          },
          {
            label: 'Complete',
            value: data.completeCount,
            muted: data.completeCount === 0,
            tone: data.completeCount === 0 ? 'muted' : 'success',
          },
        ]}
        note={
          noFunctions
            ? 'Use Case and Implementation coverage cannot be evaluated until Functions are linked.'
            : 'Functional path: Requirement → Function → Use Case → Test Case. NFR path: Requirement → Verification Target → Verification Case.'
        }
      />

      {noFunctions ? (
        <ActionBanner
          title={`${data.requirements} requirements need a Function link before deeper coverage can be evaluated.`}
          description="Start with Functions — Use Cases and Implementation follow from there."
          action={
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                onOpenMatrix?.({ showGapsOnly: true, gapCode: 'MISSING_FUNCTION' })
              }
            >
              Link Functions
            </Button>
          }
        />
      ) : null}

      <section className="border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <Typography weight="semibold">Coverage status</Typography>
        </div>

        {actionableGaps.length > 0 ? (
          <div className="border-b border-neutral-100">
            <div className="px-4 pt-3 pb-1">
              <Typography variant="small" tone="muted" className="font-medium uppercase tracking-wide">
                Actionable gaps
              </Typography>
            </div>
            <ul>
              {actionableGaps.map((g) => (
                <li
                  key={g.label}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                >
                  <div className="flex items-baseline gap-3">
                    <Typography variant="small" className="min-w-[9rem]">
                      {g.label}
                    </Typography>
                    <Typography
                      weight="semibold"
                      className={cn(
                        'tabular-nums',
                        g.tone === 'error' && 'text-error',
                        g.tone === 'warning' && 'text-warning'
                      )}
                    >
                      {g.value}
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto px-0 font-normal text-neutral-800 underline hover:bg-transparent"
                    onClick={() =>
                      onOpenMatrix?.({
                        showGapsOnly: true,
                        gapCode: g.gapCode,
                      })
                    }
                  >
                    {g.actionLabel}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {blockedChecks.length > 0 ? (
          <div>
            <div className="px-4 pt-3 pb-1">
              <Typography variant="small" tone="muted" className="font-medium uppercase tracking-wide">
                Blocked checks
              </Typography>
            </div>
            <ul>
              {blockedChecks.map((g) => (
                <li
                  key={g.label}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 last:pb-3"
                >
                  <div className="flex items-baseline gap-3">
                    <Typography variant="small" className="min-w-[9rem] text-neutral-600">
                      {g.label}
                    </Typography>
                    <Typography variant="small" className="text-neutral-400">
                      {g.detail}
                    </Typography>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {actionableGaps.length === 0 && blockedChecks.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Typography tone="muted">No coverage gaps right now.</Typography>
          </div>
        ) : null}
      </section>

      {data.byRequirementType.length > 1 ? (
        <section className="border border-neutral-200 bg-white px-4 py-3">
          <Typography weight="semibold" className="mb-3">
            Coverage by Requirement Type
          </Typography>
          <div className="space-y-2">
            {data.byRequirementType.map((row) => (
              <div
                key={row.requirementType}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium">{row.requirementType}</span>
                <span className="text-neutral-600 tabular-nums">
                  {row.completeCount}/{row.total} complete ({row.completePct}%)
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
