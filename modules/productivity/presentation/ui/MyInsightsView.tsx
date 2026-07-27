'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Flame } from 'lucide-react'
import { Button, Checkbox, Select, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { MyInsightsWorkChip } from '../../domain/enums/my-insights.enum'
import type {
  MyInsightsDistributionSlice,
  MyInsightsHeatmapDay,
  MyInsightsResponse,
  MyInsightsTaskRow,
  MyInsightsTrendPoint,
} from '../../domain/model/my-insights'
import { useMyInsights } from '../hooks/useMyInsights'
import { InsightWidgetShell } from './my-insights/InsightWidgetShell'
import { PhaseWatchWidget, useProjects } from '@/modules/projects'

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'this_year', label: 'This year' },
]

const WORK_CHIPS: { value: string; label: string }[] = [
  { value: MyInsightsWorkChip.AllOpen, label: 'All open' },
  { value: MyInsightsWorkChip.NotStarted, label: 'Not started' },
  { value: MyInsightsWorkChip.DueThisWeek, label: 'Due this week' },
  { value: MyInsightsWorkChip.Unscheduled, label: 'Unscheduled' },
  { value: MyInsightsWorkChip.Blocked, label: 'Blocked' },
  { value: MyInsightsWorkChip.Overdue, label: 'Overdue' },
]

/** My Insights palette: primary-gradient · blue-400 · sky-600 · emerald-500 · red-700 */
const HEAT_LEVEL: Record<number, string> = {
  0: 'bg-neutral-100',
  1: 'bg-blue-400/35',
  2: 'bg-blue-400',
  3: 'bg-sky-600',
  4: 'bg-emerald-500',
}

function formatDateLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function todayIsoDate() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Monday–Sunday calendar week containing `iso` (local date). */
function calendarWeekRange(iso: string): { weekStart: string; weekEnd: string } {
  const d = new Date(`${iso}T12:00:00`)
  const mondayOffset = (d.getDay() + 6) % 7
  const weekStart = addDaysIso(iso, -mondayOffset)
  return { weekStart, weekEnd: addDaysIso(weekStart, 6) }
}

/** Matches My Work THIS_WEEK window rules (due / planned / span overlap).
 * Uses calendar Mon–Sun ∪ rolling next 7 days so Sunday still surfaces mid-next-week dues.
 */
function isInDueThisWeekWindow(
  t: MyInsightsTaskRow,
  weekStart: string,
  weekEnd: string,
  today: string,
  rollingEnd: string
): boolean {
  const due = t.dueDate
  const start = t.plannedStartDate
  const inRange = (from: string, to: string) => {
    if (due && due >= from && due <= to) return true
    if (start && start >= from && start <= to) return true
    if (start && due && start <= to && due >= from) return true
    return false
  }
  return inRange(weekStart, weekEnd) || inRange(today, rollingEnd)
}

function statusBadgeClass(status: string) {
  if (status === 'BLOCKED') return 'bg-sky-600 text-white'
  if (status === 'DONE' || status === 'COMPLETED') return 'bg-emerald-500 text-white'
  if (status === 'IN_PROGRESS') return 'bg-blue-400 text-white'
  if (status === 'TODO') return 'bg-neutral-700 text-white'
  return 'bg-neutral-600 text-white'
}

function chipBadgeClass(chip: 'overdue' | 'blocked') {
  if (chip === 'overdue') return 'bg-neutral-200 text-neutral-900'
  return 'bg-sky-600 text-white'
}

