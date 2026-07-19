'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal, Input, Select, Textarea, Typography } from '@/shared/ui'
import { TaskPriority } from '../../../project/domain/enums/project.enum'
import type { CreateTaskPayload } from '../../domain/model/task'
import type { ProjectPhase } from '../../../phase/domain/model/phase'

interface CreateTaskModalProps {
  open: boolean
  phases: ProjectPhase[]
  onClose: () => void
  onSubmit: (body: CreateTaskPayload) => Promise<void>
}

const PRIORITY_OPTIONS = [
  { value: TaskPriority.Medium, label: 'Medium' },
  { value: TaskPriority.Low, label: 'Low' },
  { value: TaskPriority.High, label: 'High' },
  { value: TaskPriority.Critical, label: 'Critical' },
]

export function CreateTaskModal({ open, phases, onClose, onSubmit }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>(TaskPriority.Medium)
  const [phaseId, setPhaseId] = useState('')
  const [estimateHours, setEstimateHours] = useState('1')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setCode('')
    setDescription('')
    setPriority(TaskPriority.Medium)
    setPhaseId(phases[0]?.id ?? '')
    setEstimateHours('1')
    setDueDate('')
  }, [open, phases])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedCode =
      code.trim() ||
      `TASK_${trimmedTitle
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .slice(0, 24)}`
    if (!trimmedTitle || !trimmedCode) return

    if (!phaseId) {
      toast.error('Select a phase')
      return
    }

    const hours = Number.parseFloat(estimateHours)
    if (!Number.isFinite(hours) || hours < 0.01) {
      toast.error('Estimate hours must be at least 0.01')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        code: trimmedCode,
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        projectPhaseId: phaseId,
        estimateHours: hours,
        dueDate: dueDate || null,
      })
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create task"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: phases.length === 0,
        },
      ]}
    >
      <div className="space-y-4">
        {phases.length === 0 ? (
          <Typography variant="small" tone="error">
            Create at least one project phase before adding tasks.
          </Typography>
        ) : null}
        <Input
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Auto from title if empty"
        />
        <Textarea
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div>
          <Typography variant="small" className="mb-1.5">
            Priority
          </Typography>
          <Select value={priority} onValueChange={setPriority} options={PRIORITY_OPTIONS} />
        </div>
        <div>
          <Typography variant="small" className="mb-1.5">
            Phase <span className="text-error">*</span>
          </Typography>
          <Select
            value={phaseId}
            onValueChange={setPhaseId}
            options={phases.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))}
            placeholder={phases.length ? 'Select phase' : 'No phases'}
          />
        </div>
        <Input
          label="Estimate hours"
          type="number"
          required
          fullWidth
          min={0.01}
          step={0.25}
          value={estimateHours}
          onChange={(e) => setEstimateHours(e.target.value)}
          placeholder="e.g. 8"
        />
        <Input
          label="Due date"
          type="date"
          fullWidth
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
    </Modal>
  )
}
