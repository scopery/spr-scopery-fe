'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { RaidLinkTargetType, RaidLinkType } from '../../domain/enums/raid-link.enum'
import type { CreateRaidLinkPayload } from '../../domain/model/raid-link'

const TARGET_TYPE_OPTIONS = [
  { value: RaidLinkTargetType.RaidItem, label: 'RAID item' },
  { value: RaidLinkTargetType.Decision, label: 'Decision' },
  { value: RaidLinkTargetType.Task, label: 'Task' },
  { value: RaidLinkTargetType.Deliverable, label: 'Deliverable' },
]

const LINK_TYPE_OPTIONS = [
  { value: RaidLinkType.RelatedTo, label: 'Related to' },
  { value: RaidLinkType.BlockedBy, label: 'Blocked by' },
  { value: RaidLinkType.Blocks, label: 'Blocks' },
  { value: RaidLinkType.DuplicateOf, label: 'Duplicate of' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateRaidLinkPayload) => Promise<unknown>
}

export function AddRaidLinkModal({ open, onClose, onSubmit }: Props) {
  const [targetType, setTargetType] = useState<string>(RaidLinkTargetType.RaidItem)
  const [targetId, setTargetId] = useState('')
  const [linkType, setLinkType] = useState<string>(RaidLinkType.RelatedTo)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId.trim()) return
    setSaving(true)
    try {
      await onSubmit({ targetType, targetId: targetId.trim(), linkType })
      setTargetType(RaidLinkTargetType.RaidItem)
      setTargetId('')
      setLinkType(RaidLinkType.RelatedTo)
      onClose()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add link">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <Stack direction="vertical" spacing="md">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Relationship
            </Typography>
            <Select
              value={linkType}
              onValueChange={setLinkType}
              options={LINK_TYPE_OPTIONS}
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Target type
            </Typography>
            <Select
              value={targetType}
              onValueChange={setTargetType}
              options={TARGET_TYPE_OPTIONS}
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Target ID <span className="text-red-500">*</span>
            </Typography>
            <Input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Entity ID"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving || !targetId.trim()}>
              {saving ? 'Adding…' : 'Add link'}
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  )
}
