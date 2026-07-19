'use client'

import { Button, Stack, Typography } from '@/shared/ui'
import { useDocumentSuggestions } from '../hooks/useDocumentSuggestions'

export function DocumentSuggestionsPanel({
  projectId,
  documentId,
  onAccepted,
}: {
  projectId: string
  documentId: string
  onAccepted?: () => void
}) {
  const { items, loading, error, accept, reject } = useDocumentSuggestions(
    projectId,
    documentId,
    onAccepted
  )

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Suggestions</Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      {loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          Loading…
        </Typography>
      ) : null}
      {!loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          No suggestions. AI rewrites will appear here for accept/reject.
        </Typography>
      ) : null}
      <ul className="space-y-sm">
        {items.map((s) => (
          <li key={s.id} className="border border-neutral-100 p-sm text-sm">
            <Typography variant="small" weight="medium">
              {s.description || `Suggestion @ rev ${s.targetRevisionNo}`}
            </Typography>
            <Typography variant="caption" tone="muted">
              {s.status}
              {s.acceptedRevisionNo != null ? ` → rev ${s.acceptedRevisionNo}` : ''}
            </Typography>
            {s.status === 'PENDING' ? (
              <div className="mt-xs flex gap-xs">
                <Button size="sm" variant="primary" onClick={() => void accept(s.id)}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => void reject(s.id)}>
                  Reject
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Stack>
  )
}
