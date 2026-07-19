'use client'

import { Button, Stack, Typography } from '@/shared/ui'
import { useClientVisibility } from '../hooks/useClientVisibility'

export function ClientVisibilityPanel({
  projectId,
  documentId,
}: {
  projectId: string
  documentId: string
}) {
  const { validation, clientVisible, busy, validate, enable, disable } = useClientVisibility(
    projectId,
    documentId
  )

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Client visibility</Typography>
      <Typography variant="caption" tone="muted">
        Validate mentions and classification before sharing this document with clients.
      </Typography>
      {clientVisible != null ? (
        <Typography variant="small">
          Status: {clientVisible ? 'Visible to clients' : 'Internal only'}
        </Typography>
      ) : null}

      <div className="flex flex-wrap gap-xs">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void validate()}>
          Validate
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void enable()}>
          Enable
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void disable()}>
          Disable
        </Button>
      </div>

      {validation ? (
        <Stack direction="vertical" spacing="xs">
          <Typography variant="small" weight="medium">
            {validation.valid ? 'Ready for client visibility' : 'Blocking issues'}
          </Typography>
          {validation.issues.length === 0 ? (
            <Typography variant="caption" tone="muted">
              No issues found.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {validation.issues.map((issue, i) => (
                <li key={`${issue.issueType}-${i}`} className="py-xs text-sm">
                  <Typography variant="small" weight="medium">
                    {issue.issueType}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {issue.message}
                  </Typography>
                </li>
              ))}
            </ul>
          )}
        </Stack>
      ) : null}
    </Stack>
  )
}
