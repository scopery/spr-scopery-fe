'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as promptsApi from '../../infrastructure/api/prompts.api'
import type {
  AiPromptTemplate,
  SearchAiPromptTemplatesParams,
} from '../../domain/model/prompt-template'
import type {
  AiPromptVersion,
  SearchAiPromptVersionsParams,
} from '../../domain/model/prompt-version'

export function usePromptTemplates(params: SearchAiPromptTemplatesParams) {
  const [items, setItems] = useState<AiPromptTemplate[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await promptsApi.listPromptTemplates(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [params.agentId, params.keyword, params.status, params.page, params.size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function usePromptTemplateDetail(templateId: string | null) {
  const [template, setTemplate] = useState<AiPromptTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!templateId) return
    setLoading(true)
    setError(null)
    try {
      setTemplate(await promptsApi.getPromptTemplate(templateId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    void load()
  }, [load])

  return { template, loading, error, refetch: load }
}

export function usePromptVersions(params: SearchAiPromptVersionsParams) {
  const [items, setItems] = useState<AiPromptVersion[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await promptsApi.listPromptVersions(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [params.templateId, params.status, params.contentFormat, params.page, params.size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function usePromptVersionDetail(versionId: string | null) {
  const [version, setVersion] = useState<AiPromptVersion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!versionId) return
    setLoading(true)
    setError(null)
    try {
      setVersion(await promptsApi.getPromptVersion(versionId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load version')
    } finally {
      setLoading(false)
    }
  }, [versionId])

  useEffect(() => {
    void load()
  }, [load])

  return { version, loading, error, refetch: load }
}
