'use client'

import { Typography } from '@/shared/ui'
import type { DeliverableDocumentSetSummaryProps } from '../model/deliverables'

export function DeliverableDocumentSetSummary({
  documentTitles,
  selectedCount,
  crossProjectWarning,
}: DeliverableDocumentSetSummaryProps) {
  if (selectedCount === 0) return null

  return (
    <div className="border-border bg-muted/30 space-y-2 rounded-md border p-3">
      <Typography variant="small" weight="medium">
        Document set ({selectedCount} selected)
      </Typography>
      {crossProjectWarning ? (
        <Typography variant="small" tone="error">
          {crossProjectWarning}
        </Typography>
      ) : null}
      <Typography as="ul" variant="small" tone="muted" className="max-h-32 space-y-1 overflow-auto">
        {documentTitles.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </Typography>
    </div>
  )
}
