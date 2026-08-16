'use client'

import { useCallback } from 'react'
import {
  applyDefaultValueToDrafts,
  buildModeConfigReplacePayload,
  draftFromModeConfig,
  findModeConfig,
} from '../../domain/rules/mode-config.rules'
import * as api from '../../infrastructure/api/screen-spec.api'
import type { ScreenMode } from '../../domain/model/screen-spec'

export function useApplyFieldDefault(workspaceId: string | null, screenId: string | null) {
  return useCallback(
    async (
      fieldId: string,
      defaultValue: string | null,
      modes: ScreenMode[],
      fieldRequired: boolean | null | undefined
    ) => {
      if (!workspaceId || !screenId || modes.length === 0) return
      const configs = await api.listFieldModeConfigs(workspaceId, screenId, fieldId)
      const drafts = modes.map((mode) => draftFromModeConfig(mode.id, findModeConfig(configs.items, mode)))
      const next = applyDefaultValueToDrafts(drafts, modes, defaultValue)
      await api.replaceFieldModeConfigs(
        workspaceId,
        screenId,
        fieldId,
        buildModeConfigReplacePayload(next, fieldRequired)
      )
    },
    [screenId, workspaceId]
  )
}
