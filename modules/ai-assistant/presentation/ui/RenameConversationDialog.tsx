'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Stack, Typography } from '@/shared/ui'

interface RenameConversationDialogProps {
  open: boolean
  onClose: () => void
  initialTitle: string
  onSubmit: (title: string) => Promise<boolean>
  loading?: boolean
}

export function RenameConversationDialog({
  open,
  onClose,
  initialTitle,
  onSubmit,
  loading = false,
}: RenameConversationDialogProps) {
  const [title, setTitle] = useState(initialTitle)

  useEffect(() => {
    if (open) setTitle(initialTitle)
  }, [open, initialTitle])

  const handleSubmit = async () => {
    const ok = await onSubmit(title)
    if (ok) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rename conversation"
      size="sm"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost', disabled: loading },
        {
          label: 'Save',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: loading || !title.trim(),
        },
      ]}
    >
      <Stack direction="vertical" spacing="sm">
        <Typography variant="caption" tone="muted">
          Title (max 200 characters)
        </Typography>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          maxLength={200}
          aria-label="Conversation title"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) {
              e.preventDefault()
              void handleSubmit()
            }
          }}
        />
      </Stack>
    </Modal>
  )
}
