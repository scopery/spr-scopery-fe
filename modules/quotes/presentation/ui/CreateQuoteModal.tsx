'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import type { CreateQuotePayload } from '../../domain/model/quote'

interface FinanceScenarioOption {
  id: string
  label: string
}

interface CreateQuoteModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateQuotePayload) => Promise<void>
  financeScenarios: FinanceScenarioOption[]
}

export function CreateQuoteModal({
  open,
  onClose,
  onSubmit,
  financeScenarios,
}: CreateQuoteModalProps) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sourceFinanceScenarioId, setSourceFinanceScenarioId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientContactName, setClientContactName] = useState('')
  const [clientReference, setClientReference] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode('')
    setTitle('')
    setDescription('')
    setSourceFinanceScenarioId(financeScenarios[0]?.id ?? '')
    setClientName('')
    setClientCompany('')
    setClientEmail('')
    setClientContactName('')
    setClientReference('')
  }, [open, financeScenarios])

  const canSubmit = code.trim().length > 0 && title.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || null,
        sourceFinanceScenarioId: sourceFinanceScenarioId || null,
        clientName: clientName.trim() || null,
        clientCompany: clientCompany.trim() || null,
        clientEmail: clientEmail.trim() || null,
        clientContactName: clientContactName.trim() || null,
        clientReference: clientReference.trim() || null,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create quote"
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !canSubmit,
        },
      ]}
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Code"
            fullWidth
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="QT-2026-001"
          />
          <Input
            label="Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Description
          </Typography>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Source finance scenario
          </Typography>
          <Select
            value={sourceFinanceScenarioId}
            onValueChange={setSourceFinanceScenarioId}
            options={[
              { value: '', label: 'None' },
              ...financeScenarios.map((s) => ({ value: s.id, label: s.label })),
            ]}
          />
        </div>
        <Typography weight="medium">Client</Typography>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Client name"
            fullWidth
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <Input
            label="Company"
            fullWidth
            value={clientCompany}
            onChange={(e) => setClientCompany(e.target.value)}
          />
          <Input
            label="Email"
            fullWidth
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
          <Input
            label="Contact"
            fullWidth
            value={clientContactName}
            onChange={(e) => setClientContactName(e.target.value)}
          />
          <Input
            label="Reference"
            fullWidth
            value={clientReference}
            onChange={(e) => setClientReference(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
