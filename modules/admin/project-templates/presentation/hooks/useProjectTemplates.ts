'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/project-templates.api'
import type {
  ApplyProjectTemplatePayload,
  ProjectTemplate,
  ProjectTemplateVersion,
} from '../../domain/model/project-template'

export function useProjectTemplates(filters?: { keyword?: string; status?: string }) {
  const [items, setItems] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(filters ?? {})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.listProjectTemplates({
        keyword: filters?.keyword || undefined,
        status: filters?.status || undefined,
      })
      setItems(page.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    void load()
  }, [load])

  const activate = useCallback(
    async (id: string) => {
      await api.activateProjectTemplate(id)
      await load()
    },
    [load]
  )

  const deactivate = useCallback(
    async (id: string) => {
      await api.deactivateProjectTemplate(id)
      await load()
    },
    [load]
  )

  const archive = useCallback(
    async (id: string) => {
      await api.archiveProjectTemplate(id)
      await load()
    },
    [load]
  )

  const loadVersions = useCallback(async (templateId: string) => {
    return api.listTemplateVersions(templateId)
  }, [])

  const apply = useCallback(
    async (templateId: string, versionId: string, body: ApplyProjectTemplatePayload) => {
      return api.applyProjectTemplate(templateId, versionId, body)
    },
    []
  )

  return {
    items,
    loading,
    error,
    refetch: load,
    activate,
    deactivate,
    archive,
    loadVersions,
    apply,
  }
}

export type { ProjectTemplateVersion }
