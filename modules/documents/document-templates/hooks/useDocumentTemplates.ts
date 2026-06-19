'use client'

import { useCallback, useEffect, useState } from 'react'
import * as documentTemplatesApi from '../api/document-templates.api'
import type {
  DocumentTemplate,
  DocumentTemplateWithVariableScan,
} from '../model/document-templates'
import type { DocumentTemplatesFilters } from '../model/document-templates'

export function useDocumentTemplates(orgId: string | null) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(
    async (filters?: DocumentTemplatesFilters) => {
      if (!orgId) return
      setLoading(true)
      setError(null)
      try {
        const res = await documentTemplatesApi.listManagementTemplates(orgId, {
          ...filters,
          limit: 100,
        })
        setTemplates(res.items as DocumentTemplate[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    },
    [orgId]
  )

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  return { templates, loading, error, loadTemplates }
}

export function useDocumentTemplateDetail(orgId: string | null, templateId: string | null) {
  const [template, setTemplate] = useState<DocumentTemplateWithVariableScan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !templateId) return
    setLoading(true)
    setError(null)
    try {
      const data = await documentTemplatesApi.getTemplate(orgId, templateId)
      setTemplate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [orgId, templateId])

  useEffect(() => {
    void load()
  }, [load])

  return { template, loading, error, refetch: load }
}
