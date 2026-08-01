'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Card, Modal, Select, Typography } from '@/shared/ui'
import { TraceLinkType } from '../../domain/enums/quality.enum'
import type { QualityCreateInput } from './quality-bulk.model'
import { TRACE_ENTITY_TYPE_OPTIONS, TraceEntitySearchSelect } from './TraceEntitySearchSelect'

interface TraceLinkDraft {
  key: string
  sourceType: string
  sourceId: string
  targetType: string
  targetId: string
  linkType: string
  error?: string | null
}

interface TraceLinkBulkAddModalProps {
  open: boolean
  onClose: () => void
  onCreate: (input: QualityCreateInput) => Promise<void>
  onBatchComplete?: () => Promise<void> | void
}

function newDraft(): TraceLinkDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceType: 'REQUIREMENT',
    sourceId: '',
    targetType: 'TEST_CASE',
    targetId: '',
    linkType: TraceLinkType.TestedBy,
  }
}

function isComplete(row: TraceLinkDraft): boolean {
  return Boolean(row.sourceType && row.sourceId && row.targetType && row.targetId && row.linkType)
}

export function TraceLinkBulkAddModal({
  open,
  onClose,
  onCreate,
  onBatchComplete,
}: TraceLinkBulkAddModalProps) {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const [rows, setRows] = useState<TraceLinkDraft[]>([newDraft()])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const completeCount = rows.filter(isComplete).length

  const update = (key: string, changes: Partial<TraceLinkDraft>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes, error: null } : row))
    )
  }

  const remove = (key: string) => {
    setRows((current) =>
      current.length === 1 ? [newDraft()] : current.filter((row) => row.key !== key)
    )
  }

  const submit = async () => {
    if (completeCount !== rows.length) {
      setFormError('Select both entities for every Trace Link.')
      return
    }
    if (rows.length > 1) {
      setFormError(
        'Async bulk create is not available for Trace Links yet. Add one link at a time (no FE loop).'
      )
      return
    }
    setSubmitting(true)
    setFormError(null)
    const row = rows[0]!
    try {
      await onCreate({
        kind: 'TRACE_LINK',
        payload: {
          sourceType: row.sourceType,
          sourceId: row.sourceId,
          targetType: row.targetType,
          targetId: row.targetId,
          linkType: row.linkType,
        },
      })
      await onBatchComplete?.()
      setRows([newDraft()])
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create link')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk add Trace Links"
      size="2xl"
      actions={[
        { label: 'Cancel', variant: 'ghost', disabled: submitting, onClick: onClose },
        {
          label: submitting ? 'Creating…' : `Create ${completeCount}`,
          variant: 'primary',
          loading: submitting,
          disabled: submitting || completeCount === 0 || completeCount !== rows.length,
          onClick: () => void submit(),
        },
      ]}
    >
      <div className="space-y-md">
        <Typography variant="small" tone="muted">
          Select catalog entities for each link. UUID input is not required.
        </Typography>
        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}
        <div className="space-y-md">
          {rows.map((row, index) => (
            <Card as="section" key={row.key} className="space-y-sm p-md">
              <div className="flex items-center justify-between">
                <Typography variant="small" weight="medium">
                  Link {index + 1}
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  tone="error"
                  icon={<Trash2 size={14} />}
                  aria-label={`Remove Trace Link ${index + 1}`}
                  disabled={submitting}
                  onClick={() => remove(row.key)}
                />
              </div>
              <div className="grid gap-sm lg:grid-cols-2">
                <div className="space-y-sm">
                  <Select
                    label="Source type"
                    value={row.sourceType}
                    options={TRACE_ENTITY_TYPE_OPTIONS}
                    disabled={submitting}
                    onValueChange={(sourceType: string) =>
                      update(row.key, { sourceType, sourceId: '' })
                    }
                  />
                  <TraceEntitySearchSelect
                    workspaceId={workspaceId}
                    projectId={projectId}
                    entityType={row.sourceType}
                    label="Source"
                    value={row.sourceId}
                    required
                    disabled={submitting}
                    onChange={(sourceId) => update(row.key, { sourceId })}
                  />
                </div>
                <div className="space-y-sm">
                  <Select
                    label="Target type"
                    value={row.targetType}
                    options={TRACE_ENTITY_TYPE_OPTIONS}
                    disabled={submitting}
                    onValueChange={(targetType: string) =>
                      update(row.key, { targetType, targetId: '' })
                    }
                  />
                  <TraceEntitySearchSelect
                    workspaceId={workspaceId}
                    projectId={projectId}
                    entityType={row.targetType}
                    label="Target"
                    value={row.targetId}
                    required
                    disabled={submitting}
                    onChange={(targetId) => update(row.key, { targetId })}
                  />
                </div>
              </div>
              <Select
                label="Link type"
                value={row.linkType}
                options={Object.values(TraceLinkType).map((value) => ({
                  value,
                  label: value.replace(/_/g, ' '),
                }))}
                disabled={submitting}
                onValueChange={(linkType: string) => update(row.key, { linkType })}
              />
              {row.error ? (
                <Typography variant="caption" tone="error">
                  {row.error}
                </Typography>
              ) : null}
            </Card>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={<Plus size={14} />}
          disabled={submitting}
          onClick={() => setRows((current) => [...current, newDraft()])}
        >
          Add another link
        </Button>
      </div>
    </Modal>
  )
}
