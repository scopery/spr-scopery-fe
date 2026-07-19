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
            label="Invitee email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            fullWidth
          />
          <Checkbox
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            label="Send invitation email (requires email above)"
          />
          <Typography variant="small" tone="muted">
            Invitations expire in 7 days by default. Only workspace owners can create invitation
            codes.
          </Typography>
        </Stack>
      )}
    </Modal>
  )
}
