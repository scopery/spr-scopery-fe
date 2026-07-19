'use client'

import { useState } from 'react'
import { Button, Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { DependencyType } from '../../domain/enums/task-dependency.enum'
import type { CreateTaskDependencyPayload } from '../../domain/model/task-dependency'

const TYPE_OPTIONS = [
  { value: DependencyType.FinishToStart, label: 'Finish to Start (FS)' },
  { value: DependencyType.StartToStart, label: 'Start to Start (SS)' },
  { value: DependencyType.FinishToFinish, label: 'Finish to Finish (FF)' },
  { value: DependencyType.StartToFinish, label: 'Start to Finish (SF)' },
]

interface AddTaskDependencyModalProps {
  open: boolean
  currentTaskId: string
  onClose: () => void
  onSubmit: (body: CreateTaskDependencyPayload) => Promise<void>
}

export function AddTaskDependencyModal({
  open,
  currentTaskId,
  onClose,
  onSubmit,
}: AddTaskDependencyModalProps) {
  const [role, setRole] = useState<'successor' | 'predecessor'>('successor')
  const [otherTaskId, setOtherTaskId] = useState('')
  const [dependencyType, setDependencyType] = useState<string>(DependencyType.FinishToStart)
  const [lagDays, setLagDays] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!otherTaskId.trim()) return
    setSubmitting(true)
    try {
      const body: CreateTaskDependencyPayload = {
        predecessorTaskId: role === 'predecessor' ? currentTaskId : otherTaskId.trim(),
        successorTaskId: role === 'predecessor' ? otherTaskId.trim() : currentTaskId,
        dependencyType: dependencyType as typeof DependencyType[keyof typeof DependencyType],
        lagDays: lagDays ? Number(lagDays) : null,
      }
      await onSubmit(body)
      setOtherTaskId('')
      setLagDays('')
      setDependencyType(DependencyType.FinishToStart)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add dependency">
      <Stack direction="vertical" spacing="md">
        <div>
          <Typography variant="small" tone="muted" className="mb-1">
            This task is the
          </Typography>
          <Stack direction="horizontal" spacing="sm">
            <Button
              size="sm"
              variant={role === 'successor' ? 'primary' : 'secondary'}
              onClick={() => setRole('successor')}
            >
              Successor (depends on)
            </Button>
            <Button
              size="sm"
              variant={role === 'predecessor' ? 'primary' : 'secondary'}
              onClick={() => setRole('predecessor')}
            >
              Predecessor (blocks)
            </Button>
          </Stack>
        </div>
        <Input
          label={role === 'successor' ? 'Predecessor task ID' : 'Successor task ID'}
          fullWidth
          placeholder="UUID of the other task"
          value={otherTaskId}
          onChange={(e) => setOtherTaskId(e.target.value)}
        />
        <Select
          label="Dependency type"
          value={dependencyType}
          onValueChange={setDependencyType}
          options={TYPE_OPTIONS}
          fullWidth
        />
        <Input
          label="Lag days (optional)"
          type="number"
          fullWidth
          value={lagDays}
          onChange={(e) => setLagDays(e.target.value)}
          placeholder="0"
        />
        <Stack direction="horizontal" spacing="sm" className="justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={() => void handleSubmit()}>
            Add
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
