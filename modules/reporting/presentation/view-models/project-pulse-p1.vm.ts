import type { ProjectDashboardSummary } from '../../domain/model/report'
import type {
  ActivityTimelineItem,
  AiProjectReviewInsight,
  AiReviewAction,
  AttentionItem,
  BaselineOverlayInsight,
  BurnupInsight,
  CapacityHeatmapInsight,
  CapacityInsight,
  ChangeSinceInsight,
  ProgressForecastInsight,
  PulsePeriodFilter,
  ScopeChangeInsight,
} from '../../domain/model/project-pulse'
import {
  asRecord,
  firstNum,
  firstStr,
  formatSignedDays,
  hasMeaningfulPayload,
  num,
  str,
} from './insight-field'

export interface PulseVisitSnapshot {
  visitedAt: string
  overdueTasks: number | null
  blockedTasks: number | null
  completedTasks: number | null
  changeRequests: number | null
  atRiskTasks: number | null
  peakUtilizationPercent: number | null
  forecastFinish: string | null
  scheduleVarianceDays: number | null
}

export function pulseVisitStorageKey(projectId: string): string {
  return `scopery.pulse.lastVisit.${projectId}`
}

export function readPulseVisitSnapshot(projectId: string): PulseVisitSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(pulseVisitStorageKey(projectId))
    if (!raw) return null
    return JSON.parse(raw) as PulseVisitSnapshot
  } catch {
    return null
  }
}

export function writePulseVisitSnapshot(projectId: string, snapshot: PulseVisitSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(pulseVisitStorageKey(projectId), JSON.stringify(snapshot))
  } catch {
    // ignore quota / private mode
  }
}

export function buildPulseVisitSnapshot(input: {
  dashboard: ProjectDashboardSummary | null
  capacity: CapacityInsight
  progress: ProgressForecastInsight
}): PulseVisitSnapshot {
  const risk = input.dashboard?.taskRisk
  return {
    visitedAt: new Date().toISOString(),
    overdueTasks: risk?.overdueTasks ?? null,
    blockedTasks: risk?.blockedTasks ?? null,
    completedTasks: risk?.completedTasks ?? null,
    changeRequests: input.dashboard?.changeRequests?.count ?? null,
    atRiskTasks: risk?.atRiskTasks ?? null,
    peakUtilizationPercent: input.capacity.peakUtilizationPercent,
    forecastFinish: input.progress.forecastFinish,
    scheduleVarianceDays: input.progress.scheduleVarianceDays,
  }
}

function periodCutoff(
  period: PulsePeriodFilter,
  lastVisitAt: string | null,
  baselineCreatedAt: string | null
): Date | null {
  const now = new Date()
  if (period === 'yesterday') {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'last_7_days') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return d
  }
  if (period === 'since_baseline' && baselineCreatedAt) {
    const d = new Date(baselineCreatedAt)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (period === 'last_visit' && lastVisitAt) {
    const d = new Date(lastVisitAt)
    return Number.isNaN(d.getTime()) ? null : d
  }
  // Fallback: last 7 days
  const d = new Date(now)
  d.setDate(d.getDate() - 7)
  return d
}

export function periodLabel(period: PulsePeriodFilter): string {
  switch (period) {
    case 'yesterday':
      return 'Since yesterday'
    case 'last_7_days':
      return 'Last 7 days'
    case 'since_baseline':
      return 'Since current baseline'
    case 'last_visit':
    default:
      return 'Since your last visit'
  }
}

function deltaText(
  label: string,
  before: number | null,
  after: number | null,
  suffix = ''
): string | null {
  if (before == null || after == null) return null
  const delta = after - before
  if (delta === 0) return null
  const sign = delta > 0 ? '+' : ''
  return `${label} ${sign}${delta}${suffix}`
}

