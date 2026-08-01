'use client'

import { Button, PageSkeleton, Typography } from '@/shared/ui'
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

export function TraceabilityOverviewView({ projectId, onNavigate }: TraceabilityOverviewViewProps) {
  const { data, loading, error, refetch } = useTraceabilityOverview(projectId)

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

  const strip = data.strip
  type PipelineTone = 'neutral' | 'error' | 'warning' | 'muted' | 'success' | 'info'
  const funcStages = data.functionalPipeline.stages.map((s, i) => {
    const tone: PipelineTone = i > 0 && s.count === 0 ? 'muted' : 'neutral'
    return {
      label: FUNNEL_STAGE_LABEL[s.stage] ?? s.stage,
      value: s.count,
      muted: i > 0 && s.count === 0,
      tone,
    }
  })
  const nfrStages = data.nfrPipeline.stages.map((s, i) => ({
    label: s.stage.replace(/_/g, ' '),
    value: s.count,
    muted: i > 0 && s.count === 0,
  }))

  return (
    <div className="space-y-4">
      <SummaryStrip
        items={[
          {
            label: 'Requirements mapped',
            value: `${strip.requirementsMapped}/${strip.requirementsTotal}`,
          },
          {
            label: 'Functions missing UCs',
            value: strip.functionsMissingUseCases,
            tone: strip.functionsMissingUseCases > 0 ? 'error' : 'default',
          },
          {
            label: 'UCs missing tests',
            value: strip.useCasesMissingTests,
            tone: strip.useCasesMissingTests > 0 ? 'warning' : 'default',
          },
          {
            label: 'Implementation gaps',
            value: strip.implementationGaps,
            tone: strip.implementationGaps > 0 ? 'warning' : 'default',
          },
          {
            label: 'NFRs not verified',
            value: strip.nfrsNotVerified,
            tone: strip.nfrsNotVerified > 0 ? 'warning' : 'default',
          },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <Typography variant="small" weight="medium" className="mb-2">
            Functional pipeline
          </Typography>
          <PipelineBar
            stages={funcStages}
            note="Downstream layers stay Not evaluated until upstream coverage exists."
          />
          <Button
            className="mt-2"
            size="sm"
            variant="ghost"
            onClick={() => onNavigate({ tab: 'functional', segment: 'requirements' })}
          >
            Open Functional Coverage
          </Button>
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-2">
            NFR pipeline
          </Typography>
          <PipelineBar stages={nfrStages} />
          <Button
            className="mt-2"
            size="sm"
            variant="ghost"
            onClick={() => onNavigate({ tab: 'nfr' })}
          >
            Open NFR Verification
          </Button>
        </div>
      </div>

      <div className="border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-3 py-2">
          <Typography weight="medium">Needs attention</Typography>
        </div>
        {data.needsAttention.length === 0 ? (
          <Typography variant="small" tone="muted" className="px-3 py-4">
            No critical gaps right now.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {data.needsAttention.map((item) => (
              <li
                key={item.code}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
              >
                <Typography variant="small">{item.message}</Typography>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onNavigate({
                      tab: (item.deepLinkTab as TraceNavTab) || 'functional',
                      segment: (item.deepLinkSegment as FunctionalSegment) || undefined,
                      filter: item.deepLinkFilter,
                    })
                  }
                >
                  {item.actionLabel}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
