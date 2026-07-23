'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  FunctionalItemPriority,
  FunctionalItemType,
  NonFunctionalCategory,
  NonFunctionalScopeType,
} from '../model/functional-catalog'
import type {
  FunctionalCatalogAddKind,
  FunctionalCatalogBulkCreateInput,
} from './FunctionalCatalogBulkAddModal'

interface FunctionalCatalogSingleAddModalProps {
  open: boolean
  kind: FunctionalCatalogAddKind
  onClose: () => void
  onCreate: (input: FunctionalCatalogBulkCreateInput) => Promise<void>
}

const PRIORITY_OPTIONS = Object.values(FunctionalItemPriority).map((v) => ({
  value: v,
  label: v,
}))

const TYPE_OPTIONS = Object.values(FunctionalItemType).map((v) => ({
  value: v,
  label: v,
}))

const CATEGORY_OPTIONS = Object.values(NonFunctionalCategory).map((v) => ({
  value: v,
  label: v,
}))

const SCOPE_OPTIONS = Object.values(NonFunctionalScopeType).map((v) => ({
  value: v,
  label: v,
}))

export function FunctionalCatalogSingleAddModal({
  open,
  kind,
  onClose,
  onCreate,
}: FunctionalCatalogSingleAddModalProps) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<string>(FunctionalItemPriority.Medium)
  const [type, setType] = useState<string>(FunctionalItemType.Functional)
  const [category, setCategory] = useState<string>(NonFunctionalCategory.Other)
  const [scopeType, setScopeType] = useState<string>(NonFunctionalScopeType.System)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCode('')
    setTitle('')
    setPriority(FunctionalItemPriority.Medium)
    setType(FunctionalItemType.Functional)
    setCategory(NonFunctionalCategory.Other)
    setScopeType(NonFunctionalScopeType.System)
    setDescription('')
    setSubmitting(false)
    setError(null)
  }, [open, kind])

  const handleSubmit = async () => {
    const c = code.trim()
    const t = title.trim()
    if (!c || !t) {
      setError('Code and title are required')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (kind === 'FR') {
        await onCreate({
          kind,
          code: c,
          title: t,
          priority,
          type,
          description: description.trim() || undefined,
        })
      } else {
        await onCreate({
          kind,
          code: c,
          title: t,
          priority,
          category,
          scopeType,
          description: description.trim() || undefined,
        })
      }
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof ApiError && err.status === 409
          ? 'Code already exists'
          : err instanceof Error
            ? err.message
            : 'Failed to create'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const modalTitle = kind === 'FR' ? 'Add functional item' : 'Add non-functional item'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Creating…' : 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: submitting || !code.trim() || !title.trim(),
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-3">
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={kind === 'FR' ? 'FR-001' : 'NFR-001'}
        />
        <Input
          label="Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === 'FR' ? 'User login' : 'p95 latency < 200ms'}
        />

        {kind === 'FR' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Typography variant="small" className="mb-1.5">
                Priority
              </Typography>
              <Select
                options={PRIORITY_OPTIONS}
                value={priority}
                onValueChange={setPriority}
              />
            </div>
            <div>
              <Typography variant="small" className="mb-1.5">
                Type
              </Typography>
              <Select options={TYPE_OPTIONS} value={type} onValueChange={setType} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Typography variant="small" className="mb-1.5">
                Category
              </Typography>
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onValueChange={setCategory}
              />
            </div>
            <div>
              <Typography variant="small" className="mb-1.5">
                Priority
              </Typography>
              <Select
                options={PRIORITY_OPTIONS}
                value={priority}
                onValueChange={setPriority}
              />
            </div>
            <div>
              <Typography variant="small" className="mb-1.5">
                Scope
              </Typography>
              <Select
                options={SCOPE_OPTIONS}
                value={scopeType}
                onValueChange={setScopeType}
              />
            </div>
          </div>
        )}

        <Textarea
          label="Description"
          fullWidth
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
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
