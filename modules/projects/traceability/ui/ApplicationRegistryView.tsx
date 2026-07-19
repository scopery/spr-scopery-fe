'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  Input,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'

import { ApiError } from '@/shared/lib/api-types'
import { useApplicationRegistry } from '../hooks/useTraceability'

export function ApplicationRegistryView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, loading, error, create } = useApplicationRegistry(workspaceId)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  const canSubmit = Boolean(name.trim() && code.trim()) && !submitting

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Application Registry</Typography>
      <Typography tone="muted">
        Register applications and architecture components for requirements and traceability.
      </Typography>
      <div className="flex flex-wrap gap-sm">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code"
          aria-label="Application code"
          required
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-label="Application name"
          required
        />
        <Button
          disabled={!canSubmit}
          onClick={() => {
            setFormError(null)
            setSubmitting(true)
            void create(name.trim(), code.trim())
              .then(() => {
                setName('')
                setCode('')
              })
              .catch((err: unknown) => {
                if (err instanceof ApiError && err.status === 409) {
                  setFormError(
                    'This application code may already exist, or the server rejected a concurrent change. Use a unique code and try again.'
                  )
                  return
                }
                setFormError(err instanceof Error ? err.message : 'Failed to register application')
              })
              .finally(() => setSubmitting(false))
          }}
        >
          Register
        </Button>
      </div>
      {formError ? <Typography tone="error">{formError}</Typography> : null}
      {(items ?? []).length === 0 ? (
        <Typography tone="muted">No applications yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {(items ?? []).map((app) => (
            <li key={app.id} className="p-md">
              <Typography variant="small" weight="medium">
                {app.name}
              </Typography>
              <Typography variant="caption" tone="muted">
                {[app.code, app.status].filter(Boolean).join(' · ')}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
