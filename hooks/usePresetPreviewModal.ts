'use client'

import { useEffect, useMemo, useState } from 'react'
import * as governanceService from '@/services/governance.service'
import type { GovernancePresetPreviewResult } from '@/types/governance'
import { mapPresetPreviewToViewModel } from '@/utils/governance/preset-preview-modal.mapper'

export function usePresetPreviewModal(
  orgId: string,
  presetKey: string | null,
  open: boolean
) {
  const [preview, setPreview] = useState<GovernancePresetPreviewResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !presetKey) {
      setPreview(null)
      return
    }

    setLoading(true)
    governanceService
      .previewGovernancePreset(orgId, presetKey)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setLoading(false))
  }, [open, orgId, presetKey])

  const viewModel = useMemo(
    () => (preview ? mapPresetPreviewToViewModel(preview) : null),
    [preview]
  )

  return {
    loading,
    viewModel,
  }
}
