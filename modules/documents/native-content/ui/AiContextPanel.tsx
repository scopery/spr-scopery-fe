'use client'

import { Button, Stack, Typography } from '@/shared/ui'
import { useAiContext } from '../hooks/useAiContext'

export function AiContextPanel({
  projectId,
  documentId,
}: {
  projectId: string
  documentId: string
}) {
  const { result, audit, resolving, loadingAudit, resolve, loadAudit } = useAiContext(
    projectId,
    documentId
  )

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">AI context</Typography>
      <Typography variant="caption" tone="muted">
        Preview the plain-text context slice and citations sent to AI (actor permissions apply).
      </Typography>

      <div className="flex flex-wrap gap-xs">
        <Button size="sm" disabled={resolving} onClick={() => void resolve()}>
          Resolve context
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loadingAudit}
          onClick={() => void loadAudit()}
        >
          Audit log
        </Button>
      </div>

      {result ? (
        <Stack direction="vertical" spacing="xs">
          <Typography variant="small" weight="medium">
            {result.tokenCount} tokens · {result.blockCount} blocks
          </Typography>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap border border-neutral-200 bg-neutral-50 p-xs text-xs">
            {result.contextText || '(empty)'}
          </pre>
          {result.citations?.length ? (
            <ul className="divide-y divide-neutral-200">
              {result.citations.map((c) => (
                <li key={`${c.blockId}-${c.documentId}`} className="py-xs text-xs text-neutral-600">
                  {c.headingPath || 'Untitled section'}
                  {c.documentTitle ? ` · ${c.documentTitle}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </Stack>
      ) : null}

      {audit.length ? (
        <ul className="divide-y divide-neutral-200">
          {audit.map((entry) => (
            <li key={entry.id} className="py-xs text-xs text-neutral-600">
              {entry.status ?? '—'}
              {entry.tokenCount != null ? ` · ${entry.tokenCount} tok` : ''}
              {entry.errorMessage ? ` · ${entry.errorMessage}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </Stack>
  )
}
