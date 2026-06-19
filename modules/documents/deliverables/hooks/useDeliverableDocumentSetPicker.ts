'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DeliverablePickerItem } from '../model/document-deliverable-types'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as deliverablesApi from '../api/deliverables.api'
import {
  toDocumentTypeFilterOptions,
  toWorkflowStatusFilterOptions,
} from '../api/deliverables.mapper'

const MAX_SELECTED = 50
const PAGE_SIZE = 20

interface UseDeliverableDocumentSetPickerParams {
  orgId: string
  projectId: string
  selectedIds: string[]
  onSelectionChange: (ids: string[], titles: string[]) => void
  includeArchived: boolean
}

export function useDeliverableDocumentSetPicker({
  orgId,
  projectId,
  selectedIds,
  onSelectionChange,
  includeArchived,
}: UseDeliverableDocumentSetPickerParams) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [workflowStatus, setWorkflowStatus] = useState('')
  const [items, setItems] = useState<DeliverablePickerItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedTitles, setSelectedTitles] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setOffset(0)
  }, [debouncedSearch, documentType, workflowStatus, includeArchived])

  const loadPage = useCallback(
    async (pageOffset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      try {
        const res = await deliverablesApi.searchDeliverablePickerDocuments(orgId, projectId, {
          q: debouncedSearch || undefined,
          document_type: documentType || undefined,
          workflow_status: workflowStatus || undefined,
          status: includeArchived ? 'archived' : 'active',
          limit: PAGE_SIZE,
          offset: pageOffset,
        })
        setTotal(res.total)
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
        setOffset(pageOffset + res.items.length)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to load documents')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [orgId, projectId, debouncedSearch, documentType, workflowStatus, includeArchived]
  )

  useEffect(() => {
    void loadPage(0, false)
  }, [loadPage])

  const toggleDocument = useCallback(
    (item: DeliverablePickerItem) => {
      const next = new Set(selectedIds)
      const nextTitles = new Map(selectedTitles)

      if (next.has(item.id)) {
        next.delete(item.id)
        nextTitles.delete(item.id)
      } else {
        if (next.size >= MAX_SELECTED) {
          toast.error(`You can select up to ${MAX_SELECTED} documents`)
          return
        }
        next.add(item.id)
        nextTitles.set(item.id, item.title)
      }

      setSelectedTitles(nextTitles)
      onSelectionChange([...next], [...nextTitles.values()])
    },
    [selectedIds, selectedTitles, onSelectionChange]
  )

  const clearSelection = useCallback(() => {
    setSelectedTitles(new Map())
    onSelectionChange([], [])
  }, [onSelectionChange])

  return {
    search,
    documentType,
    workflowStatus,
    items,
    total,
    loading,
    loadingMore,
    maxSelected: MAX_SELECTED,
    hasMore: items.length < total,
    documentTypeOptions: toDocumentTypeFilterOptions(),
    workflowStatusOptions: toWorkflowStatusFilterOptions(),
    setSearch,
    setDocumentType,
    setWorkflowStatus,
    toggleDocument,
    clearSelection,
    loadMore: () => void loadPage(offset, true),
  }
}