export function adaptChangeSince(input: {
  period: PulsePeriodFilter
  lastVisit: PulseVisitSnapshot | null
  dashboard: ProjectDashboardSummary | null
  capacity: CapacityInsight
  progress: ProgressForecastInsight
  scopeChange: ScopeChangeInsight
  activity: ActivityTimelineItem[]
  links: { work: string; changeRequests: string; resources: string; schedule: string }
  baselineCreatedAt: string | null
}): ChangeSinceInsight {
  const items: ChangeSinceInsight['items'] = []
  const risk = input.dashboard?.taskRisk
  const last = input.lastVisit

  if (last) {
    const overdue = deltaText('Overdue tasks', last.overdueTasks, risk?.overdueTasks ?? null)
    const blocked = deltaText('Blocked tasks', last.blockedTasks, risk?.blockedTasks ?? null)
    const completed = deltaText(
      'Tasks completed',
      last.completedTasks,
      risk?.completedTasks ?? null
    )
    const crs = deltaText(
      'Open change requests',
      last.changeRequests,
      input.dashboard?.changeRequests?.count ?? null
    )
    const atRisk = deltaText('At-risk tasks', last.atRiskTasks, risk?.atRiskTasks ?? null)
    const capacity = deltaText(
      'QA/peak capacity',
      last.peakUtilizationPercent != null ? Math.round(last.peakUtilizationPercent) : null,
      input.capacity.peakUtilizationPercent != null
        ? Math.round(input.capacity.peakUtilizationPercent)
        : null,
      '%'
    )
    const schedule =
      last.scheduleVarianceDays != null &&
      input.progress.scheduleVarianceDays != null &&
      last.scheduleVarianceDays !== input.progress.scheduleVarianceDays
        ? `Forecast variance moved to ${formatSignedDays(input.progress.scheduleVarianceDays)}`
        : last.forecastFinish &&
            input.progress.forecastFinish &&
            last.forecastFinish !== input.progress.forecastFinish
          ? `Forecast finish moved to ${input.progress.forecastFinish}`
          : null

    ;[
      { text: overdue, href: input.links.work },
      { text: blocked, href: input.links.work },
      { text: completed, href: input.links.work },
      { text: atRisk, href: input.links.work },
      { text: crs, href: input.links.changeRequests },
      { text: capacity, href: input.links.resources },
      { text: schedule, href: input.links.schedule },
    ].forEach((row, index) => {
      if (row.text) {
        items.push({ id: `delta-${index}`, text: row.text, href: row.href })
      }
    })
  }

  const cutoff = periodCutoff(
    input.period,
    last?.visitedAt ?? null,
    input.baselineCreatedAt
  )
  input.activity.forEach((event) => {
    if (!event.createdAt || !cutoff) return
    const at = new Date(event.createdAt)
    if (Number.isNaN(at.getTime()) || at < cutoff) return
    if (items.some((i) => i.text === event.summary)) return
    items.push({
      id: `act-${event.id}`,
      text: event.summary,
      href: event.href,
    })
  })

  if (
    items.length === 0 &&
    (input.scopeChange.changeRequestCount ?? 0) > 0 &&
    input.period !== 'last_visit'
  ) {
    items.push({
      id: 'cr-open',
      text: `${input.scopeChange.changeRequestCount} open change request(s)`,
      href: input.links.changeRequests,
    })
  }

  return {
    available: items.length > 0 || Boolean(last),
    periodLabel: periodLabel(input.period),
    items: items.slice(0, 8),
  }
}

export function filterActivityByPeriod(
  activity: ActivityTimelineItem[],
  period: PulsePeriodFilter,
  lastVisitAt: string | null,
  baselineCreatedAt: string | null
): ActivityTimelineItem[] {
  const cutoff = periodCutoff(period, lastVisitAt, baselineCreatedAt)
  if (!cutoff) return activity
  return activity.filter((item) => {
    if (!item.createdAt) return true
    const at = new Date(item.createdAt)
    if (Number.isNaN(at.getTime())) return true
    return at >= cutoff
  })
}

export function adaptCapacityHeatmap(
  reports: Record<string, Record<string, unknown>>,
  capacity: CapacityInsight
): CapacityHeatmapInsight {
  const raw = asRecord(reports.capacity)
  const weeksRaw = raw.weeks ?? raw.weekLabels ?? raw.periods
  let weeks: string[] = Array.isArray(weeksRaw)
    ? weeksRaw.map((w, i) => {
        if (typeof w === 'string') return w
        const row = asRecord(w)
        return firstStr(row, ['label', 'week', 'period', 'name']) ?? `W${i + 1}`
      })
    : []

  const matrix = raw.heatmap ?? raw.matrix ?? raw.byTeam ?? raw.teams ?? raw.resources
  const rows: CapacityHeatmapInsight['rows'] = []

  if (Array.isArray(matrix)) {
    matrix.slice(0, 6).forEach((row) => {
      const item = asRecord(row)
      const label = firstStr(item, ['name', 'team', 'role', 'label']) ?? 'Team'
      const cellsRaw = item.cells ?? item.weeks ?? item.periods ?? item.values
      const cells: CapacityHeatmapInsight['rows'][0]['cells'] = []
      if (Array.isArray(cellsRaw)) {
        cellsRaw.forEach((cell, index) => {
          if (typeof cell === 'number') {
            cells.push({
              week: weeks[index] ?? `W${index + 1}`,
              utilizationPercent: cell,
            })
          } else {
            const c = asRecord(cell)
            cells.push({
              week:
                firstStr(c, ['week', 'label', 'period']) ?? weeks[index] ?? `W${index + 1}`,
              utilizationPercent: firstNum(c, [
                'utilizationPercent',
                'allocationPercent',
                'percent',
                'value',
              ]),
            })
          }
        })
      } else {
        const util = firstNum(item, ['utilizationPercent', 'allocationPercent', 'percent'])
        ;['W1', 'W2', 'W3', 'W4'].forEach((week, index) => {
          cells.push({
            week,
            utilizationPercent:
              util != null ? Math.max(40, Math.min(140, util + (index - 1) * 6)) : null,
          })
        })
      }
      rows.push({ label, cells })
    })
  }

  if (rows.length === 0 && capacity.rows.length > 0) {
    weeks = ['W1', 'W2', 'W3', 'W4']
    capacity.rows.slice(0, 4).forEach((row) => {
      const match = row.detail.match(/(\d+)/)
      const util = match ? Number(match[1]) : capacity.peakUtilizationPercent
      rows.push({
        label: row.label,
        cells: weeks.map((week, index) => ({
          week,
          utilizationPercent:
            util != null ? Math.max(35, Math.min(140, util + (index - 1) * 5)) : null,
        })),
      })
    })
  }

  if (weeks.length === 0 && rows[0]) {
    weeks = rows[0].cells.map((c) => c.week)
  }

  return {
    available: rows.length > 0,
    weeks,
    rows,
    summary: capacity.summary,
  }
}

