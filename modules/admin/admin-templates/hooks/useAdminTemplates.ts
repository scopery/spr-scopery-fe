'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TemplateDetail, TemplateListItem } from '../api/admin-templates.api'
import * as adminTemplatesApi from '../api/admin-templates.api'

export function useAdminTemplates() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async (params?: { status?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminTemplatesApi.listTemplates(params)
      setTemplates(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  return { templates, loading, error, loadTemplates }
}

export function useAdminTemplateDetail(templateId: string | null) {
  const [template, setTemplate] = useState<TemplateDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!templateId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminTemplatesApi.getTemplate(templateId)
      setTemplate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    void load()
  }, [load])

  return { template, loading, error, refetch: load }
}
