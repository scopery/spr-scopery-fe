'use client'

import { useEffect, useMemo, useState } from 'react'
import { Checkbox, Modal, Typography } from '@/shared/ui'
import { listRequirements } from '@/modules/projects/requirements/api/requirements.api'
import type { Requirement } from '@/modules/projects/requirements/model/requirements'
import { cn } from '@/utils/cn'

interface LinkRequirementsModalProps {
  open: boolean
  projectId: string
  /** Already linked requirement ids — hidden or disabled in picker */
  linkedIds: Set<string>
  onClose: () => void
  onSubmit: (requirementIds: string[]) => Promise<void>
}

export function LinkRequirementsModal({
  open,
  projectId,
  linkedIds,
  onClose,
  onSubmit,
}: LinkRequirementsModalProps) {
  const [all, setAll] = useState<Requirement[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setError(null)
    setLoading(true)
    void listRequirements('', projectId)
      .then((res) => setAll(res.items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load requirements'))
      .finally(() => setLoading(false))
  }, [open, projectId])

  const candidates = useMemo(
    () => all.filter((r) => !linkedIds.has(r.id)),
    [all, linkedIds]
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) return
    setSubmitting(true)
    try {
      await onSubmit([...selected])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link requirements"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: selected.size ? `Link ${selected.size}` : 'Link',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading: submitting,
          disabled: selected.size === 0 || loading,
        },
      ]}
    >
      <div className="space-y-3">
        <Typography variant="small" tone="muted">
          Select requirements to include in this scope package.
        </Typography>
        {error ? (
          <Typography variant="small" tone="error">
            {error}
          </Typography>
        ) : null}
        {loading ? (
          <Typography variant="small" tone="muted">
            Loading…
          </Typography>
        ) : candidates.length === 0 ? (
          <Typography variant="small" tone="muted">
            No unlinked requirements available.
          </Typography>
        ) : (
          <ul className="max-h-72 overflow-y-auto border border-neutral-200">
            {candidates.map((r) => {
              const checked = selected.has(r.id)
              return (
                <li key={r.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-neutral-100',
                      checked && 'bg-neutral-50'
                    )}
                  >
                    <Checkbox
                      size="sm"
                      checked={checked}
                      onChange={() => toggle(r.id)}
                      aria-label={r.title}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-neutral-900">{r.title}</span>
                      <span className="text-xs text-neutral-500">
                        {r.code}
                        {r.type || r.req_type ? ` · ${r.type || r.req_type}` : ''}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
