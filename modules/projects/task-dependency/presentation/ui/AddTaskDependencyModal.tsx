'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Input, Modal, Typography } from '@/shared/ui'
import { EntityReferencePicker } from '@/shared/ui/molecules/EntityReferencePicker'
import type { EntityReferenceOption } from '@/shared/ui/molecules/EntityReferencePicker'
import { cn } from '@/utils/cn'
import { listTasks } from '../../../task/infrastructure/api/tasks.api'
import type { ProjectTask } from '../../../task/domain/model/task'
import { DependencyType } from '../../domain/enums/task-dependency.enum'
import type {
  CreateTaskDependencyPayload,
  TaskDependency,
} from '../../domain/model/task-dependency'

type Direction = 'waiting' | 'blocking'
type StartWhen = 'after_finishes' | 'after_starts'
type TimingMode = 'immediate' | 'wait' | 'overlap'

const TIMING_CHIPS: { value: TimingMode; label: string }[] = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'wait', label: 'Wait' },
  { value: 'overlap', label: 'Overlap' },
]

function formatDay(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function addWorkingDays(iso: string, days: number): string {
  const d = new Date(iso)
  let left = Math.abs(days)
  const step = days >= 0 ? 1 : -1
  while (left > 0) {
    d.setDate(d.getDate() + step)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) left -= 1
  }
  return d.toISOString()
}

interface AddTaskDependencyModalProps {
  open: boolean
  projectId: string
  currentTaskId: string
  currentTaskTitle?: string
  existingDeps?: TaskDependency[]
  onClose: () => void
  onSubmit: (body: CreateTaskDependencyPayload) => Promise<void>
}

function toOption(t: ProjectTask): EntityReferenceOption {
  return {
    id: t.id,
    type: 'TASK',
    code: t.code,
    title: t.title,
    status: t.status,
  }
}

function Segment({
  checked,
  onSelect,
  title,
  subtitle,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'border px-3 py-2.5 text-left transition-colors',
        checked
          ? 'border-primary bg-primary/5'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
      )}
    >
      <span
        className={cn(
          'block text-sm font-medium',
          checked ? 'text-primary' : 'text-neutral-900'
        )}
      >
        {title}
      </span>
      <span className="mt-0.5 block text-xs text-neutral-500">{subtitle}</span>
    </button>
  )
}

function Chip({
  checked,
  onSelect,
  label,
}: {
  checked: boolean
  onSelect: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'border px-3 py-1.5 text-sm transition-colors',
        checked
          ? 'border-primary bg-primary/5 font-medium text-primary'
          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
      )}
    >
      {label}
    </button>
  )
}

function RadioRow({
  checked,
  onSelect,
  label,
}: {
  checked: boolean
  onSelect: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 border px-3 py-2.5 text-left transition-colors',
        checked
          ? 'border-primary bg-primary/5'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center border',
          checked ? 'border-primary' : 'border-neutral-300'
        )}
        aria-hidden
      >
        {checked ? <span className="h-2 w-2 bg-primary" /> : null}
      </span>
      <span
        className={cn(
          'text-sm',
          checked ? 'font-medium text-primary' : 'text-neutral-800'
        )}
      >
        {label}
      </span>
    </button>
  )
}

