'use client'

import { useCallback, useEffect, useState } from 'react'
import * as templateService from '@/services/template.service'
import type { TemplateDetail, TemplateListItem } from '@/services/template.service'

export function useAdminTemplates() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async (params?: { status?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await templateService.listTemplates(params)
      setTemplates(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTemplates() }, [loadTemplates])

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
      const data = await templateService.getTemplate(templateId)
      setTemplate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => { load() }, [load])

  return { template, loading, error, refetch: load }
}
