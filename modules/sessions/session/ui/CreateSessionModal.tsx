'use client'

import { Modal, Input } from '@/shared/ui'
import { useCreateSessionModal } from '@/modules/sessions'
import type { CreateSessionModalProps } from '@/modules/sessions'

export function CreateSessionModal({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
}: CreateSessionModalProps) {
  const { name, setName, loading, handleSubmit } = useCreateSessionModal({
    orgId,
    projectId,
    open,
    onClose,
    onSuccess,
  })

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
