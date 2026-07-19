'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as documentTypesApi from '../../infrastructure/api/document-types.api'
import type { DocumentType, SearchDocumentTypesParams } from '../../domain/model/document-type'

export function useDocumentTypes(params?: SearchDocumentTypesParams) {
  const [items, setItems] = useState<DocumentType[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await documentTypesApi.searchDocumentTypes(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load document types')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useDocumentType(documentTypeId: string | null) {
  const [data, setData] = useState<DocumentType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!documentTypeId) return
    setLoading(true)
    setError(null)
    try {
      const res = await documentTypesApi.getDocumentType(documentTypeId)
      setData(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load document type')
    } finally {
      setLoading(false)
    }
  }, [documentTypeId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