export function adaptBurnup(
  reports: Record<string, Record<string, unknown>>,
  progress: ProgressForecastInsight
): BurnupInsight {
  const baseline = asRecord(reports['baseline-vs-current'])
  const series = baseline.burnup ?? baseline.series ?? baseline.points
  const points: BurnupInsight['points'] = []

  if (Array.isArray(series)) {
    series.slice(0, 8).forEach((point, index) => {
      const row = asRecord(point)
      points.push({
        label: firstStr(row, ['label', 'period', 'week', 'date']) ?? `P${index + 1}`,
        plannedPercent: firstNum(row, ['plannedPercent', 'planned', 'baseline']),
        completedPercent: firstNum(row, ['completedPercent', 'completed', 'actual', 'current']),
      })
    })
  }

  if (points.length === 0 && progress.available) {
    const planned = progress.plannedPercent
    const completed = progress.completedPercent
    points.push(
      { label: 'Start', plannedPercent: 0, completedPercent: 0 },
      {
        label: 'Mid',
        plannedPercent: planned != null ? Math.max(0, planned - 12) : 25,
        completedPercent: completed != null ? Math.max(0, completed - 10) : 20,
      },
      {
        label: 'Today',
        plannedPercent: planned,
        completedPercent: completed,
      }
    )
  }

  return {
    available: points.some((p) => p.plannedPercent != null || p.completedPercent != null),
    points,
    summary: progress.summary,
  }
}

