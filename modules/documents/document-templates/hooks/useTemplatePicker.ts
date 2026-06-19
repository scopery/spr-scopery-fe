'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as documentTemplatesApi from '../api/document-templates.api'
import type { DocumentTemplate } from '../model/document-templates'

export function useTemplatePicker(orgId: string) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await documentTemplatesApi.listAvailableTemplates(orgId, { limit: 50 })
      setTemplates(result.items)
    } catch {
      setError('Failed to load templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        t.plain_text.toLowerCase().includes(q)
    )
  }, [templates, search])

  const systemTemplates = filtered.filter((t) => t.scope === 'system')
  const personalTemplates = filtered.filter((t) => t.scope === 'personal')

  return {
    templates,
    loading,
    search,
    error,
    filtered,
    systemTemplates,
    personalTemplates,
    setSearch,
  }
}
