'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input, Modal, Select, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import type { CatalogAddKind } from './CatalogBulkAddModal'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

interface CatalogSingleAddModalProps {
  open: boolean
  kind: CatalogAddKind
  title: string
  onClose: () => void
  onCreate: (input: {
    kind: CatalogAddKind
    code: string
    name: string
    extra?: string
  }) => Promise<void>
}

function labelsFor(kind: CatalogAddKind): {
  code: string
  name: string
  extra: string | null
  codePlaceholder: string
  namePlaceholder: string
  extraPlaceholder?: string
} {
  switch (kind) {
    case 'MODULE':
      return {
        code: 'Code',
        name: 'Name',
        extra: 'Description',
        codePlaceholder: 'CART',
        namePlaceholder: 'Cart',
        extraPlaceholder: 'Optional',
      }
    case 'SCREEN':
      return {
        code: 'Code',
        name: 'Name',
        extra: 'Route path',
        codePlaceholder: 'CART_VIEW',
        namePlaceholder: 'Cart',
        extraPlaceholder: '/cart',
      }
    case 'API_ENDPOINT':
      return {
        code: 'Method',
        name: 'Path pattern',
        extra: 'Name',
        codePlaceholder: 'GET',
        namePlaceholder: '/carts/{id}',
        extraPlaceholder: 'Optional',
      }
    case 'COMPONENT':
      return {
        code: 'Code',
        name: 'Name',
        extra: 'Component type',
        codePlaceholder: 'BTN_PRIMARY',
        namePlaceholder: 'Primary button',
        extraPlaceholder: 'Optional',
      }
    case 'DATA_ENTITY':
      return {
        code: 'Code',
        name: 'Name',
        extra: 'Table name',
        codePlaceholder: 'CART_ITEM',
        namePlaceholder: 'Cart item',
        extraPlaceholder: 'cart_items',
      }
  }
}

export function CatalogSingleAddModal({
  open,
  kind,
  title,
  onClose,
  onCreate,
}: CatalogSingleAddModalProps) {
  const labels = labelsFor(kind)
  const [code, setCode] = useState(kind === 'API_ENDPOINT' ? 'GET' : '')
  const [name, setName] = useState('')
  const [extra, setExtra] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  const methodOptions = useMemo(
    () => HTTP_METHODS.map((m) => ({ value: m, label: m })),
    []
  )

  useEffect(() => {
    if (!open) return
    setCode(kind === 'API_ENDPOINT' ? 'GET' : '')
    setName('')
    setExtra('')
    setSubmitting(false)
    submittingRef.current = false
    setError(null)
  }, [open, kind])

  const handleSubmit = async () => {
    if (submittingRef.current) return
    const c = code.trim()
    const n = name.trim()
    if (!c || !n) {
      setError(`${labels.code} and ${labels.name} are required`)
      return
    }
    if (kind === 'API_ENDPOINT' && !HTTP_METHODS.includes(c.toUpperCase() as (typeof HTTP_METHODS)[number])) {
      setError('Method must be GET, POST, PUT, PATCH, or DELETE')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      await onCreate({
        kind,
        code: kind === 'API_ENDPOINT' ? c.toUpperCase() : c,
        name: n,
        extra: extra.trim() || undefined,
      })
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof ApiError && err.status === 409
          ? err.problem.code === 'RESOURCE_CONFLICT'
            ? err.message || 'Conflict — reload and retry, or use a different code'
            : 'Already exists'
          : err instanceof Error
            ? err.message
            : 'Failed to create'
      setError(message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Creating…' : 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: submitting || !code.trim() || !name.trim(),
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-3">
        {kind === 'API_ENDPOINT' ? (
          <div>
            <Typography variant="small" className="mb-1.5">
              {labels.code} *
            </Typography>
            <Select
              options={methodOptions}
              value={code}
              onValueChange={setCode}
            />
          </div>
        ) : (
          <Input
            label={`${labels.code} *`}
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={labels.codePlaceholder}
          />
        )}

        <Input
          label={`${labels.name} *`}
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.namePlaceholder}
        />

        {labels.extra ? (
          <Input
            label={labels.extra}
            fullWidth
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={labels.extraPlaceholder}
          />
        ) : null}

        {error ? (
          <Typography tone="error" variant="small">
            {error}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
