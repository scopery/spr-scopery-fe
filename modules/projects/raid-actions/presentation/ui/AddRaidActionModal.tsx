'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Input, Modal, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { CreateRaidActionPayload } from '../../domain/model/raid-action'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateRaidActionPayload) => Promise<unknown>
}

export function AddRaidActionModal({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        owner: owner.trim() || null,
        dueDate: dueDate || null,
      })
      setTitle('')
      setOwner('')
      setDueDate('')
      onClose()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add action">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <Stack direction="vertical" spacing="md">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Title <span className="text-red-500">*</span>
            </Typography>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the action"
              required
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Owner
            </Typography>
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Name or email"
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Due date
            </Typography>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving || !title.trim()}>
              {saving ? 'Adding…' : 'Add action'}
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  )
}
