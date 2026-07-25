'use client'

import { useState } from 'react'
import {
  Button,
  Checkbox,
  DetailDrawer,
  Input,
  Radio,
  Textarea,
  Typography,
} from '@/shared/ui'
import {
  AffectedArea,
  ChangeItemOperation,
} from '../../domain/enums/project-control.enum'
import type { CreateChangeRequestItemPayload } from '../../domain/model/project-control'
import { affectedAreaLabel } from '../../domain/rules/project-control.rules'

type ChangeKind =
  | 'modify_function'
  | 'add_function'
  | 'remove_function'
  | 'modify_task'
  | 'add_task'
  | 'schedule_staffing'

const CHANGE_KINDS: { id: ChangeKind; label: string }[] = [
  { id: 'modify_function', label: 'Modify an existing Function' },
  { id: 'add_function', label: 'Add a new Function' },
  { id: 'remove_function', label: 'Remove or deprecate a Function' },
  { id: 'modify_task', label: 'Modify an existing Task' },
  { id: 'add_task', label: 'Add a new Task' },
  { id: 'schedule_staffing', label: 'Change schedule or staffing' },
]

const FUNCTION_AFFECTED_AREAS = [
  AffectedArea.AcceptanceCriteria,
  AffectedArea.BusinessRules,
  AffectedArea.Screens,
  AffectedArea.Api,
  AffectedArea.Data,
] as const

const TASK_AFFECTED_AREAS = [
  AffectedArea.Estimate,
  AffectedArea.Dates,
  AffectedArea.Assignment,
] as const

const SCHEDULE_AFFECTED_AREAS = [
  AffectedArea.Dates,
  AffectedArea.Estimate,
  AffectedArea.Assignment,
] as const

function areasForKind(kind: ChangeKind): readonly string[] {
  if (kind === 'schedule_staffing') return SCHEDULE_AFFECTED_AREAS
  if (kind.includes('task')) return TASK_AFFECTED_AREAS
  return FUNCTION_AFFECTED_AREAS
}

function kindToPayload(
  kind: ChangeKind,
  summary: string,
  targetId: string,
  affectedAreas: string[]
): CreateChangeRequestItemPayload {
  const id = targetId.trim() || null
  const areas = affectedAreas.length > 0 ? affectedAreas : null
  switch (kind) {
    case 'modify_function':
      return {
        targetType: 'FUNCTION',
        targetId: id,
        operation: ChangeItemOperation.Modify,
        summary,
        affectedAreas: areas,
      }
    case 'add_function':
      return {
        targetType: 'FUNCTION',
        targetId: id,
        operation: ChangeItemOperation.Add,
        summary,
        affectedAreas: areas,
      }
    case 'remove_function':
      return {
        targetType: 'FUNCTION',
        targetId: id,
        operation: ChangeItemOperation.Remove,
        summary,
        affectedAreas: areas,
      }
    case 'modify_task':
      return {
        targetType: 'TASK',
        targetId: id,
        operation: ChangeItemOperation.Modify,
        summary,
        affectedAreas: areas,
      }
    case 'add_task':
      return {
        targetType: 'TASK',
        targetId: id,
        operation: ChangeItemOperation.Add,
        summary,
        affectedAreas: areas,
      }
    case 'schedule_staffing':
      return {
        targetType: 'SCHEDULE',
        targetId: id,
        operation: ChangeItemOperation.Modify,
        summary,
        affectedAreas: areas,
      }
  }
}

function needsExistingTarget(kind: ChangeKind): boolean {
  return (
    kind === 'modify_function' ||
    kind === 'remove_function' ||
    kind === 'modify_task'
  )
}

interface AddChangeDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateChangeRequestItemPayload) => Promise<void>
}

export function AddChangeDrawer({ open, onClose, onSubmit }: AddChangeDrawerProps) {
  const [step, setStep] = useState<'kind' | 'details'>('kind')
  const [kind, setKind] = useState<ChangeKind>('modify_function')
  const [summary, setSummary] = useState('')
  const [targetId, setTargetId] = useState('')
  const [affectedAreas, setAffectedAreas] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setStep('kind')
    setKind('modify_function')
    setSummary('')
    setTargetId('')
    setAffectedAreas([])
    setSaving(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleKindContinue = () => {
    setAffectedAreas([])
    setStep('details')
  }

  const toggleArea = (area: string) => {
    setAffectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  const handleAdd = async () => {
    const text = summary.trim()
    if (!text) return
    setSaving(true)
    try {
      await onSubmit(kindToPayload(kind, text, targetId, affectedAreas))
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  const areaOptions = areasForKind(kind)

  return (
    <DetailDrawer
      open={open}
      onClose={handleClose}
      title="Add proposed change"
      subtitle="Describe what should change in this request"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          {step === 'kind' ? (
            <Button variant="primary" onClick={handleKindContinue}>
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={saving}
              disabled={!summary.trim()}
              onClick={() => void handleAdd()}
            >
              Add change
            </Button>
          )}
        </div>
      }
    >
      {step === 'kind' ? (
        <div className="space-y-3">
          <Typography weight="medium">What is changing?</Typography>
          <div className="space-y-2">
            {CHANGE_KINDS.map((option) => (
              <div
                key={option.id}
                className="border border-neutral-200 px-3 py-2.5 hover:bg-neutral-50"
              >
                <Radio
                  name="change-kind"
                  value={option.id}
                  checked={kind === option.id}
                  onChange={() => setKind(option.id)}
                  label={option.label}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            className="text-sm text-primary underline-offset-2 hover:underline"
            onClick={() => setStep('kind')}
          >
            ← Change type
          </button>
          <Typography variant="small" tone="muted">
            {CHANGE_KINDS.find((k) => k.id === kind)?.label}
          </Typography>
          {needsExistingTarget(kind) || kind === 'add_function' || kind === 'add_task' ? (
            <Input
              label={
                needsExistingTarget(kind)
                  ? 'Target ID (optional)'
                  : 'Reference ID (optional)'
              }
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Paste Function or Task ID if known"
              helperText="You can leave this blank and describe the target in the change text."
            />
          ) : null}
          <Textarea
            label="Describe the requested change"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            placeholder="What should change, and why does it matter?"
            required
          />
          <div>
            <Typography variant="small" weight="medium" className="mb-2">
              Affected areas
            </Typography>
            <div className="space-y-2">
              {areaOptions.map((area) => (
                <Checkbox
                  key={area}
                  label={affectedAreaLabel(area)}
                  checked={affectedAreas.includes(area)}
                  onChange={() => toggleArea(area)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </DetailDrawer>
  )
}
