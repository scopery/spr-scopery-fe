'use client'

import { useState } from 'react'
import { Modal, Input, Stack, Typography } from '@/shared/ui'
import * as orgTeamsApi from '../api/org-teams.api'
import { toast } from 'sonner'

interface CreateOrgTeamModalProps {
  organizationId: string
  open: boolean
  onClose: () => void
  onSuccess: (teamId: string) => void
}

export function CreateOrgTeamModal({
  organizationId,
  open,
  onClose,
  onSuccess,
}: CreateOrgTeamModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setName('')
    setCode('')
    setDescription('')
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedName || !trimmedCode) {
      toast.error('Name and code are required')
      return
    }
    setLoading(true)
    try {
      const created = await orgTeamsApi.createOrgTeam(organizationId, {
        name: trimmedName,
        code: trimmedCode,
        description: description.trim() || undefined,
      })
      toast.success('Team created')
      reset()
      onSuccess(created.id)
    } catch {
      /* global interceptor */
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create organization team"
      size="md"
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'ghost' },
        { label: 'Create', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        <Typography variant="small" tone="muted">
          Teams belong to the organization and can be assigned to one or more workspaces.
        </Typography>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          placeholder="Product Engineering"
        />
        <Input
          label="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          placeholder="PRODUCT_ENG"
        />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />
      </Stack>
    </Modal>
  )
}
