'use client'

import { useParams } from 'next/navigation'
import { PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useProjectDashboard } from '../hooks/useProjectDashboard'
import { ProjectAttentionQueue } from './pulse/ProjectAttentionQueue'
import { ProjectActivityTimeline } from './pulse/ProjectActivityTimeline'
import { ProjectExecutiveBrief, ProjectPulseHeader } from './pulse/ProjectExecutiveBrief'
import { ProjectProgressForecast } from './pulse/ProjectProgressForecast'
import { DashboardInsightGrid } from './pulse/DashboardInsightGrid'
import { DashboardFilters } from './pulse/DashboardFilters'
import { ProjectChangeSinceLastVisit } from './pulse/ProjectChangeSinceLastVisit'
import {
  BaselineOverlayWidget,
  BurnupChartWidget,
  CapacityHeatmapWidget,
} from './pulse/ProjectPulseCharts'
import { AiProjectReviewWidget } from './pulse/AiProjectReviewWidget'
import { ProjectSetupMode } from './pulse/ProjectSetupMode'

export function ProjectDashboardView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const { pulse, loading, error, refetch, filters, reviewSelectedSuggestions } =
    useProjectDashboard(workspaceId, projectId)

  if (loading && !pulse) return <PageSkeleton variant="cards" className="p-lg" />
  if (error && !pulse) return <Typography tone="error">{error}</Typography>
  if (!pulse) {
    return (
      <Typography tone="muted" className="p-lg">
        Project Pulse is unavailable for this project.
      </Typography>
    )
  }

  const setupMode = pulse.setup.show

  return (
    <div className="min-h-full bg-neutral-50 px-3 py-3 lg:px-4 lg:py-3">
      <Stack direction="vertical" spacing="md">
        <ProjectPulseHeader
          brief={pulse.brief}
          onRefresh={() => void refetch()}
          refreshing={loading}
        />

        {setupMode ? (
          <ProjectSetupMode
            setup={pulse.setup}
            attention={pulse.attention}
            activity={pulse.activity}
          />
        ) : (
          <>
            <DashboardFilters
              period={filters.period}
              onPeriodChange={filters.setPeriod}
              phase={phasesafe(filters.phase, filters.phaseOptions)}
              onPhaseChange={filters.setPhase}
              phaseOptions={filters.phaseOptions}
              baseline={filters.baseline}
              onBaselineChange={filters.setBaseline}
              baselineOptions={filters.baselineOptions}
            />

            <ProjectExecutiveBrief brief={pulse.brief} />

            <ProjectChangeSinceLastVisit insight={pulse.changeSince} />

            <div className="grid grid-cols-1 gap-md xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
              <ProjectAttentionQueue items={pulse.attention} />
              <ProjectProgressForecast
                progress={pulse.progress}
                scheduleHref={pulse.links.schedule}
              />
            </div>

            <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
              <BaselineOverlayWidget insight={pulse.baselineOverlay} href={pulse.links.schedule} />
              <BurnupChartWidget insight={pulse.burnup} />
            </div>

            <CapacityHeatmapWidget insight={pulse.capacityHeatmap} href={pulse.links.resources} />

            <DashboardInsightGrid
              schedule={pulse.schedule}
              capacity={pulse.capacity}
              scopeChange={pulse.scopeChange}
              quality={pulse.quality}
              financials={pulse.financials}
              risks={pulse.risks}
              hrefs={pulse.links}
            />

            <AiProjectReviewWidget
              insight={pulse.aiReview}
              onReviewSelected={(ids) => void reviewSelectedSuggestions(ids)}
            />

            <ProjectActivityTimeline items={pulse.activity} />
          </>
        )}
      </Stack>
    </div>
  )
}

function phasesafe(phase: string, options: Array<{ value: string }>): string {
  return options.some((o) => o.value === phase) ? phase : 'all'
}
