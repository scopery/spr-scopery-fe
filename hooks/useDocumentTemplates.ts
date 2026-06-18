'use client'

import { useCallback, useEffect, useState } from 'react'
import * as documentTemplatesService from '@/services/document-templates.service'
import type { DocumentTemplate, DocumentTemplateWithVariableScan, TemplateStatus } from '@/types/document-template'

export interface DocumentTemplatesFilters {
  q?: string
  document_type?: string
  scope?: string
  status?: TemplateStatus
  category?: string
  sort?: 'updated_at' | 'title'
}

export function useDocumentTemplates(orgId: string | null) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async (filters?: DocumentTemplatesFilters) => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await documentTemplatesService.listManagementTemplates(orgId, { ...filters, limit: 100 })
      setTemplates(res.items as DocumentTemplate[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { loadTemplates() }, [loadTemplates])

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
      const data = await documentTemplatesService.getTemplate(orgId, templateId)
      setTemplate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [orgId, templateId])

  useEffect(() => { load() }, [load])

  return { template, loading, error, refetch: load }
}
