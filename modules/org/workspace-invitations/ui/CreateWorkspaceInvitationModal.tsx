'use client'

import { Modal, Typography, Input, Stack, Checkbox } from '@/shared/ui'
import { useCreateWorkspaceInvitationModal } from '../hooks/useCreateWorkspaceInvitationModal'
import type { CreateWorkspaceInvitationModalProps } from '../model'

export function CreateWorkspaceInvitationModal(props: CreateWorkspaceInvitationModalProps) {
  const {
    email,
    setEmail,
    sendEmail,
    setSendEmail,
    loading,
    invitationCode,
    handleClose,
    handleSubmit,
    handleCopyAndClose,
  } = useCreateWorkspaceInvitationModal(props)

  return (
    <Modal
      open={props.open}
      onClose={handleClose}
      title={invitationCode ? 'Invitation code' : 'Invite to workspace'}
      size="md"
      actions={
        invitationCode
          ? [{ label: 'Copy code & close', onClick: handleCopyAndClose, variant: 'primary' }]
          : [
              { label: 'Cancel', onClick: handleClose, variant: 'ghost' },
              { label: 'Create invitation', onClick: handleSubmit, variant: 'primary', loading },
            ]
      }
    >
      {invitationCode ? (
        <Stack direction="vertical" spacing="sm">
          <Typography variant="small" tone="muted">
            Share this code with your teammate. They can enter it during onboarding under
            &quot;Join with invitation code&quot;.
          </Typography>
          <Typography variant="small" tone="warning">
            This code is shown only once. Copy it now — you cannot retrieve it later.
          </Typography>
          <code className="block break-all rounded bg-neutral-100 p-3 text-sm font-medium tracking-wide">
            {invitationCode}
          </code>
        </Stack>
      ) : (
        <Stack direction="vertical" spacing="md">
          <Input
            label="Invitee email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            fullWidth
          />
          <Checkbox
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            label="Also send invitation email"
          />
          <Typography variant="small" tone="muted">
            If the invitee already has a Scopery account with this email, they get an in-app
            notification + Work Inbox item. Invitations expire in 7 days by default.
          </Typography>
        </Stack>
      )}
    </Modal>
  )
}