function filterTasks(tasks: MyInsightsTaskRow[], chip: string | null, attention: string | null) {
  const today = todayIsoDate()
  const { weekStart, weekEnd } = calendarWeekRange(today)
  const rollingEnd = addDaysIso(today, 6)

  return tasks.filter((t) => {
    const status = (t.status || '').toUpperCase()
    if (attention) {
      if (attention === 'overdue') return t.chips.includes('overdue')
      if (attention === 'blocked') return t.chips.includes('blocked')
      if (attention === 'unscheduled') return t.chips.includes('unscheduled')
      if (attention === 'missing_estimate') return t.estimateHours == null
      if (attention === 'no_due_date') return t.dueDate == null
    }
    if (!chip || chip === MyInsightsWorkChip.AllOpen) return true
    if (chip === MyInsightsWorkChip.DueThisWeek) {
      return isInDueThisWeekWindow(t, weekStart, weekEnd, today, rollingEnd)
    }
    if (chip === MyInsightsWorkChip.NotStarted) {
      return status === 'TODO' || status === 'NOT_STARTED' || status === 'OPEN'
    }
    if (chip === MyInsightsWorkChip.Unscheduled) return t.chips.includes('unscheduled')
    if (chip === MyInsightsWorkChip.Blocked) return t.chips.includes('blocked') || status === 'BLOCKED'
    if (chip === MyInsightsWorkChip.Overdue) return t.chips.includes('overdue')
    return true
  })
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Monday = 0 … Sunday = 6 */
function mondayBasedDow(date: Date) {
  return (date.getDay() + 6) % 7
}

function Heatmap({
  days,
  onSelect,
}: {
  days: MyInsightsHeatmapDay[]
  onSelect: (day: MyInsightsHeatmapDay) => void
}) {
  const { weeks, monthLabels } = useMemo(() => {
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
    const cols: MyInsightsHeatmapDay[][] = []
    let col: MyInsightsHeatmapDay[] = []

    for (const day of sorted) {
      const d = new Date(`${day.date}T12:00:00`)
      const dow = mondayBasedDow(d)
      if (col.length === 0 && dow !== 0) {
        for (let i = 0; i < dow; i++) {
          col.push({
            ...day,
            date: `pad-${i}`,
            level: 0,
            completedTasks: 0,
            completedEffortHours: 0,
            overdueResolved: 0,
            projectCount: 0,
          })
        }
      }
      col.push(day)
      if (col.length === 7) {
        cols.push(col)
        col = []
      }
    }
    if (col.length) {
      while (col.length < 7) {
        col.push({
          date: `pad-end-${col.length}`,
          level: 0,
          completedTasks: 0,
          completedEffortHours: 0,
          overdueResolved: 0,
          projectCount: 0,
        })
      }
      cols.push(col)
    }

    const visible = cols.slice(-53)
    const labels: Array<{ weekIndex: number; label: string }> = []
    let lastMonth = -1
    visible.forEach((week, wi) => {
      const real = week.find((c) => !c.date.startsWith('pad-'))
      if (!real) return
      const month = new Date(`${real.date}T12:00:00`).getMonth()
      if (month !== lastMonth) {
        labels.push({ weekIndex: wi, label: MONTH_SHORT[month]! })
        lastMonth = month
      }
    })

    return { weeks: visible, monthLabels: labels }
  }, [days])

  const cell = 11
  const gap = 3
  const dayLabelWidth = 28
  const monthRowHeight = 16

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="relative mb-1" style={{ height: monthRowHeight, marginLeft: dayLabelWidth }}>
          {monthLabels.map((m) => (
            <Typography
              key={`${m.label}-${m.weekIndex}`}
              as="span"
              variant="small"
              tone="muted"
              className="absolute top-0 text-[10px] leading-none"
              style={{ left: m.weekIndex * (cell + gap) }}
            >
              {m.label}
            </Typography>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {/* Weekday labels */}
          <div
            className="flex shrink-0 flex-col gap-[3px]"
            style={{ width: dayLabelWidth }}
            aria-hidden
          >
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="flex items-center"
                style={{ height: cell }}
              >
                <Typography as="span" variant="small" tone="muted" className="text-[10px] leading-none">
                  {label}
                </Typography>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="inline-flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  const pad = day.date.startsWith('pad-')
                  return (
                    <button
                      key={`${day.date}-${di}`}
                      type="button"
                      disabled={pad || (day.level === 0 && day.completedTasks === 0)}
                      title={
                        pad
                          ? undefined
                          : `${formatDateLabel(day.date)} · ${day.completedTasks} tasks · ${day.completedEffortHours}h`
                      }
                      onClick={() => !pad && onSelect(day)}
                      className={cn(
                        'rounded-none border-0 p-0',
                        pad ? 'bg-transparent' : HEAT_LEVEL[day.level] ?? 'bg-neutral-100',
                        !pad && 'hover:ring-1 hover:ring-neutral-400'
                      )}
                      style={{ width: cell, height: cell }}
                      aria-label={pad ? undefined : `Activity on ${day.date}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-neutral-500" style={{ marginLeft: dayLabelWidth }}>
          <Typography as="span" variant="small" tone="muted">
            Less
          </Typography>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className={cn('inline-block', HEAT_LEVEL[l])}
              style={{ width: cell, height: cell }}
            />
          ))}
          <Typography as="span" variant="small" tone="muted">
            More
          </Typography>
        </div>
      </div>
    </div>
  )
}

function PlannedCompletedChart({ points }: { points: MyInsightsTrendPoint[] }) {
  const max = Math.max(...points.map((p) => Math.max(p.plannedHours, p.completedHours)), 1)
  const w = 360
  const h = 160
  const pad = 24
  const toX = (i: number) => pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2)
  const toY = (v: number) => h - pad - (v / max) * (h - pad * 2)
  const planned = points.map((p, i) => `${toX(i)},${toY(p.plannedHours)}`).join(' ')
  const completed = points.map((p, i) => `${toX(i)},${toY(p.completedHours)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img" aria-label="Planned vs completed">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="text-blue-400" points={planned} />
      <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500" points={completed} />
      {points.map((p, i) => (
        <text key={p.weekLabel} x={toX(i)} y={h - 6} textAnchor="middle" className="fill-neutral-500" fontSize="10">
          {p.weekLabel}
        </text>
      ))}
    </svg>
  )
}

function DistributionBars({ slices }: { slices: MyInsightsDistributionSlice[] }) {
  return (
    <ul className="space-y-3">
      {slices.map((s) => (
        <li key={s.key}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <Typography variant="small" className="text-neutral-800">
              {s.label}
            </Typography>
            <Typography variant="small" tone="muted">
              {s.percent}% · {s.hours}h
            </Typography>
          </div>
          <div className="h-2 w-full rounded-none bg-neutral-100">
            <div
              className="h-full rounded-none bg-primary-gradient"
              style={{ width: `${s.percent}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function CarryOverBars({ weekly }: { weekly: Array<{ weekLabel: string; count: number }> }) {
  const max = Math.max(...weekly.map((w) => w.count), 1)
  return (
    <div className="flex h-28 items-end gap-2">
      {weekly.map((w) => (
        <div key={w.weekLabel} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-none bg-sky-600/80"
            style={{ height: `${Math.max(8, (w.count / max) * 100)}%` }}
            title={`${w.weekLabel}: ${w.count}`}
          />
          <Typography as="span" variant="small" tone="muted" className="text-[10px]">
            {w.weekLabel}
          </Typography>
        </div>
      ))}
    </div>
  )
}

function SummaryStrip({
  summary,
  active,
  onSelect,
}: {
  summary: MyInsightsResponse['summary']
  active: string | null
  onSelect: (key: string) => void
}) {
  const items = [
    { key: 'remaining', label: 'Remaining', value: summary.remaining },
    { key: 'overdue', label: 'Overdue', value: summary.overdue },
    { key: 'blocked', label: 'Blocked', value: summary.blocked },
    { key: 'completed', label: 'Completed', value: summary.completed },
  ]
  return (
    <div className="grid grid-cols-2 gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={cn(
            'flex items-baseline justify-between gap-3 rounded-none bg-white px-4 py-3 text-left hover:bg-neutral-50',
            active === item.key && 'bg-blue-400/5 ring-1 ring-inset ring-sky-600'
          )}
        >
          {item.key === 'overdue' ? (
            <span className="rounded-none bg-red-700 px-1.5 py-0.5 text-xs font-medium text-white">
              {item.label}
            </span>
          ) : (
            <Typography as="span" variant="small" tone="muted">
              {item.label}
            </Typography>
          )}
          <Typography
            as="span"
            size="lg"
            weight="semibold"
            className="tabular-nums text-neutral-900"
          >
            {item.value}
          </Typography>
        </button>
      ))}
    </div>
  )
}

export function MyInsightsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const range = searchParams.get('range') ?? '30d'
  const projectId = searchParams.get('projectId') ?? ''
  const attention = searchParams.get('attention')
  const workChip = searchParams.get('work') ?? MyInsightsWorkChip.AllOpen
  const [selectedDay, setSelectedDay] = useState<MyInsightsHeatmapDay | null>(null)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    const q = next.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
  }

  const { data, loading, error, refetch } = useMyInsights(workspaceId, {
    range,
    projectId: projectId || undefined,
  })
  // Project filter options must NOT come from filtered insights data — selecting one
  // project would shrink the dropdown to that single project.
  const { projects: workspaceProjects } = useProjects(workspaceId)

  const tasks = useMemo(
    () => filterTasks(data?.currentWork ?? [], workChip, attention),
    [data?.currentWork, workChip, attention]
  )

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'All projects' },
      ...workspaceProjects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [workspaceProjects]
  )

  const scrollToCurrentWork = () => {
    document.getElementById('my-insights-current-work')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-4 p-lg">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            My Insights
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Your personal work overview
            {data ? ` · ${formatDateLabel(data.dateFrom)} – ${formatDateLabel(data.dateTo)}` : ''}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[10rem]">
            <Select
              size="md"
              value={range}
              onValueChange={(v: string) => setParams({ range: v })}
              options={RANGE_OPTIONS}
              aria-label="Date range"
            />
          </div>
          <div className="w-[11rem]">
            <Select
              size="md"
              value={projectId}
              onValueChange={(v: string) => setParams({ projectId: v || null })}
              options={projectOptions}
              aria-label="Project filter"
            />
          </div>
          <Button variant="ghost" size="sm" className="rounded-none" onClick={() => void refetch()}>
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={() => setCustomizeOpen((v) => !v)}
          >
            Customize
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-none border border-neutral-300 bg-neutral-50 px-3 py-2">
          <Typography variant="small" className="text-neutral-800">
            {error}
          </Typography>
        </div>
      ) : null}

      {customizeOpen ? (
        <div className="rounded-none border border-neutral-200 bg-white p-4">
          <Typography size="sm" weight="semibold" className="mb-3">
            Customize dashboard
          </Typography>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'heatmap', label: 'Activity heatmap', required: false },
              { key: 'planned', label: 'Planned vs completed', required: false },
              { key: 'distribution', label: 'Work distribution', required: false },
              { key: 'health', label: 'Work health', required: false },
              { key: 'carry', label: 'Carry-over and consistency', required: false },
              { key: 'ai', label: 'AI personal review', required: false },
            ].map((w) => (
              <label key={w.key} className="flex items-center gap-2 text-sm text-neutral-800">
                <Checkbox
                  checked={!hidden[w.key]}
                  onChange={(e) =>
                    setHidden((prev) => ({ ...prev, [w.key]: !e.target.checked }))
                  }
                />
                {w.label}
              </label>
            ))}
          </div>
          <Typography variant="small" tone="muted" className="mt-3">
            Summary, Current work, and Phase Watch stay visible.
          </Typography>
        </div>
      ) : null}

      <SummaryStrip
        summary={
          data?.summary ?? {
            remaining: 0,
            overdue: 0,
            blocked: 0,
            completed: 0,
          }
        }
        active={attention}
        onSelect={(key) => {
          if (key === 'completed') {
            setParams({ attention: null, work: MyInsightsWorkChip.AllOpen })
          } else if (key === 'remaining') {
            setParams({ attention: null, work: MyInsightsWorkChip.AllOpen })
          } else if (key === 'overdue') {
            setParams({ attention: 'overdue', work: MyInsightsWorkChip.Overdue })
          } else if (key === 'blocked') {
            setParams({ attention: 'blocked', work: MyInsightsWorkChip.Blocked })
          } else {
            setParams({ attention: key, work: MyInsightsWorkChip.AllOpen })
          }
          scrollToCurrentWork()
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <PhaseWatchWidget
          workspaceId={workspaceId}
          projectId={projectId || null}
          className="min-h-full"
        />

        <InsightWidgetShell
          title="Current work"
          className="scroll-mt-4 min-h-full"
          loading={loading && !data}
          empty={tasks.length === 0 ? 'No work found for this filter.' : null}
          action={
            <div className="flex flex-wrap gap-1">
              {WORK_CHIPS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setParams({ work: c.value, attention: null })
                  }}
                  className={cn(
                    'rounded-none border px-2 py-1 text-xs',
                    workChip === c.value && !attention
                      ? 'border-transparent bg-primary-gradient text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-blue-400/5'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          }
        >
          <div id="my-insights-current-work" />
          <ul className="divide-y divide-neutral-200">
            {tasks.map((t, index) => (
              <li
                key={t.taskId ? `${t.projectId}:${t.taskId}` : `current-work-${index}`}
                className="flex items-start gap-3 py-3"
              >
                <Checkbox className="mt-0.5 rounded-none" aria-label={`Complete ${t.title}`} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={ROUTES.workspace.projectWorkTask(workspaceId, t.projectId, t.taskId)}
                    className="block"
                  >
                    <Typography size="sm" className="text-neutral-900 hover:underline">
                      {t.title}
                    </Typography>
                  </Link>
                  <Typography variant="small" tone="muted" className="mt-0.5">
                    {t.projectName}
                    {t.phaseName ? ` · ${t.phaseName}` : ''}
                    {t.dueDate ? ` · Due ${formatDateLabel(t.dueDate)}` : ' · No due date'}
                    {t.estimateHours != null ? ` · ${t.estimateHours}h` : ''}
                  </Typography>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {t.chips.includes('overdue') ? (
                      <span
                        className={cn(
                          'rounded-none px-1.5 py-0.5 text-[11px] font-medium',
                          chipBadgeClass('overdue')
                        )}
                      >
                        Overdue
                      </span>
                    ) : null}
                    {t.chips.includes('blocked') ? (
                      <span
                        className={cn(
                          'rounded-none px-1.5 py-0.5 text-[11px] font-medium',
                          chipBadgeClass('blocked')
                        )}
                      >
                        Blocked
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        'rounded-none px-1.5 py-0.5 text-[11px] font-medium',
                        statusBadgeClass(t.status)
                      )}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </InsightWidgetShell>
      </div>

      {!hidden.heatmap ? (
        <InsightWidgetShell
          title="Work activity"
          subtitle="Last 12 months"
          loading={loading && !data}
        >
          <Heatmap
            days={data?.heatmap.days ?? []}
            onSelect={(day) => setSelectedDay(day)}
          />
          {selectedDay ? (
            <div className="mt-4 rounded-none border border-sky-600/20 bg-blue-400/5 p-3">
              <Typography size="sm" weight="semibold">
                {formatDateLabel(selectedDay.date)}
              </Typography>
              <Typography variant="small" tone="muted" className="mt-1">
                {selectedDay.completedTasks} tasks completed · {selectedDay.completedEffortHours}h
                effort · {selectedDay.overdueResolved} overdue resolved · {selectedDay.projectCount}{' '}
                projects
              </Typography>
              {(selectedDay.completedTaskItems?.length ?? 0) > 0 ? (
                <ul className="mt-3 divide-y divide-sky-600/10 border-t border-sky-600/15 pt-2">
                  {selectedDay.completedTaskItems!.map((t) => (
                    <li key={`${t.projectId}:${t.taskId}`} className="py-2">
                      <Link
                        href={ROUTES.workspace.projectWorkTask(workspaceId, t.projectId, t.taskId)}
                        className="block hover:underline"
                      >
                        <Typography size="sm" className="text-neutral-900">
                          {t.title}
                        </Typography>
                      </Link>
                      <Typography variant="small" tone="muted" className="mt-0.5">
                        {t.projectName}
                        {t.estimateHours != null ? ` · ${t.estimateHours}h` : ''}
                      </Typography>
                    </li>
                  ))}
                </ul>
              ) : selectedDay.completedTasks === 0 ? (
                <Typography variant="small" tone="muted" className="mt-2">
                  No completed tasks on this day.
                </Typography>
              ) : null}
            </div>
          ) : null}
        </InsightWidgetShell>
      ) : null}

      {!hidden.health ? (
        <InsightWidgetShell
          title="Work health"
          loading={loading && !data}
          action={
            data?.health.statusLabel ? (
              <span
                className={cn(
                  'rounded-none px-2 py-0.5 text-[11px] font-medium text-white',
                  data.health.status === 'ON_TRACK'
                    ? 'bg-emerald-500'
                    : data.health.status === 'OVERLOADED'
                      ? 'bg-red-700'
                      : data.health.status === 'NEEDS_ATTENTION'
                        ? 'bg-sky-600'
                        : 'bg-neutral-600'
                )}
              >
                {data.health.statusLabel}
              </span>
            ) : null
          }
        >
          <ul className="space-y-3">
            {(data?.health.metrics ?? []).map((m) => (
              <li key={m.key} className="flex items-baseline justify-between gap-3 border-b border-neutral-100 pb-2 last:border-0">
                <Typography variant="small" className="text-neutral-700">
                  {m.label}
                </Typography>
                <div className="text-right">
                  <Typography as="span" weight="semibold" className="tabular-nums text-neutral-900">
                    {m.valuePercent == null ? '—' : `${m.valuePercent}%`}
                  </Typography>
                  {m.trendPercent != null ? (
                    <Typography as="span" variant="small" tone="muted" className="ml-2 tabular-nums">
                      {m.trendPercent > 0 ? '+' : ''}
                      {m.trendPercent}%
                    </Typography>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </InsightWidgetShell>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {!hidden.planned ? (
          <InsightWidgetShell title="Planned vs completed" subtitle="Weekly effort · Last 8 weeks" loading={loading && !data}>
            <div className="mb-2 flex gap-4">
              <Typography variant="small" className="text-blue-400">
                — Planned
              </Typography>
              <Typography variant="small" className="text-emerald-500">
                — Completed
              </Typography>
            </div>
            <PlannedCompletedChart points={data?.plannedVsCompleted ?? []} />
          </InsightWidgetShell>
        ) : null}

        {!hidden.distribution ? (
          <InsightWidgetShell title="Work distribution" subtitle="Completed effort by project" loading={loading && !data}>
            <DistributionBars slices={data?.distribution ?? []} />
          </InsightWidgetShell>
        ) : null}
      </div>

      {!hidden.carry ? (
        <InsightWidgetShell title="Carry-over and consistency" loading={loading && !data}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Typography size="sm" weight="semibold" className="mb-2">
                Carry-over
              </Typography>
              <Typography variant="small" className="text-neutral-800">
                This period{' '}
                <span className="font-semibold text-neutral-900">
                  {data?.carryOver.thisPeriodTasks ?? 0}
                </span>{' '}
                tasks
              </Typography>
              <Typography variant="small" tone="muted">
                Previous period{' '}
                <span className="font-semibold text-neutral-900">
                  {data?.carryOver.previousPeriodTasks ?? 0}
                </span>{' '}
                tasks
                {data?.carryOver.trendLabel ? ` · ${data.carryOver.trendLabel}` : ''}
              </Typography>
              <div className="mt-4">
                <CarryOverBars weekly={data?.carryOver.weekly ?? []} />
              </div>
            </div>
            <div>
              <Typography size="sm" weight="semibold" className="mb-2">
                Consistency
              </Typography>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Active days',
                    value: `${data?.consistency.activeDays ?? 0}/${data?.consistency.workingDays ?? 0}`,
                  },
                  { label: 'Current streak', value: `${data?.consistency.currentStreak ?? 0} days` },
                  { label: 'Longest streak', value: `${data?.consistency.longestStreak ?? 0} days` },
                  { label: 'No-overdue days', value: `${data?.consistency.noOverdueDays ?? 0}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-none border border-neutral-200 p-3">
                    <Typography variant="small" tone="muted">
                      {item.label}
                    </Typography>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <Typography weight="semibold" className="tabular-nums text-neutral-900">
                        {item.value}
                      </Typography>
                      {item.label === 'Longest streak' ? (
                        <Flame
                          size={18}
                          className="shrink-0 fill-orange-400 text-orange-500"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </InsightWidgetShell>
      ) : null}

      {!hidden.ai && data?.aiReview.available ? (
        <InsightWidgetShell title="AI personal review" loading={loading && !data} className="border-sky-600/20">
          <Typography size="sm" className="text-neutral-800">
            {data.aiReview.summary}
          </Typography>
          {data.aiReview.needsAttention.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {data.aiReview.needsAttention.map((line) => (
                <li key={line}>
                  <Typography variant="small" className="text-neutral-700">
                    {line}
                  </Typography>
                </li>
              ))}
            </ul>
          ) : null}
          {data.aiReview.suggestedAdjustment ? (
            <Typography variant="small" className="mt-3 text-neutral-800">
              Suggested adjustment: {data.aiReview.suggestedAdjustment}
            </Typography>
          ) : null}
          <div className="mt-4">
            <Button
              variant="primary"
              size="sm"
              className="rounded-none"
              onClick={() => {
                setParams({ attention: 'overdue', work: MyInsightsWorkChip.Overdue })
                scrollToCurrentWork()
              }}
            >
              Review affected tasks
            </Button>
          </div>
        </InsightWidgetShell>
      ) : null}
    </div>
  )
}
