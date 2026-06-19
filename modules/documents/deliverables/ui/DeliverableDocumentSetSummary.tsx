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
      <Typography variant="body-sm" className="font-medium">
        Document set ({selectedCount} selected)
      </Typography>
      {crossProjectWarning ? (
        <Typography variant="body-sm" className="text-destructive">
          {crossProjectWarning}
        </Typography>
      ) : null}
      <ul className="text-muted-foreground max-h-32 space-y-1 overflow-auto text-sm">
        {documentTitles.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </ul>
    </div>
  )
}
