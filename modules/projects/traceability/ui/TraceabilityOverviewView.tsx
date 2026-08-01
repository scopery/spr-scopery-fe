'use client'

import { Badge, Button, Card, PageSkeleton, Typography } from '@/shared/ui'
import type { ReactNode } from 'react'
import { FUNNEL_STAGE_LABEL } from '../model/requirement-traceability'
import { useTraceabilityOverview } from '../hooks/useTraceabilityOverview'
import { PipelineBar, SummaryStrip } from './TraceabilityStatusBits'

export type TraceNavTab = 'overview' | 'functional' | 'implementation' | 'nfr' | 'explorer'
export type FunctionalSegment = 'requirements' | 'functions' | 'use-cases'

interface TraceabilityOverviewViewProps {
  projectId: string
  onNavigate: (opts: {
    tab: TraceNavTab
    segment?: FunctionalSegment
    filter?: string | null
  }) => void
}

const NEUTRAL_BTN =
  'border-0 bg-neutral-800 text-white hover:bg-neutral-900 hover:text-white focus-visible:ring-neutral-800'

function titleCase(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function stageCount(
  stages: Array<{ stage: string; count: number }>,
  stage: string
): number {
  return stages.find((s) => s.stage === stage)?.count ?? 0
}

function stageDrop(
  stages: Array<{ stage: string; count: number }>,
  from: string,
  to: string
): number {
  return Math.max(0, stageCount(stages, from) - stageCount(stages, to))
}

function isLowDataOverview(data: {
  strip: { requirementsTotal: number; requirementsMapped: number }
  functionalPipeline: { stages: Array<{ stage: string; count: number }> }
  nfrPipeline: { stages: Array<{ stage: string; count: number }> }
}): boolean {
  if (data.strip.requirementsTotal === 0) return true
  if (data.strip.requirementsMapped > 0) return false
  const nonRootZero = (stages: Array<{ stage: string; count: number }>) =>
    stages.slice(1).every((s) => s.count === 0)
  return nonRootZero(data.functionalPipeline.stages) && nonRootZero(data.nfrPipeline.stages)
}

function attentionScope(tab: string): {
  label: string
  tone: 'neutral' | 'info' | 'warning' | 'error'
} {
  if (tab === 'nfr') return { label: 'NFR', tone: 'info' }
  if (tab === 'implementation') return { label: 'Implementation', tone: 'warning' }
  if (tab === 'explorer') return { label: 'Explorer', tone: 'neutral' }
  return { label: 'Functional', tone: 'neutral' }
}

function parseCountFromMessage(message: string): number | null {
  const match = message.match(/\b(\d+)\b/)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) ? n : null
}

