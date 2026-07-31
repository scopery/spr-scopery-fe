'use client'

import { Button, Modal, Typography } from '@/shared/ui'
import type { BulkLinkResult } from '../hooks/useStructureRelations'

interface BulkRelationResultDialogProps {
  open: boolean
  result: BulkLinkResult | null
  onClose: () => void
  onUndo: () => void
  onViewFailed: () => void
}

export function BulkRelationResultDialog({
  open,
  result,
  onClose,
  onUndo,
  onViewFailed,
}: BulkRelationResultDialogProps) {
  if (!result) return null

  const failedItems = result.items.filter((i) => i.status === 'failed')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk relation completed"
      size="md"
      actions={[
        {
          label: 'Done',
          variant: 'secondary',
          onClick: onClose,
        },
        ...(result.createdRelations.length
          ? [
              {
                label: 'Undo created',
                variant: 'ghost' as const,
                onClick: onUndo,
              },
            ]
          : []),
      ]}
    >
      <div className="space-y-3 text-sm">
        <Row label="Created" value={result.created} />
        <Row label="Skipped — already exists" value={result.skipped} />
        <Row label="Failed" value={result.failed} />

        {failedItems.length > 0 ? (
          <div>
            <Button size="sm" variant="ghost" onClick={onViewFailed}>
              View failed items
            </Button>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto border border-neutral-100 p-2 text-xs">
              {failedItems.map((f, i) => (
                <li key={`${f.body.toNodeId}-${i}`} className="text-error">
                  Source node → {f.body.relationType} → target node
                  {f.message ? ` · ${f.message}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Typography variant="small" tone="muted">
          Duplicates were skipped. Created relations can be undone from this dialog or the
          toast.
        </Typography>
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-1.5">
      <span className="text-neutral-600">{label}</span>
      <span className="text-neutral-900">{value}</span>
    </div>
  )
}
