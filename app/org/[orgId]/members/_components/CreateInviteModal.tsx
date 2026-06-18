'use client'

import { useState } from 'react'
import { Modal, Typography, Input, Select } from '@/shared/ui'
import * as orgInviteService from '@/services/org-invite.service'
import { toast } from 'sonner'
import { ApiError } from '@/types/api'

interface CreateInviteModalProps {
  orgId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'partner', label: 'Partner' },
]

export function CreateInviteModal({ orgId, open, onClose, onSuccess }: CreateInviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'partner'>('member')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const reset = () => {
    setEmail('')
    setRole('member')
    setInviteLink(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }
    setLoading(true)
    try {
      const res = await orgInviteService.createInvite(orgId, { email: email.trim().toLowerCase(), role })
      if (res.invite_link) {
        setInviteLink(res.invite_link)
        toast.success('Invite created')
      } else if (res.invite_token && process.env.NODE_ENV !== 'production') {
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/invites/${res.invite_token}`
        setInviteLink(link)
        toast.success('Invite created (dev token)')
      } else {
        toast.success('Invite created and sent via email')
        handleClose()
        onSuccess()
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const code = err.problem.code
        if (code === 'ALREADY_MEMBER') toast.error('User is already a member')
        else if (code === 'INVITE_ALREADY_PENDING') toast.error('Invite already pending for this email')
        else toast.error(err.problem.detail || 'Failed to create invite')
      } else {
        toast.error('Failed to create invite')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAndClose = () => {
    if (inviteLink && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink)
      toast.success('Link copied to clipboard')
    }
    handleClose()
    onSuccess()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={inviteLink ? 'Invite link' : 'Create invite'}
      size="md"
      actions={
        inviteLink
          ? [{ label: 'Copy & close', onClick: handleCopyAndClose, variant: 'primary' }]
          : [
              { label: 'Cancel', onClick: handleClose, variant: 'ghost' },
              { label: 'Create invite', onClick: handleSubmit, variant: 'primary', loading },
            ]
      }
    >
      {inviteLink ? (
        <div>
          <Typography variant="small" tone="muted" className="mb-2">
            Share this link with the invitee:
          </Typography>
          <code className="block p-3 bg-neutral-100 rounded text-sm break-all">{inviteLink}</code>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            fullWidth
            required
          />
          <div>
            <Typography variant="small" className="mb-1.5 block">Role</Typography>
            <Select
              options={ROLE_OPTIONS}
              value={role}
              onValueChange={(v: string) => setRole(v as 'member' | 'partner')}
              placeholder="Select role"
              className="w-full"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
