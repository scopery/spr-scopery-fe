'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import { WBS_NODE_TYPE_OPTIONS, WbsNodeType } from '../../domain/enums/wbs.enum'
import type { CreateWbsNodePayload } from '../../domain/model/wbs'

interface PhaseOption {
  value: string
  label: string
}

interface CreateWbsNodeModalProps {
  open: boolean
  onClose: () => void
  phaseOptions: PhaseOption[]
  defaultPhaseId?: string | null
  parentId?: string | null
  parentTitle?: string | null
  onSubmit: (body: CreateWbsNodePayload) => Promise<void>
}

export function CreateWbsNodeModal({
  open,
  onClose,
  phaseOptions,
  defaultPhaseId,
  parentId,
  parentTitle,
  onSubmit,
}: CreateWbsNodeModalProps) {
  const [phaseId, setPhaseId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [nodeType, setNodeType] = useState<string>(WbsNodeType.WorkPackage)
  const [sortOrder, setSortOrder] = useState('1')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setPhaseId(defaultPhaseId ?? phaseOptions[0]?.value ?? '')
    setCode('')
    setTitle('')
    setDescription('')
    setNodeType(WbsNodeType.WorkPackage)
    setSortOrder('1')
  }, [open, defaultPhaseId, phaseOptions])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedCode =
      code.trim() ||
      `PE_${trimmedTitle
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .slice(0, 20)}`
    if (!trimmedTitle || !trimmedCode || !phaseId) return
    setLoading(true)
    try {
      await onSubmit({
        code: trimmedCode,
        title: trimmedTitle,
        description: description.trim() || null,
        phaseId,
        parentId: parentId ?? null,
        nodeType,
        sortOrder: Number(sortOrder) || 1,
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
      title={parentId ? 'Add child element' : 'Add planning element'}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Add', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        {parentTitle ? (
          <Typography variant="small" tone="muted">
            Parent:{' '}
            <Typography as="span" weight="medium">
              {parentTitle}
            </Typography>
          </Typography>
        ) : null}
        <div>
          <Typography variant="small" className="mb-1.5">
            Phase
          </Typography>
          <Select value={phaseId} onValueChange={setPhaseId} options={phaseOptions} />
        </div>
        <Input
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Auto from title if empty"
        />
        <Textarea
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Typography variant="small" className="mb-1.5">
              Element type
            </Typography>
            <Select
              value={nodeType}
              onValueChange={setNodeType}
              options={[...WBS_NODE_TYPE_OPTIONS]}
            />
          </div>
          <Input
            label="Sort order"
            type="number"
            fullWidth
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
