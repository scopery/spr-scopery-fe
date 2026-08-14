'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/screen-spec.api'
import { buildModeConfigReplacePayload } from '../../domain/rules/mode-config.rules'
import type {
  ModeConfigDraft,
  ScreenFieldDetail,
  UpdateScreenFieldSpecBody,
} from '../../domain/model/screen-spec'

export function useScreenFieldSpec(
  workspaceId: string | null,
  screenId: string | null,
  fieldId: string | null
) {
  const [field, setField] = useState<ScreenFieldDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !screenId || !fieldId) {
      setField(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await api.getScreenFieldDetail(workspaceId, screenId, fieldId)
      setField(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load field')
      setField(null)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, screenId, fieldId])

  useEffect(() => {
    void load()
  }, [load])

  const saveField = useCallback(
    async (body: UpdateScreenFieldSpecBody) => {
      if (!workspaceId || !screenId || !fieldId) return
      await api.updateScreenFieldSpec(workspaceId, screenId, fieldId, body)
      await load()
    },
    [workspaceId, screenId, fieldId, load]
  )

  const saveModeConfigs = useCallback(
    async (drafts: ModeConfigDraft[], fieldRequired: boolean | null | undefined) => {
      if (!workspaceId || !screenId || !fieldId) return
      const payload = buildModeConfigReplacePayload(drafts, fieldRequired)
      await api.replaceFieldModeConfigs(workspaceId, screenId, fieldId, payload)
      await load()
    },
    [workspaceId, screenId, fieldId, load]
  )

  return { field, loading, error, refetch: load, saveField, saveModeConfigs }
}