function NeutralButton({
  children,
  onClick,
  outline,
}: {
  children: ReactNode
  onClick: () => void
  outline?: boolean
}) {
  return (
    <Button
      size="sm"
      variant={outline ? 'outline' : 'secondary'}
      className={outline ? undefined : NEUTRAL_BTN}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function TraceabilityOverviewView({ projectId, onNavigate }: TraceabilityOverviewViewProps) {
  const { data, loading, error, refetch } = useTraceabilityOverview(projectId)

  if (loading) return <PageSkeleton variant="list" />
  if (error) {
    return (
      <div>
        <Typography tone="error">{error}</Typography>
        <NeutralButton onClick={() => void refetch()}>Retry</NeutralButton>
      </div>
    )
  }
  if (!data) return null

  const strip = data.strip
  const functionalGaps = strip.functionsMissingUseCases + strip.useCasesMissingTests
  const showGetStarted = isLowDataOverview(data)

  const funcStages = data.functionalPipeline.stages.map((s, i) => {
    const empty = i > 0 && s.count === 0
    return {
      label: FUNNEL_STAGE_LABEL[s.stage] ?? titleCase(s.stage),
      value: s.count,
      muted: empty,
      tone: empty ? ('muted' as const) : ('neutral' as const),
    }
  })
  const nfrStages = data.nfrPipeline.stages.map((s, i) => {
    const empty = i > 0 && s.count === 0
    return {
      label: titleCase(s.stage),
      value: s.count,
      muted: empty,
      tone: empty ? ('muted' as const) : ('neutral' as const),
    }
  })

  const missingFunction = stageDrop(
    data.functionalPipeline.stages,
    'REQUIREMENTS',
    'HAS_FUNCTION'
  )
  const missingUseCase =
    strip.functionsMissingUseCases ||
    stageDrop(data.functionalPipeline.stages, 'HAS_FUNCTION', 'HAS_USE_CASE')
  const missingTest =
    strip.useCasesMissingTests ||
    stageDrop(data.functionalPipeline.stages, 'HAS_USE_CASE', 'HAS_TEST')

  const nfrRoot = data.nfrPipeline.stages[0]?.count ?? 0
  const nfrEmpty = nfrRoot === 0 && data.nfrPipeline.stages.every((s) => s.count === 0)
  const functionalEmpty =
    strip.requirementsTotal === 0 ||
    (stageCount(data.functionalPipeline.stages, 'REQUIREMENTS') === 0 &&
      data.functionalPipeline.stages.slice(1).every((s) => s.count === 0))

  const nfrMissingRows = data.nfrPipeline.stages
    .slice(0, -1)
    .map((s, i) => {
      const next = data.nfrPipeline.stages[i + 1]
      if (!next) return null
      const drop = Math.max(0, s.count - next.count)
      if (drop <= 0) return null
      return {
        label: `Missing ${titleCase(next.stage)}`,
        count: drop,
      }
    })
    .filter(Boolean) as Array<{ label: string; count: number }>

  if (strip.nfrsNotVerified > 0 && !nfrMissingRows.some((r) => /verif/i.test(r.label))) {
    nfrMissingRows.push({ label: 'Unverified NFRs', count: strip.nfrsNotVerified })
  }

  const scrollToAttention = () => {
    document.getElementById('trace-needs-attention')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="space-y-4">
      <SummaryStrip
        items={[
          {
            id: 'mapped',
            label: 'Requirements Mapped',
            value: `${strip.requirementsMapped} / ${strip.requirementsTotal}`,
            status:
              strip.requirementsMapped > 0
                ? { label: 'Active', tone: 'success' }
                : { label: 'Empty', tone: 'muted' },
            onClick: () => onNavigate({ tab: 'functional', segment: 'requirements' }),
          },
          {
            id: 'functional-gaps',
            label: 'Functional Gaps',
            value: functionalGaps,
            status:
              functionalGaps > 0
                ? { label: 'Gap', tone: 'error' }
                : { label: 'OK', tone: 'success' },
            onClick: () =>
              onNavigate({
                tab: 'functional',
                segment:
                  strip.functionsMissingUseCases > 0
                    ? 'functions'
                    : strip.useCasesMissingTests > 0
                      ? 'use-cases'
                      : 'requirements',
                filter:
                  strip.functionsMissingUseCases > 0
                    ? 'MISSING_USE_CASE'
                    : strip.useCasesMissingTests > 0
                      ? 'MISSING_TEST'
                      : null,
              }),
          },
          {
            id: 'implementation-gaps',
            label: 'Implementation Gaps',
            value: strip.implementationGaps,
            status:
              strip.implementationGaps > 0
                ? { label: 'Gap', tone: 'warning' }
                : { label: 'OK', tone: 'success' },
            onClick: () => onNavigate({ tab: 'implementation' }),
          },
          {
            id: 'nfr-gaps',
            label: 'NFR Gaps',
            value: strip.nfrsNotVerified,
            status:
              strip.nfrsNotVerified > 0
                ? { label: 'Gap', tone: 'warning' }
                : { label: 'OK', tone: 'success' },
            onClick: () => onNavigate({ tab: 'nfr' }),
          },
          {
            id: 'needs-attention',
            label: 'Needs Attention',
            value: data.needsAttention.length,
            status:
              data.needsAttention.length > 0
                ? { label: 'Action', tone: 'error' }
                : { label: 'OK', tone: 'success' },
            onClick: scrollToAttention,
          },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card as="section" hasShadow={false}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5">
            <Typography weight="medium">Functional Pipeline</Typography>
            <NeutralButton
              outline
              onClick={() => onNavigate({ tab: 'functional', segment: 'requirements' })}
            >
              Open Functional
            </NeutralButton>
          </div>
          <div className="space-y-3 px-3 py-3">
            {functionalEmpty ? (
              <div className="space-y-2">
                <Typography variant="small" tone="muted">
                  No functional traceability data yet. Start by linking requirements to functions.
                </Typography>
                <NeutralButton
                  onClick={() => onNavigate({ tab: 'functional', segment: 'requirements' })}
                >
                  Link Functions to Requirements
                </NeutralButton>
              </div>
            ) : (
              <>
                <PipelineBar
                  stages={funcStages}
                  note="Downstream layers stay not evaluated until upstream coverage exists."
                />
                <ul className="space-y-1.5 text-sm text-neutral-700">
                  {missingFunction > 0 ? (
                    <li className="flex items-center justify-between gap-2">
                      <span>Missing Function</span>
                      <button
                        type="button"
                        className="font-semibold tabular-nums text-neutral-800 hover:underline"
                        onClick={() =>
                          onNavigate({
                            tab: 'functional',
                            segment: 'requirements',
                            filter: 'MISSING_FUNCTION',
                          })
                        }
                      >
                        {missingFunction}
                      </button>
                    </li>
                  ) : null}
                  {missingUseCase > 0 ? (
                    <li className="flex items-center justify-between gap-2">
                      <span>Missing Use Case</span>
                      <button
                        type="button"
                        className="font-semibold tabular-nums text-neutral-800 hover:underline"
                        onClick={() =>
                          onNavigate({
                            tab: 'functional',
                            segment: 'functions',
                            filter: 'MISSING_USE_CASE',
                          })
                        }
                      >
                        {missingUseCase}
                      </button>
                    </li>
                  ) : null}
                  {missingTest > 0 ? (
                    <li className="flex items-center justify-between gap-2">
                      <span>Missing Test</span>
                      <button
                        type="button"
                        className="font-semibold tabular-nums text-neutral-800 hover:underline"
                        onClick={() =>
                          onNavigate({
                            tab: 'functional',
                            segment: 'use-cases',
                            filter: 'MISSING_TEST',
                          })
                        }
                      >
                        {missingTest}
                      </button>
                    </li>
                  ) : null}
                  {missingFunction === 0 && missingUseCase === 0 && missingTest === 0 ? (
                    <li>
                      <Typography variant="small" tone="muted">
                        No functional stage gaps detected.
                      </Typography>
                    </li>
                  ) : null}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {missingUseCase > 0 ? (
                    <NeutralButton
                      onClick={() =>
                        onNavigate({
                          tab: 'functional',
                          segment: 'functions',
                          filter: 'MISSING_USE_CASE',
                        })
                      }
                    >
                      View Missing Use Cases
                    </NeutralButton>
                  ) : null}
                  {missingTest > 0 ? (
                    <NeutralButton
                      onClick={() =>
                        onNavigate({
                          tab: 'functional',
                          segment: 'use-cases',
                          filter: 'MISSING_TEST',
                        })
                      }
                    >
                      View Missing Tests
                    </NeutralButton>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card as="section" hasShadow={false}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5">
            <Typography weight="medium">NFR Pipeline</Typography>
            <NeutralButton outline onClick={() => onNavigate({ tab: 'nfr' })}>
              Open NFR
            </NeutralButton>
          </div>
          <div className="space-y-3 px-3 py-3">
            {nfrEmpty ? (
              <div className="space-y-2">
                <Typography variant="small" tone="muted">
                  No NFR verification setup yet. Add non-functional requirements or verification
                  cases to start tracking.
                </Typography>
                <NeutralButton onClick={() => onNavigate({ tab: 'nfr' })}>
                  Open NFR Verification
                </NeutralButton>
              </div>
            ) : (
              <>
                <PipelineBar stages={nfrStages} />
                <ul className="space-y-1.5 text-sm text-neutral-700">
                  {nfrMissingRows.length > 0 ? (
                    nfrMissingRows.map((row) => (
                      <li key={row.label} className="flex items-center justify-between gap-2">
                        <span>{row.label}</span>
                        <button
                          type="button"
                          className="font-semibold tabular-nums text-neutral-800 hover:underline"
                          onClick={() => onNavigate({ tab: 'nfr' })}
                        >
                          {row.count}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li>
                      <Typography variant="small" tone="muted">
                        No NFR stage gaps detected.
                      </Typography>
                    </li>
                  )}
                </ul>
                <NeutralButton onClick={() => onNavigate({ tab: 'nfr' })}>
                  Create Verification Case
                </NeutralButton>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card as="section" id="trace-needs-attention" hasShadow={false}>
        <div className="border-b border-neutral-200 px-3 py-2.5">
          <Typography weight="medium">Needs Attention</Typography>
          <Typography variant="caption" tone="muted">
            Highest-impact gaps to fix next
          </Typography>
        </div>
        {data.needsAttention.length === 0 ? (
          <div className="space-y-3 px-3 py-4">
            <div>
              <Typography weight="medium" className="text-sm">
                No critical gaps right now.
              </Typography>
              <Typography variant="small" tone="muted" className="mt-0.5">
                All tracked items are currently in good shape.
              </Typography>
            </div>
            <div className="flex flex-wrap gap-2">
              <NeutralButton
                outline
                onClick={() => onNavigate({ tab: 'functional', segment: 'requirements' })}
              >
                Open Functional
              </NeutralButton>
              <NeutralButton outline onClick={() => onNavigate({ tab: 'nfr' })}>
                Open NFR
              </NeutralButton>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {data.needsAttention.map((item) => {
              const scope = attentionScope(item.deepLinkTab)
              const count = parseCountFromMessage(item.message)
              return (
                <li
                  key={item.code}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        size="sm"
                        variant="solid"
                        tone={scope.tone}
                        className="border-0 text-white"
                      >
                        {scope.label}
                      </Badge>
                      {count != null ? (
                        <Typography variant="caption" tone="muted" className="tabular-nums">
                          {count} item{count === 1 ? '' : 's'}
                        </Typography>
                      ) : null}
                    </div>
                    <Typography variant="small">{item.message}</Typography>
                  </div>
                  <NeutralButton
                    outline
                    onClick={() =>
                      onNavigate({
                        tab: (item.deepLinkTab as TraceNavTab) || 'functional',
                        segment: (item.deepLinkSegment as FunctionalSegment) || undefined,
                        filter: item.deepLinkFilter,
                      })
                    }
                  >
                    {titleCase(item.actionLabel)}
                  </NeutralButton>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {showGetStarted ? (
        <Card as="section" hasShadow={false}>
          <div className="border-b border-neutral-200 px-3 py-2.5">
            <Typography weight="medium">Get Started</Typography>
            <Typography variant="caption" tone="muted">
              Set up the traceability chain so coverage becomes actionable
            </Typography>
          </div>
          <ul className="divide-y divide-neutral-100">
            {[
              {
                title: 'Link Requirements',
                description: 'Map requirements to functions',
                action: () => onNavigate({ tab: 'functional', segment: 'requirements' }),
              },
              {
                title: 'Add Use Cases',
                description: 'Complete the functional flow',
                action: () =>
                  onNavigate({
                    tab: 'functional',
                    segment: 'functions',
                    filter: 'MISSING_USE_CASE',
                  }),
              },
              {
                title: 'Add Test Coverage',
                description: 'Link test cases to use cases',
                action: () =>
                  onNavigate({
                    tab: 'functional',
                    segment: 'use-cases',
                    filter: 'MISSING_TEST',
                  }),
              },
              {
                title: 'Add NFR Verification',
                description: 'Add verification for NFRs',
                action: () => onNavigate({ tab: 'nfr' }),
              },
            ].map((row) => (
              <li
                key={row.title}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <Typography variant="small" weight="medium">
                    {row.title}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {row.description}
                  </Typography>
                </div>
                <NeutralButton onClick={row.action}>Start</NeutralButton>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
