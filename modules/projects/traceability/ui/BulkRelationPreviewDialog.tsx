'use client'

import { useMemo, useState } from 'react'
import { Button, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { labelArchitectureNode } from '../model/anchor-mapping'
import {
  BULK_RELATION_PREVIEW_LIMIT,
  type BulkPlan,
} from '../model/structure-relation.rules'

interface BulkRelationPreviewDialogProps {
  open: boolean
  plan: BulkPlan | null
  submitting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function BulkRelationPreviewDialog({
  open,
  plan,
  submitting = false,
  onClose,
  onConfirm,
}: BulkRelationPreviewDialogProps) {
  const [showAll, setShowAll] = useState(false)

  const previewRows = useMemo(() => {
    if (!plan) return []
    const list = plan.candidates
    if (showAll) return list.slice(0, BULK_RELATION_PREVIEW_LIMIT)
    return list.filter((c) => c.status === 'new').slice(0, 40)
  }, [plan, showAll])

  if (!plan) return null

  const kindLabel =
    plan.kind === 'one-to-many'
      ? 'One-to-many'
      : plan.kind === 'many-to-one'
        ? 'Many-to-one'
        : plan.kind === 'many-to-many'
          ? 'Many-to-many'
          : 'One-to-one'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk relation preview"
      size="lg"
      closeOnOverlayClick={!submitting}
      actions={[
        {
          label: 'Cancel',
          variant: 'ghost',
          onClick: onClose,
          disabled: submitting,
        },
        {
          label:
            plan.newCount > 0
              ? `Create ${plan.newCount} relation${plan.newCount === 1 ? '' : 's'}`
              : 'Nothing to create',
          variant: 'secondary',
          onClick: onConfirm,
          disabled: submitting || plan.newCount === 0 || plan.overLimit,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat label="Sources" value={plan.sources.length} />
          <Stat label="Targets" value={plan.targets.length} />
          <Stat label="Type" value={plan.relationType} />
          <Stat label="Mapping" value={kindLabel} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <Stat label="New" value={plan.newCount} tone="ok" />
          <Stat label="Duplicates" value={plan.duplicateCount} />
          <Stat label="Invalid" value={plan.invalidCount} tone="bad" />
        </div>

        {plan.overLimit ? (
          <Typography tone="error" variant="small">
            Preview exceeds {BULK_RELATION_PREVIEW_LIMIT} relations. Narrow the selection
            or use an import/batch tool.
          </Typography>
        ) : null}

        {plan.kind === 'many-to-many' ? (
          <Typography variant="small" tone="muted">
            Many-to-many creates a relation for every source × target pair. Review carefully
            before confirming.
          </Typography>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Typography weight="medium" size="sm">
              {showAll ? 'All candidates' : 'New relations'}
            </Typography>
            <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show new only' : `Review all ${plan.candidates.length}`}
            </Button>
          </div>
          <ul className="max-h-56 space-y-1 overflow-y-auto border border-neutral-100 p-2">
            {previewRows.length === 0 ? (
              <li>
                <Typography variant="small" tone="muted">
                  No rows to show.
                </Typography>
              </li>
            ) : (
              previewRows.map((c, i) => (
                <li
                  key={`${c.body.fromNodeId}-${c.body.toNodeId}-${i}`}
                  className={cn(
                    'flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs',
                    c.status === 'invalid' && 'text-error',
                    c.status === 'duplicate' && 'text-neutral-400'
                  )}
                >
                  <span className="text-neutral-900">{labelArchitectureNode(c.from)}</span>
                  <span className="uppercase text-neutral-500">{plan.relationType}</span>
                  <span className="text-neutral-900">{labelArchitectureNode(c.to)}</span>
                  {c.status !== 'new' ? (
                    <span className="text-[10px] uppercase tracking-wide">
                      {c.status}
                      {c.reason ? ` · ${c.reason}` : ''}
                    </span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Modal>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: 'ok' | 'bad'
}) {
  return (
    <div className="bg-neutral-50 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div
        className={cn(
          'text-sm text-neutral-900',
          tone === 'ok' && 'text-success',
          tone === 'bad' && value !== 0 && 'text-error'
        )}
      >
        {value}
      </div>
    </div>
  )
}
