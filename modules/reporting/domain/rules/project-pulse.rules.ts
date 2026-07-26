import {
  ProjectHealthStatus,
  type ProjectHealthStatus as Health,
} from '../enums/project-health.enum'
import type { ProjectDashboardSummary } from '../model/report'
import type { ProjectSetupChecklist, ProjectSetupStep } from '../model/project-pulse'

const HEALTH_LABELS: Record<Health, string> = {
  [ProjectHealthStatus.OnTrack]: 'On track',
  [ProjectHealthStatus.NeedsAttention]: 'Needs attention',
  [ProjectHealthStatus.AtRisk]: 'At risk',
  [ProjectHealthStatus.OffTrack]: 'Off track',
  [ProjectHealthStatus.InsufficientData]: 'Insufficient data',
}

export function normalizeProjectHealthStatus(raw?: string | null): Health {
  if (!raw) return ProjectHealthStatus.InsufficientData
  const value = raw.trim().toUpperCase().replace(/\s+/g, '_')
  switch (value) {
    case 'ON_TRACK':
    case 'HEALTHY':
    case 'GREEN':
    case 'GOOD':
      return ProjectHealthStatus.OnTrack
    case 'NEEDS_ATTENTION':
    case 'WATCH':
    case 'AMBER':
    case 'YELLOW':
      return ProjectHealthStatus.NeedsAttention
    case 'AT_RISK':
    case 'RISK':
    case 'ORANGE':
      return ProjectHealthStatus.AtRisk
    case 'OFF_TRACK':
    case 'CRITICAL':
    case 'RED':
    case 'BLOCKED':
      return ProjectHealthStatus.OffTrack
    case 'UNKNOWN':
    case 'INSUFFICIENT_DATA':
    case 'N/A':
    case 'NA':
    default:
      return ProjectHealthStatus.InsufficientData
  }
}

export function projectHealthLabel(status: Health): string {
  return HEALTH_LABELS[status]
}

export function healthBadgeTone(
  status: Health
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case ProjectHealthStatus.OnTrack:
      return 'success'
    case ProjectHealthStatus.NeedsAttention:
      return 'warning'
    case ProjectHealthStatus.AtRisk:
    case ProjectHealthStatus.OffTrack:
      return 'error'
    case ProjectHealthStatus.InsufficientData:
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function buildProjectSetupChecklist(input: {
  data: ProjectDashboardSummary | null
  hasScheduleData: boolean
  hasCapacityData: boolean
  hasEstimationData: boolean
  activityCount: number
  routes: {
    overview: string
    wbs: string
    work: string
    estimation: string
    resources: string
    schedule: string
    baselines: string
    changeRequests: string
  }
}): ProjectSetupChecklist {
  const risk = input.data?.taskRisk
  const totalTasks = risk?.totalTasks ?? 0
  const hasTasks = totalTasks > 0
  const hasBaseline = Boolean(input.data?.baseline?.hasCurrentBaseline)
  const missingEstimates = risk?.tasksWithoutEstimate ?? 0
  const hasEstimates =
    input.hasEstimationData || (hasTasks && missingEstimates < totalTasks)
  const crCount = input.data?.changeRequests?.count ?? 0

  const steps: ProjectSetupStep[] = [
    {
      id: 'project',
      label: 'Project created',
      description: 'Project shell is ready.',
      actionLabel: 'Open overview',
      done: Boolean(input.data?.project?.id),
      href: input.routes.overview,
    },
    {
      id: 'phases',
      label: 'Create project phases / WBS',
      description: 'Structure unlocks planning and schedule views.',
      actionLabel: 'Open WBS',
      done: hasTasks || input.hasScheduleData,
      href: input.routes.wbs,
    },
    {
      id: 'tasks',
      label: 'Add project tasks',
      description: 'Tasks are required for progress and schedule insights.',
      actionLabel: 'Add tasks',
      done: hasTasks,
      href: input.routes.work,
    },
    {
      id: 'estimates',
      label: 'Add estimates',
      description: 'Estimates unlock effort and capacity forecasting.',
      actionLabel: 'Open estimation',
      done: hasEstimates,
      href: input.routes.estimation,
    },
    {
      id: 'capacity',
      label: 'Configure team capacity',
      description: 'Capacity unlocks workload and overload signals.',
      actionLabel: 'Configure capacity',
      done: input.hasCapacityData,
      href: input.routes.resources,
    },
    {
      id: 'baseline',
      label: 'Create the first baseline',
      description: 'A baseline enables plan-versus-current comparison.',
      actionLabel: 'Create baseline',
      done: hasBaseline,
      href: input.routes.baselines,
    },
    {
      id: 'schedule',
      label: 'Run the project schedule',
      description: 'Schedule unlocks forecast finish and milestone health.',
      actionLabel: 'Open schedule',
      done: input.hasScheduleData,
      href: input.routes.schedule,
    },
  ]

  // Insight Mode requires tasks + baseline at minimum; otherwise stay in Setup Mode.
  const show = !hasTasks || !hasBaseline

  const availableNow: ProjectSetupChecklist['availableNow'] = []
  if (crCount > 0) {
    availableNow.push({
      label: 'Open Change Requests',
      value: String(crCount),
      href: input.routes.changeRequests,
    })
  }
  if (input.activityCount > 0) {
    availableNow.push({
      label: 'Recent Project Activity',
      value: `${input.activityCount} event${input.activityCount === 1 ? '' : 's'}`,
      href: null,
    })
  }
  if (hasTasks) {
    availableNow.push({
      label: 'Tasks',
      value: String(totalTasks),
      href: input.routes.work,
    })
  }

  const unlockNext: string[] = []
  if (!hasTasks) unlockNext.push('Progress forecast')
  if (!hasBaseline) unlockNext.push('Baseline variance')
  if (!input.hasScheduleData) unlockNext.push('Schedule health')
  if (!input.hasCapacityData) unlockNext.push('Capacity')
  unlockNext.push('Quality coverage')
  if (!input.data?.finance?.available) unlockNext.push('Financial outlook')

  const waitingFor = unlockNext.slice()

  return {
    show,
    title: 'Complete project setup',
    description:
      'Project health will become available after tasks and the first baseline are created.',
    steps,
    availableNow,
    waitingFor,
    unlockNext: Array.from(new Set(unlockNext)).slice(0, 5),
  }
}
