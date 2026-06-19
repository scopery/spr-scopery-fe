'use client'

import { Modal, Typography, Input, Select } from '@/shared/ui'
import { useCreateInviteModal } from '@/modules/org'
import type { CreateInviteModalProps, OrgInviteRole } from '@/modules/org'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'partner', label: 'Partner' },
]

export function CreateInviteModal({ orgId, open, onClose, onSuccess }: CreateInviteModalProps) {
  const {
    email,
    setEmail,
    role,
    setRole,
    loading,
    inviteLink,
    handleClose,
    handleSubmit,
    handleCopyAndClose,
  } = useCreateInviteModal({ orgId, open, onClose, onSuccess })

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
          <code className="block break-all rounded bg-neutral-100 p-3 text-sm">{inviteLink}</code>
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
            <Typography variant="small" className="mb-1.5 block">
              Role
            </Typography>
            <Select
              options={ROLE_OPTIONS}
              value={role}
              onValueChange={(v: string) => setRole(v as OrgInviteRole)}
              placeholder="Select role"
              className="w-full"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
