'use client'

import { Button, Stack, Typography } from '@/shared/ui'
import { useDocumentRevisionHistory } from '../hooks/useDocumentRevisionHistory'

export function DocumentHistoryPanel({
  projectId,
  documentId,
  onRestored,
}: {
  projectId: string
  documentId: string
  onRestored?: () => void
}) {
  const { items, loading, error, restoringNo, restore } = useDocumentRevisionHistory(
    projectId,
    documentId,
    onRestored
  )

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">History</Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      {loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          Loading…
        </Typography>
      ) : null}
      {!loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          No revisions yet. Save the document to create history.
        </Typography>
      ) : null}
      <ul className="divide-y divide-neutral-200">
        {items.map((r) => (
          <li key={r.id ?? String(r.revisionNo)} className="flex items-center justify-between gap-sm py-xs text-sm">
            <div>
              <Typography variant="small" weight="medium">
                Rev {r.revisionNo}
              </Typography>
              <Typography variant="caption" tone="muted">
                {r.revisionType}
                {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleString()}` : ''}
              </Typography>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={restoringNo === r.revisionNo}
              onClick={() => {
                if (
                  typeof window !== 'undefined' &&
                  !window.confirm(`Restore to revision ${r.revisionNo}? This creates a new revision.`)
                ) {
                  return
                }
                void restore(r.revisionNo)
              }}
            >
              Restore
            </Button>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
