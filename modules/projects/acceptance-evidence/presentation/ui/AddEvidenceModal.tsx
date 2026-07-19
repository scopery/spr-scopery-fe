'use client'

import { useState } from 'react'
import { Button, Input, Modal, Select, Stack } from '@/shared/ui'
import { EvidenceType } from '../../domain/enums/evidence.enum'
import type { AddEvidencePayload } from '../../domain/model/evidence'

const TYPE_OPTIONS = [
  { value: EvidenceType.Document, label: 'Document' },
  { value: EvidenceType.TestResult, label: 'Test result' },
  { value: EvidenceType.Screenshot, label: 'Screenshot' },
  { value: EvidenceType.External, label: 'External' },
  { value: EvidenceType.Other, label: 'Other' },
]

interface AddEvidenceModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: AddEvidencePayload) => Promise<void>
}

export function AddEvidenceModal({ open, onClose, onSubmit }: AddEvidenceModalProps) {
  const [type, setType] = useState<string>(EvidenceType.Document)
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        type,
        title: title.trim(),
        link: link.trim() || null,
        referenceNumber: referenceNumber.trim() || null,
      })
      setTitle('')
      setLink('')
      setReferenceNumber('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add evidence">
      <Stack direction="vertical" spacing="md">
        <Select
          label="Type"
          value={type}
          onValueChange={setType}
          options={TYPE_OPTIONS}
          fullWidth
        />
        <Input
          label="Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Evidence title"
        />
        <Input
          label="Link (optional)"
          fullWidth
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
        />
        <Input
          label="Reference number (optional)"
          fullWidth
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
        <Stack direction="horizontal" spacing="sm" className="justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={() => void handleSubmit()}>
            Add
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
