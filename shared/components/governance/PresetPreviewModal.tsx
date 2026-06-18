'use client'

import { usePresetPreviewModal } from '@/hooks/usePresetPreviewModal'
import type { PresetPreviewModalProps } from '@/types/governance/preset-preview-modal'
import { PresetPreviewModalView } from './PresetPreviewModalView'

export function PresetPreviewModal({
  orgId,
  presetKey,
  open,
  onClose,
  onConfirm,
  confirming = false,
}: PresetPreviewModalProps) {
  const { loading, viewModel } = usePresetPreviewModal(orgId, presetKey, open)

  return (
    <PresetPreviewModalView
      open={open}
      presetKey={presetKey}
      loading={loading}
      preview={viewModel}
      confirming={confirming}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
