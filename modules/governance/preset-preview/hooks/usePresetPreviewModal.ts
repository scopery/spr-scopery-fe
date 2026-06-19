'use client'

import { useEffect, useMemo, useState } from 'react'
import * as governanceApi from '@/modules/governance/policy/api/governance.api'
import type { GovernancePresetPreviewResult } from '@/modules/governance/policy'
import { mapPresetPreviewToViewModel } from '../lib/preset-preview-modal.mapper'

export function usePresetPreviewModal(orgId: string, presetKey: string | null, open: boolean) {
  const [preview, setPreview] = useState<GovernancePresetPreviewResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !presetKey) {
      setPreview(null)
      return
    }

    setLoading(true)
    governanceApi
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
