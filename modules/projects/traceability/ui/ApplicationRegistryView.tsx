'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button, Input, Modal, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { ROUTES } from '@/constants/routes'
import { useApplicationRegistry } from '../hooks/useTraceability'

export function ApplicationRegistryView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, loading, error, create } = useApplicationRegistry(workspaceId)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items ?? []
    return (items ?? []).filter((app) =>
      [app.code, app.name, app.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [items, query])

  const canSubmit = Boolean(name.trim() && code.trim()) && !submitting

  const closeAdd = () => {
    setAddOpen(false)
    setName('')
    setCode('')
    setFormError(null)
  }

  const handleCreate = () => {
    if (!canSubmit) return
    setFormError(null)
    setSubmitting(true)
    void create(name.trim(), code.trim())
      .then(() => {
        closeAdd()
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 409) {
          setFormError('This application code may already exist. Use a unique code and try again.')
          return
        }
        setFormError(err instanceof Error ? err.message : 'Failed to register application')
      })
      .finally(() => setSubmitting(false))
  }

  if (loading) return <PageSkeleton variant="list" className="px-3 py-3 lg:px-4" />
  if (error) {
    return (
      <Stack direction="vertical" spacing="sm" className="px-3 py-3 lg:px-4">
        <Typography tone="error">{error}</Typography>
      </Stack>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col">
        <div className="shrink-0 border-b border-neutral-200 pb-2">
          <Typography as="h1" size="md" weight="medium">
            Applications
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Register apps, then open the workbench.
            {(items ?? []).length
              ? ` · ${(items ?? []).length} app${(items ?? []).length === 1 ? '' : 's'}`
              : ''}
          </Typography>
        </div>

        <div className="mt-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applications…"
              aria-label="Search applications"
              fullWidth
              prefix={<Search size={14} />}
            />
          </div>
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1 inline" />
            Add application
          </Button>
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto border border-neutral-200 bg-white">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Typography weight="medium">
                {(items ?? []).length === 0 ? 'No applications yet' : 'Nothing matches'}
              </Typography>
              <Typography variant="small" tone="muted" className="mt-1">
                {(items ?? []).length === 0
                  ? 'Click Add application to register the first one.'
                  : 'Try a different search.'}
              </Typography>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {filtered.map((app, index) => (
                <li key={app.id}>
                  <Link
                    href={`${ROUTES.workspace.applications(workspaceId)}/${app.id}`}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-neutral-50"
                  >
                    <span className="w-5 shrink-0 pt-0.5 text-xs tabular-nums text-neutral-400">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-calsans truncate text-neutral-900">{app.name}</div>
                      <div className="truncate text-xs text-neutral-500">
                        {[app.code, app.status].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={closeAdd}
        title="Add application"
        size="md"
        actions={[
          { label: 'Cancel', onClick: closeAdd, variant: 'ghost' },
          {
            label: submitting ? 'Creating…' : 'Create',
            onClick: handleCreate,
            variant: 'primary',
            disabled: !canSubmit,
            loading: submitting,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <Typography variant="small" tone="muted">
            Code must be unique in this workspace.
          </Typography>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code (e.g. ACT)"
            aria-label="Application code"
            fullWidth
            required
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            aria-label="Application name"
            fullWidth
            required
          />
          {formError ? (
            <Typography tone="error" variant="small">
              {formError}
            </Typography>
          ) : null}
        </Stack>
      </Modal>
    </div>
  )
}