export function AddTaskDependencyModal({
  open,
  projectId,
  currentTaskId,
  currentTaskTitle,
  existingDeps = [],
  onClose,
  onSubmit,
}: AddTaskDependencyModalProps) {
  const [direction, setDirection] = useState<Direction>('waiting')
  const [selectedTask, setSelectedTask] = useState<EntityReferenceOption | null>(null)
  const [startWhen, setStartWhen] = useState<StartWhen>('after_finishes')
  const [timingMode, setTimingMode] = useState<TimingMode>('immediate')
  const [timingDays, setTimingDays] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    if (!open) return
    setDirection('waiting')
    setSelectedTask(null)
    setStartWhen('after_finishes')
    setTimingMode('immediate')
    setTimingDays('1')
    setSubmitting(false)

    setLoadingTasks(true)
    listTasks(projectId, { size: 200 })
      .then((res) => setTasks(res.items ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false))
  }, [open, projectId, currentTaskId])

  const taskOptions = useMemo(
    () => tasks.filter((t) => t.id !== currentTaskId).map(toOption),
    [tasks, currentTaskId]
  )

  const taskById = useMemo(() => {
    const map: Record<string, ProjectTask> = {}
    for (const t of tasks) map[t.id] = t
    return map
  }, [tasks])

  const currentTask = taskById[currentTaskId]
  const currentTitle = currentTaskTitle?.trim() || currentTask?.title || 'This task'
  const otherTask = selectedTask ? taskById[selectedTask.id] : undefined
  const otherTitle = selectedTask
    ? [selectedTask.code, selectedTask.title].filter(Boolean).join(' · ')
    : 'Selected task'

  const daysNum = Math.max(0, Number(timingDays) || 0)

  const depType =
    startWhen === 'after_starts'
      ? DependencyType.StartToStart
      : DependencyType.FinishToStart

  const lagDaysValue = useMemo(() => {
    if (timingMode === 'wait' && daysNum > 0) return daysNum
    if (timingMode === 'overlap' && daysNum > 0) return -daysNum
    return null
  }, [timingMode, daysNum])

  const proposedIds = useMemo(() => {
    if (!selectedTask) return null
    return {
      predecessorTaskId: direction === 'waiting' ? selectedTask.id : currentTaskId,
      successorTaskId: direction === 'waiting' ? currentTaskId : selectedTask.id,
    }
  }, [selectedTask, direction, currentTaskId])

  const predTitle = direction === 'waiting' ? otherTitle : currentTitle
  const succTitle = direction === 'waiting' ? currentTitle : otherTitle
  const predHint = startWhen === 'after_starts' ? 'must start' : 'must finish'
  const succHint = 'can then start'

  const sentence = useMemo(() => {
    if (!selectedTask) return null
    const when =
      startWhen === 'after_starts' ? 'must start before' : 'must finish before'
    let timing = ''
    if (timingMode === 'wait' && daysNum > 0) {
      timing = ` Wait ${daysNum} working day${daysNum === 1 ? '' : 's'} after.`
    } else if (timingMode === 'overlap' && daysNum > 0) {
      timing = ` Allow ${daysNum} working day${daysNum === 1 ? '' : 's'} of overlap.`
    }
    return `${predTitle} ${when} ${succTitle} can start.${timing}`
  }, [selectedTask, startWhen, timingMode, daysNum, predTitle, succTitle])

  const warnings = useMemo(() => {
    const list: string[] = []
    if (!selectedTask || !proposedIds) return list

    const duplicate = existingDeps.some(
      (d) =>
        d.predecessorTaskId === proposedIds.predecessorTaskId &&
        d.successorTaskId === proposedIds.successorTaskId
    )
    if (duplicate) {
      list.push(
        direction === 'waiting'
          ? `Already waiting for ${otherTitle}.`
          : `Already blocking ${otherTitle}.`
      )
    }

    const done = (s?: string) => s === 'COMPLETED' || s === 'DONE'
    if (done(otherTask?.status)) list.push(`${otherTitle} is already completed.`)
    if (done(currentTask?.status)) list.push(`${currentTitle} is already completed.`)
    return list
  }, [
    selectedTask,
    proposedIds,
    existingDeps,
    direction,
    otherTitle,
    currentTitle,
    otherTask,
    currentTask,
  ])

  const scheduleNote = useMemo(() => {
    if (!selectedTask || !proposedIds || startWhen !== 'after_finishes') return null
    const pred = direction === 'waiting' ? otherTask : currentTask
    const succ = direction === 'waiting' ? currentTask : otherTask
    const predEnd = pred?.dueDate ?? pred?.plannedStartDate ?? null
    const succStart = succ?.plannedStartDate ?? null
    if (!predEnd) return null

    const lag = lagDaysValue ?? 0
    const adjustedStart = addWorkingDays(predEnd, lag)
    const from = formatDay(succStart)
    const to = formatDay(adjustedStart)
    if (!to) return null
    if (!succStart || new Date(succStart).getTime() < new Date(adjustedStart).getTime()) {
      return from && from !== to
        ? `${succTitle} moves from ${from} to ${to}`
        : `Can start on ${to}`
    }
    return null
  }, [
    selectedTask,
    proposedIds,
    startWhen,
    direction,
    otherTask,
    currentTask,
    lagDaysValue,
    succTitle,
  ])

  const isDuplicate = warnings.some((w) => w.startsWith('Already'))

  const handleSubmit = async () => {
    if (!selectedTask || !proposedIds || isDuplicate) return
    setSubmitting(true)
    try {
      await onSubmit({
        predecessorTaskId: proposedIds.predecessorTaskId,
        successorTaskId: proposedIds.successorTaskId,
        dependencyType: depType,
        lagDays: lagDaysValue,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add dependency"
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Add dependency',
          variant: 'primary',
          loading: submitting,
          disabled: !selectedTask || submitting || isDuplicate,
          onClick: () => void handleSubmit(),
        },
      ]}
    >
      <div className="space-y-5">
        <div className="inline-flex max-w-full items-center gap-2 border border-neutral-200 bg-neutral-50 px-3 py-1">
          <span className="shrink-0 text-xs text-neutral-400">Current task</span>
          <span className="truncate text-sm font-medium text-neutral-900">{currentTitle}</span>
        </div>

        <section>
          <Typography variant="small" weight="medium" className="mb-2">
            Relationship
          </Typography>
          <div className="grid grid-cols-2 gap-2">
            <Segment
              checked={direction === 'waiting'}
              onSelect={() => setDirection('waiting')}
              title="Waiting for"
              subtitle="This task waits on another"
            />
            <Segment
              checked={direction === 'blocking'}
              onSelect={() => setDirection('blocking')}
              title="Blocking"
              subtitle="Another task waits on this"
            />
          </div>
        </section>

        <section>
          <Typography variant="small" weight="medium" className="mb-1.5">
            {direction === 'waiting'
              ? 'Which task is this task waiting for?'
              : 'Which task is blocked by this task?'}
          </Typography>
          <EntityReferencePicker
            options={taskOptions}
            value={selectedTask}
            onChange={setSelectedTask}
            loading={loadingTasks}
            placeholder="Search tasks…"
            emptyLabel="No other tasks found in this project"
          />
        </section>

        <section>
          <Typography variant="small" weight="medium" className="mb-2">
            {direction === 'waiting'
              ? 'This task can start'
              : 'The selected task can start'}
          </Typography>
          <div className="space-y-2">
            <RadioRow
              checked={startWhen === 'after_finishes'}
              onSelect={() => setStartWhen('after_finishes')}
              label={
                direction === 'waiting'
                  ? 'After the selected task finishes'
                  : 'After the current task finishes'
              }
            />
            <RadioRow
              checked={startWhen === 'after_starts'}
              onSelect={() => setStartWhen('after_starts')}
              label={
                direction === 'waiting'
                  ? 'After the selected task starts'
                  : 'After the current task starts'
              }
            />
          </div>
        </section>

        <section>
          <Typography variant="small" weight="medium" className="mb-2">
            Timing
          </Typography>
          <div className="flex flex-wrap items-center gap-2">
            {TIMING_CHIPS.map((chip) => (
              <Chip
                key={chip.value}
                checked={timingMode === chip.value}
                onSelect={() => setTimingMode(chip.value)}
                label={chip.label}
              />
            ))}
            {timingMode !== 'immediate' ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={1}
                  className="w-16"
                  value={timingDays}
                  onChange={(e) => setTimingDays(e.target.value)}
                />
                <span className="text-xs text-neutral-500">
                  {timingMode === 'wait' ? 'working days' : 'days overlap'}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {warnings.length > 0 ? (
          <div className="space-y-1 border border-warning/30 bg-warning/5 px-3 py-2">
            {warnings.map((w) => (
              <div key={w} className="flex gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" />
                <Typography variant="caption">{w}</Typography>
              </div>
            ))}
          </div>
        ) : null}

        <section className="border border-neutral-200 bg-neutral-50 px-3 py-3">
          <Typography variant="caption" tone="muted" className="mb-2 block">
            Preview
          </Typography>
          {selectedTask ? (
            <>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate border border-neutral-200 bg-white px-2.5 py-2 text-sm font-medium">
                  {predTitle}
                  <span className="mt-0.5 block text-xs font-normal text-neutral-400">
                    {predHint}
                  </span>
                </div>
                <ArrowRight size={16} className="shrink-0 text-neutral-400" />
                <div className="min-w-0 flex-1 truncate border border-neutral-200 bg-white px-2.5 py-2 text-sm font-medium">
                  {succTitle}
                  <span className="mt-0.5 block text-xs font-normal text-neutral-400">
                    {succHint}
                  </span>
                </div>
              </div>
              {sentence ? (
                <Typography variant="caption" className="mt-2 block text-neutral-600">
                  {sentence}
                </Typography>
              ) : null}
              {scheduleNote ? (
                <Typography variant="caption" tone="muted" className="mt-1 block">
                  {scheduleNote}
                </Typography>
              ) : null}
            </>
          ) : (
            <Typography variant="caption" tone="muted">
              Select a task to preview the relationship.
            </Typography>
          )}
        </section>
      </div>
    </Modal>
  )
}
