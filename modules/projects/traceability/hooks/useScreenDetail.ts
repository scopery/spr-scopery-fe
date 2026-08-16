'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/traceability.api'
import { submitScreenFieldsBulk, waitForFieldBulkJob } from '../screen-spec'
import type {
  CreateRegistryScreenActionBody,
  CreateRegistryScreenFieldBody,
  CreateRegistryScreenSectionBody,
  RegistryScreenAction,
  RegistryScreenField,
  RegistryScreenSection,
  UpdateRegistryScreenActionBody,
  UpdateRegistryScreenFieldBody,
  UpdateRegistryScreenSectionBody,
} from '../model/application-registry'

export function useScreenDetail(workspaceId: string | null, screenId: string | null) {
  const [sections, setSections] = useState<RegistryScreenSection[]>([])
  const [fields, setFields] = useState<RegistryScreenField[]>([])
  const [actions, setActions] = useState<RegistryScreenAction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !screenId) {
      setSections([])
      setFields([])
      setActions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [sectionRes, fieldRes, actionRes] = await Promise.all([
        api.listScreenSections(workspaceId, screenId),
        api.listScreenFields(workspaceId, screenId),
        api.listScreenActions(workspaceId, screenId),
      ])
      setSections(sectionRes.items ?? [])
      setFields(fieldRes.items ?? [])
      setActions(actionRes.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screen details')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, screenId])

  useEffect(() => {
    void load()
  }, [load])

  const createSection = useCallback(
    async (body: CreateRegistryScreenSectionBody) => {
      if (!workspaceId || !screenId) return undefined
      const created = await api.createScreenSection(workspaceId, screenId, body)
      await load()
      return created
    },
    [workspaceId, screenId, load]
  )

  const updateSection = useCallback(
    async (sectionId: string, body: UpdateRegistryScreenSectionBody) => {
      if (!workspaceId || !screenId) return
      await api.updateScreenSection(workspaceId, screenId, sectionId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const removeSection = useCallback(
    async (sectionId: string) => {
      if (!workspaceId || !screenId) return
      await api.deleteScreenSection(workspaceId, screenId, sectionId)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const createField = useCallback(
    async (body: CreateRegistryScreenFieldBody) => {
      if (!workspaceId || !screenId) return
      const created = await api.createScreenField(workspaceId, screenId, body)
      await load()
      return created
    },
    [workspaceId, screenId, load]
  )

  const createFieldsBulk = useCallback(
    async (items: CreateRegistryScreenFieldBody[]) => {
      if (!workspaceId || !screenId) return { failed: [] }
      const job = await submitScreenFieldsBulk(workspaceId, screenId, items)
      const result = await waitForFieldBulkJob(job)
      await load()
      return result
    },
    [workspaceId, screenId, load]
  )

  const updateField = useCallback(
    async (fieldId: string, body: UpdateRegistryScreenFieldBody) => {
      if (!workspaceId || !screenId) return
      await api.updateScreenField(workspaceId, screenId, fieldId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const removeField = useCallback(
    async (fieldId: string) => {
      if (!workspaceId || !screenId) return
      await api.deleteScreenField(workspaceId, screenId, fieldId)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const createAction = useCallback(
    async (body: CreateRegistryScreenActionBody) => {
      if (!workspaceId || !screenId) return
      await api.createScreenAction(workspaceId, screenId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const updateAction = useCallback(
    async (actionId: string, body: UpdateRegistryScreenActionBody) => {
      if (!workspaceId || !screenId) return
      await api.updateScreenAction(workspaceId, screenId, actionId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const removeAction = useCallback(
    async (actionId: string) => {
      if (!workspaceId || !screenId) return
      await api.deleteScreenAction(workspaceId, screenId, actionId)
      await load()
    },
    [workspaceId, screenId, load]
  )

  return {
    sections,
    fields,
    actions,
    loading,
    error,
    refetch: load,
    createSection,
    updateSection,
    removeSection,
    createField,
    createFieldsBulk,
    updateField,
    removeField,
    createAction,
    updateAction,
    removeAction,
  }
}
