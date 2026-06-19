'use client'

import { Modal } from '@/shared/ui/molecules/Modal'
import { Typography } from '@/shared/ui/atoms/Typography'
import type { ConfirmDialogProps } from './ConfirmDialog.types'

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
          variant: 'primary',
          tone: variant === 'danger' ? 'error' : undefined,
          loading,
        },
      ]}
    >
      <Typography>{message}</Typography>
    </Modal>
  )
}
