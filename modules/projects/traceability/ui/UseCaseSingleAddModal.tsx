'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, Modal, SearchableSelect, Textarea, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import type { CreateUseCaseBody } from '../model/use-case'
import type { FunctionalItem } from '../model/functional-catalog'

interface Props {
  open: boolean
  functionalItems: FunctionalItem[]
  onClose: () => void
  onCreate: (body: CreateUseCaseBody) => Promise<unknown>
}

export function UseCaseSingleAddModal({ open, functionalItems, onClose, onCreate }: Props) {
  const functionOptions = useMemo(
    () => functionalItems.map((fi) => ({ value: fi.id, label: `${fi.code} · ${fi.title}` })),
    [functionalItems]
  )
  const [functionId, setFunctionId] = useState('')
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [actor, setActor] = useState('')
  const [goal, setGoal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFunctionId(functionalItems[0]?.id ?? '')
    setKey('')
    setName('')
    setActor('')
    setGoal('')
    setSubmitting(false)
    setError(null)
  }, [open, functionalItems])

  const handleSubmit = async () => {
    const k = key.trim()
    const n = name.trim()
    if (!functionId || !k || !n) {
      setError('Function, key, and name are required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onCreate({
        primaryFunctionId: functionId,
        key: k,
        name: n,
        goal: goal.trim() || null,
        primaryActorName: actor.trim() || null,
      })
      onClose()
    } catch (err: unknown) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Key already exists in this project'
          : err instanceof Error
            ? err.message
            : 'Failed to create'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add use case"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Creating…' : 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: submitting || !functionId || !key.trim() || !name.trim(),
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-3">
        <div>
          <Typography variant="small" className="mb-1.5">
            Function <span className="text-red-500">*</span>
          </Typography>
          <SearchableSelect
            options={functionOptions}
            value={functionId}
            onValueChange={setFunctionId}
            placeholder="Select a function…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Key *"
            fullWidth
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="UC-001"
          />
          <Input
            label="Primary Actor"
            fullWidth
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="End user"
          />
        </div>

        <Input
          label="Name *"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Use case name"
        />

        <Textarea
          label="Goal"
          fullWidth
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Optional goal statement"
        />

        {error ? (
          <Typography tone="error" variant="small">
            {error}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
