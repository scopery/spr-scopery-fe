'use client'

import { Typography } from '@/shared/ui'

interface DeliverableDocumentSetSummaryProps {
  documentTitles: string[]
  selectedCount: number
  crossProjectWarning?: string | null
}

export function DeliverableDocumentSetSummary({
  documentTitles,
  selectedCount,
  crossProjectWarning,
}: DeliverableDocumentSetSummaryProps) {
  if (selectedCount === 0) return null

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
      <Typography variant="body-sm" className="font-medium">
        Document set ({selectedCount} selected)
      </Typography>
      {crossProjectWarning ? (
        <Typography variant="body-sm" className="text-destructive">
          {crossProjectWarning}
        </Typography>
      ) : null}
      <ul className="max-h-32 overflow-auto text-sm text-muted-foreground space-y-1">
        {documentTitles.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </ul>
    </div>
  )
}
