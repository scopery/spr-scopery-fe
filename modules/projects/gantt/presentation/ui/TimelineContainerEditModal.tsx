'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, Input, Modal, Select, Stack, Textarea, Typography } from '@/shared/ui'
import { WBS_NODE_TYPE_OPTIONS, WbsNodeType } from '@/modules/projects/wbs'
import { toast } from 'sonner'
import type {
  TimelineContainerEditValues,
  TimelineFlatRow,
} from '../../domain/model/timeline'

export type { TimelineContainerEditValues }

type Props = {
  open: boolean
  row: TimelineFlatRow | null
  saving?: boolean
  onClose: () => void
  onSave: (values: TimelineContainerEditValues) => Promise<void>
  onFocus?: () => void
  onAddTask?: () => void
}

function modalTitle(row: TimelineFlatRow | null): string {
  if (!row) return 'Edit'
  if (row.itemType === 'PROJECT') return 'Edit project'
  if (row.itemType === 'WBS_NODE') return 'Edit planning element'
  return 'Edit phase'
}

export function TimelineContainerEditModal({
  open,
  row,
  saving = false,
  onClose,
  onSave,
  onFocus,
  onAddTask,
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [nodeType, setNodeType] = useState<string>(WbsNodeType.WorkPackage)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !row) return
    setTitle(row.displayPrimary || row.title || '')
    setDescription(row.phaseDescription ?? '')
    setStartDate(row.startDate ?? '')
    setEndDate(row.endDate ?? '')
    setNodeType(
      row.wbsNodeType === 'DELIVERABLE'
        ? WbsNodeType.Milestone
        : row.wbsNodeType || WbsNodeType.WorkPackage
    )
    setError(null)
  }, [open, row])

  const isWbs = row?.itemType === 'WBS_NODE'
  const isPhase = row?.itemType === 'PHASE'
  const isProject = row?.itemType === 'PROJECT'
  const canEditTitle = isPhase || isWbs || isProject
  const canEditDates = isPhase || isProject || isWbs
  const datesShiftChildren = isPhase || isWbs

  const handleCopyId = async () => {
    if (!row?.sourceEntityId) return
    try {
      await navigator.clipboard.writeText(row.sourceEntityId)
      setCopied(true)
      toast.success(`${isWbs ? 'Planning element' : 'Item'} id copied`)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy id')
    }
  }

  const handleSave = async () => {
    const trimmed = title.trim()
    if (canEditTitle && !trimmed) {
      setError('Name is required')
      return
    }
    if (canEditDates) {
      if (startDate && endDate && endDate < startDate) {
        setError('End date must be on or after start date')
        return
      }
      if ((startDate && !endDate) || (!startDate && endDate)) {
        setError('Set both start and end dates, or clear both')
        return
      }
    }
    setError(null)
    await onSave({
      title: trimmed,
      description: description.trim(),
      startDate,
      endDate,
      nodeType: isWbs ? nodeType : undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={modalTitle(row)} size="md">
      <Stack direction="vertical" spacing="md">
        {row?.phaseCode ? (
          <Typography variant="small" tone="muted">
            Code: {row.phaseCode}
          </Typography>
        ) : null}

        {row?.sourceEntityId ? (
          <div className="flex items-start justify-between gap-3 rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
            <div className="min-w-0">
              <Typography variant="small" tone="muted">
                {isWbs ? 'Planning element id' : 'Item id'}
              </Typography>
              <Typography
                variant="caption"
                className="block truncate font-mono text-neutral-700"
                title={row.sourceEntityId}
              >
                {row.sourceEntityId}
              </Typography>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={() => void handleCopyId()}
              aria-label="Copy item id"
            >
              {copied ? 'Copied' : 'Copy id'}
            </Button>
          </div>
        ) : null}

        {canEditTitle ? (
          <Input
            label={isWbs ? 'Title' : 'Name'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        ) : null}

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {isWbs ? (
          <div>
            <Typography variant="small" className="mb-1.5">
              Element type
            </Typography>
            <Select
              value={nodeType}
              onValueChange={setNodeType}
              options={[...WBS_NODE_TYPE_OPTIONS]}
            />
          </div>
        ) : null}

        {canEditDates ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start date"
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End date"
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {datesShiftChildren ? (
              <Typography variant="small" tone="muted">
                Changing the start date shifts scheduled child tasks by the same number of days.
                {isWbs
                  ? ' Planning element dates are saved; changing start also shifts scheduled child tasks.'
                  : ' Phase planned dates are saved on the phase.'}
              </Typography>
            ) : null}
          </>
        ) : null}

        {error ? (
          <Typography variant="small" className="text-error">
            {error}
          </Typography>
        ) : null}

        <Stack direction="horizontal" spacing="sm" className="flex-wrap justify-end">
          {isPhase && onFocus ? (
            <Button variant="ghost" size="sm" onClick={onFocus} disabled={saving}>
              Focus phase
            </Button>
          ) : null}
          {isPhase && onAddTask ? (
            <Button variant="outline" size="sm" onClick={onAddTask} disabled={saving}>
              Add task
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={() => void handleSave()}>
            Save
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
