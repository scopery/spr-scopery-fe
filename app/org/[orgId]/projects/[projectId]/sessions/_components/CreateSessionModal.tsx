'use client'

import { useState, useEffect } from 'react'
import { Modal, Input } from '@/shared/ui'
import * as sessionService from '@/services/session.service'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface CreateSessionModalProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (sessionId: string) => void
}

export function CreateSessionModal({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
}: CreateSessionModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) setName('')
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const session = await sessionService.createSession(orgId, projectId, { name: name.trim() })
      toast.success('Session created')
      setName('')
      onSuccess(session.id)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to create session'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create session"
      size="sm"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Create', onClick: handleSubmit, variant: 'primary', loading },
      ]}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Session name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Session 1"
          fullWidth
        />
      </form>
    </Modal>
  )
}