export function adaptBaselineOverlay(
  reports: Record<string, Record<string, unknown>>,
  progress: ProgressForecastInsight,
  baselineName: string | null
): BaselineOverlayInsight {
  const baseline = asRecord(reports['baseline-vs-current'])
  const schedule = asRecord(reports['schedule-risk'])
  const itemsRaw =
    baseline.items ??
    baseline.phases ??
    baseline.tasks ??
    baseline.overlays ??
    schedule.milestones

  const bars: BaselineOverlayInsight['bars'] = []

  if (Array.isArray(itemsRaw)) {
    itemsRaw.slice(0, 6).forEach((row, index) => {
      const item = asRecord(row)
      const label =
        firstStr(item, ['name', 'label', 'title', 'phase', 'task']) ?? `Item ${index + 1}`
      const baselineRange = [
        firstStr(item, ['baselineStart', 'baselineStartDate']),
        firstStr(item, ['baselineFinish', 'baselineEndDate']),
      ]
        .filter(Boolean)
        .join(' – ')
      const currentRange = [
        firstStr(item, ['currentStart', 'startDate']),
        firstStr(item, ['currentFinish', 'endDate', 'forecastFinish']),
      ]
        .filter(Boolean)
        .join(' – ')
      const baselineLabel =
        firstStr(item, ['baselineRange', 'baselineLabel', 'baselineDates']) ||
        baselineRange ||
        'Baseline'
      const currentLabel =
        firstStr(item, ['currentRange', 'currentLabel', 'currentDates']) ||
        currentRange ||
        'Current'
      const deltaDays = firstNum(item, ['deltaDays', 'varianceDays', 'slipDays'])
      const status = (firstStr(item, ['status', 'tone', 'changeType']) ?? '').toUpperCase()
      let tone: BaselineOverlayInsight['bars'][0]['tone'] = 'neutral'
      if (status.includes('NEW')) tone = 'new'
      else if (status.includes('REMOVE')) tone = 'removed'
      else if (deltaDays != null && deltaDays > 0) tone = 'delayed'
      else if (deltaDays != null && deltaDays < 0) tone = 'improved'

      const baselineWidth = firstNum(item, ['baselineWidthPercent']) ?? 55 + (index % 3) * 8
      const currentWidth =
        firstNum(item, ['currentWidthPercent']) ??
        Math.min(100, baselineWidth + (deltaDays != null ? deltaDays * 2 : 8))
      const baselineOffset = firstNum(item, ['baselineOffsetPercent']) ?? 8 + index * 2
      const currentOffset =
        firstNum(item, ['currentOffsetPercent']) ??
        baselineOffset + (deltaDays != null && deltaDays > 0 ? 4 : 0)

      bars.push({
        id: firstStr(item, ['id']) ?? `overlay-${index}`,
        label,
        baselineLabel,
        currentLabel,
        deltaLabel: formatSignedDays(deltaDays),
        tone,
        baselineWidthPercent: baselineWidth,
        currentWidthPercent: currentWidth,
        baselineOffsetPercent: baselineOffset,
        currentOffsetPercent: currentOffset,
      })
    })
  }

  if (bars.length === 0 && progress.available) {
    bars.push({
      id: 'project-finish',
      label: 'Project finish',
      baselineLabel: progress.baselineFinish ?? 'Baseline',
      currentLabel: progress.forecastFinish ?? 'Current',
      deltaLabel: formatSignedDays(progress.scheduleVarianceDays),
      tone:
        progress.scheduleVarianceDays != null && progress.scheduleVarianceDays > 0
          ? 'delayed'
          : progress.scheduleVarianceDays != null && progress.scheduleVarianceDays < 0
            ? 'improved'
            : 'neutral',
      baselineWidthPercent: 70,
      currentWidthPercent: Math.min(
        100,
        70 + Math.abs(progress.scheduleVarianceDays ?? 6) * 2
      ),
      baselineOffsetPercent: 10,
      currentOffsetPercent: 10 + Math.max(0, progress.scheduleVarianceDays ?? 0),
    })
  }

  return {
    available: bars.length > 0,
    baselineName,
    bars,
    summary:
      bars.length > 0
        ? `${bars.length} schedule comparison${bars.length === 1 ? '' : 's'}`
        : 'Baseline overlay unlocks after a baseline comparison is available.',
  }
}

export function adaptAiProjectReview(input: {
  narrative: string
  drivers: string[]
  attention: AttentionItem[]
  recommendations: Array<{
    id: string
    title: string
    summary?: string | null
    suggestionRef?: string
  }>
  aiPlanning: Record<string, unknown> | undefined
  links: { recommendations: string; work: string; resources: string; changeRequests: string }
}): AiProjectReviewInsight {
  const actions: AiReviewAction[] = []

  input.recommendations.slice(0, 5).forEach((rec, index) => {
    actions.push({
      id: rec.suggestionRef ?? rec.id,
      title: rec.title,
      detail: rec.summary ?? 'Suggested by AI — review before applying.',
      href: input.links.recommendations,
      suggestionRef: rec.suggestionRef ?? rec.id,
      defaultSelected: index < 3,
    })
  })

  const planning = asRecord(input.aiPlanning)
  const planningActions = planning.suggestions ?? planning.actions ?? planning.items
  if (Array.isArray(planningActions)) {
    planningActions.slice(0, 4).forEach((row, index) => {
      const item = asRecord(row)
      const title = firstStr(item, ['title', 'label', 'summary', 'action'])
      if (!title) return
      const id = firstStr(item, ['id']) ?? `plan-${index}`
      if (actions.some((a) => a.title === title)) return
      actions.push({
        id,
        title,
        detail: firstStr(item, ['detail', 'description', 'reason']) ?? 'AI planning suggestion.',
        href: input.links.recommendations,
        suggestionRef: null,
        defaultSelected: index < 2,
      })
    })
  }

  if (actions.length === 0) {
    input.attention.slice(0, 4).forEach((item, index) => {
      actions.push({
        id: `attn-${item.id}`,
        title: item.title,
        detail: item.impact,
        href: item.href,
        suggestionRef: null,
        defaultSelected: index < 3,
      })
    })
  }

  const why =
    input.drivers.length > 0
      ? input.drivers.slice(0, 4)
      : input.attention.slice(0, 3).map((a) => a.title)

  return {
    available: Boolean(input.narrative) || actions.length > 0 || why.length > 0,
    overall: input.narrative,
    why,
    actions,
  }
}

export function utilizationCellClass(percent: number | null): string {
  if (percent == null) return 'bg-neutral-100 text-neutral-500'
  if (percent >= 110) return 'bg-error/20 text-error'
  if (percent >= 95) return 'bg-warning/20 text-warning'
  if (percent >= 70) return 'bg-success/15 text-neutral-800'
  return 'bg-neutral-100 text-neutral-700'
}

export { hasMeaningfulPayload, num, str }
