'use client'

import { Modal, Typography } from '@/shared/ui'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
      onClose()
    } catch {
      // Let parent handle error; don't auto-close
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      actions={[
        { label: cancelLabel, onClick: onClose, variant: 'ghost' },
        {
          label: confirmLabel,
          onClick: handleConfirm,
          variant: variant === 'danger' ? 'primary' : 'primary',
          tone: variant === 'danger' ? 'error' : undefined,
          loading,
        },
      ]}
    >
      <Typography>{message}</Typography>
    </Modal>
  )
}
