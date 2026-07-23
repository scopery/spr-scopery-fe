'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Gantt, Willow, type IApi, type ITask } from '@svar-ui/react-gantt'
import '@svar-ui/react-gantt/all.css'
import './gantt-theme.css'
import { Badge, Button, PageSkeleton, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import * as phasesApi from '../../../phase/infrastructure/api/phases.api'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectGantt } from '../hooks/useProjectGantt'
import { downloadGanttExcel } from '../exportGanttExcel'
import type { GanttTimeScale } from '../../domain/rules/gantt.rules'
import {
  collectDescendantSvarTaskIds,
  formatInclusiveEndForGrid,
  formatStartForGrid,
  ganttDragHintForItemType,
  isGanttChartDraggable,
  isGanttSummaryDraggable,
  isGanttTaskDraggable,
  mapGanttDepsToSvarLinks,
  mapGanttTreeToSvarTasks,
  resolveSourceEntityId,
  resolveSourceTaskId,
  toDateOnlyFromSvar,
  toInclusiveFinishFromSvar,
} from '../mapToSvarGantt'
import { GanttScheduleModal } from './GanttScheduleModal'

const SCALE_OPTIONS: { value: GanttTimeScale; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

function scalesFor(scale: GanttTimeScale) {
  if (scale === 'day') {
    return [
      { unit: 'month', step: 1, format: '%F %Y' },
      { unit: 'day', step: 1, format: '%j' },
    ]
  }
  if (scale === 'week') {
    return [
      { unit: 'month', step: 1, format: '%F %Y' },
      { unit: 'week', step: 1, format: 'Week %W' },
    ]
  }
  return [
    { unit: 'year', step: 1, format: '%Y' },
    { unit: 'month', step: 1, format: '%F' },
  ]
}

const COLUMNS = [
  { id: 'text', header: 'Task name', flexgrow: 1, resize: true },
  {
    id: 'start',
    header: 'Start',
    width: 110,
    resize: true,
    template: (value: unknown) => formatStartForGrid(value),
  },
  {
    id: 'end',
    header: 'End',
    width: 110,
    resize: true,
    template: (value: unknown, row: { start?: Date; duration?: number }) =>
      formatInclusiveEndForGrid(value, row),
  },
  { id: 'duration', header: 'Duration', width: 90, resize: true },
]

type ScheduleModalState = {
  kind: 'task' | 'phase'
  entityId: string
  title: string
  start: string
  end: string
}

export function ProjectGanttView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const [exporting, setExporting] = useState(false)
  const [scale, setScale] = useState<GanttTimeScale>('week')
  const [hideUnscheduled, setHideUnscheduled] = useState(false)
  const [ganttDataVersion, setGanttDataVersion] = useState(0)
  const [mounted, setMounted] = useState(false)
  const ganttApiRef = useRef<IApi | null>(null)
  const dragOriginRef = useRef<Map<string | number, { start: string; end: string }>>(new Map())
  const blockedDragToastRef = useRef<Set<string | number>>(new Set())
  const savingTaskRef = useRef<Set<string>>(new Set())
  const cascadeSavedTasksRef = useRef<Set<string>>(new Set())
  const savingSummaryRef = useRef<Set<string>>(new Set())
  const openScheduleModalRef = useRef<(task: ITask) => void>(() => {})

  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState | null>(null)
  const [scheduleSaving, setScheduleSaving] = useState(false)

  openScheduleModalRef.current = (task: ITask) => {
    const start = toDateOnlyFromSvar(task.start) ?? ''
    const end = toInclusiveFinishFromSvar(task) ?? start

    if (isGanttTaskDraggable(task)) {
      const id = resolveSourceTaskId(task)
      if (!id) return
      setScheduleModal({
        kind: 'task',
        entityId: id,
        title: task.text ?? 'Task',
        start,
        end,
      })
      return
    }

    if (task.itemType === 'PHASE') {
      const id = resolveSourceEntityId(task)
      if (!id) return
      setScheduleModal({
        kind: 'phase',
        entityId: id,
        title: task.text ?? 'Phase',
        start,
        end,
      })
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const { project } = useProject(workspaceId, projectId)
  const {
    items,
    tree,
    summary,
    ganttDependencies,
    loading,
    recalculating,
    error,
    forbidden,
    recalculate,
    moveTask,
    resizeTask,
    refetch,
  } = useProjectGantt(projectId, { includeUnscheduled: true })

  const tasks = useMemo(
    () => mapGanttTreeToSvarTasks(tree, { includeUnscheduled: !hideUnscheduled }),
    [tree, hideUnscheduled]
  )
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  const links = useMemo(
    () => mapGanttDepsToSvarLinks(ganttDependencies, tasks),
    [ganttDependencies, tasks]
  )

  const scales = useMemo(() => scalesFor(scale), [scale])

  const persistTaskDates = useCallback(
    async (taskId: string | number, task: ITask) => {
      if (!isGanttTaskDraggable(task)) return

      const sourceTaskId = resolveSourceTaskId(task)
      if (!sourceTaskId) {
        await refetch()
        return
      }

      if (cascadeSavedTasksRef.current.has(sourceTaskId)) return

      const start = toDateOnlyFromSvar(task.start)
      const end = toInclusiveFinishFromSvar(task) ?? start
      if (!start || !end) return

      const origin = dragOriginRef.current.get(taskId)
      dragOriginRef.current.delete(taskId)

      if (savingTaskRef.current.has(sourceTaskId)) return
      savingTaskRef.current.add(sourceTaskId)

      try {
        if (origin && origin.start === start && origin.end !== end) {
          await resizeTask(
            sourceTaskId,
            {
              manualFinishDate: end,
              reason: 'Gantt resize',
              recalculate: false,
            },
            { refresh: true }
          )
        } else {
          await moveTask(
            sourceTaskId,
            {
              manualStartDate: start,
              manualFinishDate: end,
              reason: 'Gantt drag',
              recalculate: false,
            },
            { refresh: true }
          )
        }
        setGanttDataVersion((v) => v + 1)
        toast.success('Task schedule updated')
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        await refetch()
        setGanttDataVersion((v) => v + 1)
      } finally {
        savingTaskRef.current.delete(sourceTaskId)
      }
    },
    [moveTask, resizeTask, refetch]
  )

  const persistSummaryDates = useCallback(
    async (summaryId: string | number, summaryTask: ITask) => {
      if (!isGanttSummaryDraggable(summaryTask)) return

      const key = String(summaryId)
      if (savingSummaryRef.current.has(key)) return
      savingSummaryRef.current.add(key)

      const api = ganttApiRef.current
      const start = toDateOnlyFromSvar(summaryTask.start)
      const end = toInclusiveFinishFromSvar(summaryTask) ?? start
      dragOriginRef.current.delete(summaryId)

      if (!api || !start || !end) {
        savingSummaryRef.current.delete(key)
        await refetch()
        return
      }

      const descendantIds = collectDescendantSvarTaskIds(tasksRef.current, summaryId)
      const moves: Array<{ taskId: string; start: string; end: string }> = []

      for (const id of descendantIds) {
        const child = api.getTask(id)
        const sourceTaskId = resolveSourceTaskId(child)
        const childStart = toDateOnlyFromSvar(child.start)
        const childEnd = toInclusiveFinishFromSvar(child) ?? childStart
        if (!sourceTaskId || !childStart || !childEnd) continue
        if (child.isPlaceholderSchedule) continue
        moves.push({ taskId: sourceTaskId, start: childStart, end: childEnd })
      }

      try {
        for (const m of moves) {
          cascadeSavedTasksRef.current.add(m.taskId)
          await moveTask(
            m.taskId,
            {
              manualStartDate: m.start,
              manualFinishDate: m.end,
              reason:
                summaryTask.itemType === 'PHASE'
                  ? 'Gantt phase drag'
                  : 'Gantt WBS drag',
              recalculate: false,
            },
            { refresh: false }
          )
        }

        if (summaryTask.itemType === 'PHASE') {
          const phaseId = resolveSourceEntityId(summaryTask)
          if (phaseId) {
            await phasesApi.updatePhase(projectId, phaseId, {
              plannedStartDate: start,
              plannedEndDate: end,
            })
          }
        }

        await refetch()
        setGanttDataVersion((v) => v + 1)
        const label = summaryTask.itemType === 'PHASE' ? 'Phase' : 'WBS'
        toast.success(
          moves.length
            ? `${label} moved · ${moves.length} task${moves.length === 1 ? '' : 's'} updated`
            : `${label} dates updated`
        )
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        await refetch()
        setGanttDataVersion((v) => v + 1)
      } finally {
        savingSummaryRef.current.delete(key)
        window.setTimeout(() => {
          for (const m of moves) cascadeSavedTasksRef.current.delete(m.taskId)
        }, 800)
      }
    },
    [moveTask, projectId, refetch]
  )

  const handleUpdateTask = useCallback(
    (ev: { id: string | number; inProgress?: boolean }) => {
      if (ev.inProgress) return
      const api = ganttApiRef.current
      if (!api) return
      const task = api.getTask(ev.id)
      if (isGanttSummaryDraggable(task)) {
        void persistSummaryDates(ev.id, task)
        return
      }
      if (isGanttTaskDraggable(task)) {
        void persistTaskDates(ev.id, task)
      }
    },
    [persistSummaryDates, persistTaskDates]
  )

  const init = useCallback(
    (instance: IApi) => {
      ganttApiRef.current = instance

      instance.intercept('add-task', () => false)
      instance.intercept('delete-task', () => false)
      instance.intercept('add-link', () => false)
      instance.intercept('delete-link', () => false)
      instance.intercept('move-task', () => false)

      instance.intercept(
        'drag-task',
        (ev: {
          left?: number
          width?: number
          top?: number
          inProgress?: boolean
          id: string | number
        }) => {
          const isChartDrag = ev.left != null || ev.width != null
          const isRowReorder = ev.top != null && !isChartDrag
          if (isRowReorder) return false

          if (isChartDrag) {
            const task = instance.getTask(ev.id)
            if (!isGanttChartDraggable(task)) {
              if (ev.inProgress && !blockedDragToastRef.current.has(ev.id)) {
                blockedDragToastRef.current.add(ev.id)
                const hint = ganttDragHintForItemType(String(task.itemType ?? ''))
                toast.info(hint ?? 'This bar cannot be dragged on the timeline')
              }
              if (!ev.inProgress) blockedDragToastRef.current.delete(ev.id)
              return false
            }

            if (ev.inProgress && !dragOriginRef.current.has(ev.id) && task.start) {
              const start = toDateOnlyFromSvar(task.start)
              const end = toInclusiveFinishFromSvar(task)
              if (start && end) dragOriginRef.current.set(ev.id, { start, end })
            }
          }
        }
      )

      instance.intercept('update-task', (ev: { id: string | number; inProgress?: boolean }) => {
        if (ev.inProgress) return
        const task = instance.getTask(ev.id)
        if (!isGanttChartDraggable(task)) {
          void refetch()
          return false
        }
      })

      instance.intercept('show-editor', (ev: { id: string | number }) => {
        const task = instance.getTask(ev.id)
        if (isGanttTaskDraggable(task) || task.itemType === 'PHASE') {
          openScheduleModalRef.current(task)
          return false
        }
        if (isGanttSummaryDraggable(task)) {
          toast.info('Drag the WBS bar to shift its tasks, or edit task dates directly')
          return false
        }
        const hint = ganttDragHintForItemType(String(task.itemType ?? ''))
        toast.info(hint ?? 'This row is read-only on the timeline')
        return false
      })
    },
    [refetch]
  )

  const handleScheduleModalSave = async (body: { startDate: string; endDate: string }) => {
    if (!scheduleModal) return
    setScheduleSaving(true)
    try {
      if (scheduleModal.kind === 'task') {
        await moveTask(
          scheduleModal.entityId,
          {
            manualStartDate: body.startDate,
            manualFinishDate: body.endDate,
            reason: 'Timeline edit',
            recalculate: false,
          },
          { refresh: true }
        )
        toast.success('Task schedule updated')
      } else {
        await phasesApi.updatePhase(projectId, scheduleModal.entityId, {
          plannedStartDate: body.startDate,
          plannedEndDate: body.endDate,
        })
        await refetch()
        toast.success('Phase dates updated')
      }
      setGanttDataVersion((v) => v + 1)
      setScheduleModal(null)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setScheduleSaving(false)
    }
  }

  const handleRecalculate = async () => {
    try {
      await recalculate({ markAsCurrent: true })
      toast.success('Schedule recalculated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error('Nothing to export yet')
      return
    }
    setExporting(true)
    try {
      downloadGanttExcel(tree.length ? tree : items, {
        projectName: project?.name ?? project?.code ?? projectId,
        fileName: `${project?.code ?? 'project'}-timeline`,
      })
      toast.success('Excel downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading && tree.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to the Gantt timeline</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Timeline"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Timeline
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded border border-neutral-200 bg-white">
            {SCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScale(opt.value)}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  scale === opt.value
                    ? 'bg-secondary/10 text-secondary'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            variant={hideUnscheduled ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setHideUnscheduled((v) => !v)}
          >
            {hideUnscheduled ? 'Show unscheduled' : 'Hide unscheduled'}
          </Button>
          <Button
            variant="outline"
            icon={<Download size={16} />}
            loading={exporting}
            disabled={items.length === 0}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
          <Button
            variant="secondary"
            icon={<RefreshCw size={16} />}
            loading={recalculating}
            onClick={() => void handleRecalculate()}
          >
            Recalculate
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {summary ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="solid" tone="neutral">
            {summary.itemCount} items
          </Badge>
          <Badge variant="solid" tone="success">
            {summary.scheduledTaskCount} scheduled
          </Badge>
          <Badge variant="solid" tone="warning">
            {summary.unscheduledTaskCount} unscheduled
          </Badge>
          {summary.milestoneCount > 0 ? (
            <Badge variant="solid" tone="info">
              {summary.milestoneCount} milestones
            </Badge>
          ) : null}
          {summary.issueCount > 0 ? (
            <Badge variant="solid" tone="error">
              {summary.issueCount} issues
            </Badge>
          ) : null}
          <Typography variant="small" tone="muted" className="ml-1">
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-6 rounded-sm bg-sky-300" />
              Task — drag or double-click
            </span>
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-6 rounded-sm bg-slate-300" />
              Phase/WBS — drag to shift children
            </span>
            Recalculate reschedules dependencies project-wide.
          </Typography>
        </div>
      ) : null}

      <div className="scopery-gantt h-[min(70vh,720px)] min-h-[480px] overflow-hidden border border-neutral-200 bg-white">
        {!mounted ? (
          <PageSkeleton variant="list" />
        ) : tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <Typography variant="small" tone="muted">
              No timeline items yet — run Recalculate or create scheduled tasks
            </Typography>
          </div>
        ) : (
          <Willow fonts={false}>
            <Gantt
              key={`${scale}-${ganttDataVersion}`}
              tasks={tasks}
              links={links}
              scales={scales}
              columns={COLUMNS}
              init={init}
              onUpdateTask={handleUpdateTask}
              readonly={false}
              cellBorders="column"
            />
          </Willow>
        )}
      </div>

      <GanttScheduleModal
        open={scheduleModal != null}
        title={
          scheduleModal?.kind === 'phase' ? 'Edit phase dates' : 'Edit task schedule'
        }
        subtitle={
          scheduleModal
            ? scheduleModal.kind === 'phase'
              ? `${scheduleModal.title} · updates phase planned dates`
              : scheduleModal.title
            : undefined
        }
        startDate={scheduleModal?.start ?? ''}
        endDate={scheduleModal?.end ?? ''}
        saving={scheduleSaving}
        onClose={() => setScheduleModal(null)}
        onSave={handleScheduleModalSave}
      />
    </div>
  )
}
