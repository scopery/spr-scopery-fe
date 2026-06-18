'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input, Select, Typography, Button, ContentLoader } from '@/shared/ui'
import * as deliverablesService from '@/services/document-deliverables.service'
import { DOCUMENT_TYPE_OPTIONS, DOCUMENT_WORKFLOW_STATUS_OPTIONS } from '@/types/document'
import type { DeliverablePickerItem } from '@/types/document-deliverable'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

const MAX_SELECTED = 50
const PAGE_SIZE = 20

interface DeliverableDocumentSetPickerProps {
  orgId: string
  projectId: string
  selectedIds: string[]
  onSelectionChange: (ids: string[], titles: string[]) => void
  includeArchived: boolean
}

export function DeliverableDocumentSetPicker({
  orgId,
  projectId,
  selectedIds,
  onSelectionChange,
  includeArchived,
}: DeliverableDocumentSetPickerProps) {
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
        const res = await deliverablesService.searchDeliverablePickerDocuments(orgId, projectId, {
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

  const toggleDocument = (item: DeliverablePickerItem) => {
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
  }

  const clearSelection = () => {
    setSelectedTitles(new Map())
    onSelectionChange([], [])
  }

  const hasMore = items.length < total

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="small" className="font-medium">
          Document set picker ({selectedIds.length}/{MAX_SELECTED} selected)
        </Typography>
        {selectedIds.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            Clear selection
          </Button>
        ) : null}
      </div>

      <Typography variant="small" tone="muted">
        Showing {items.length} of {total} documents
      </Typography>

      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          label="Search title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
        />
        <Select
          label="Document type"
          value={documentType}
          onValueChange={(v: string) => setDocumentType(v)}
          options={[{ value: '', label: 'All types' }, ...DOCUMENT_TYPE_OPTIONS]}
        />
        <Select
          label="Workflow status"
          value={workflowStatus}
          onValueChange={(v: string) => setWorkflowStatus(v)}
          options={[{ value: '', label: 'All statuses' }, ...DOCUMENT_WORKFLOW_STATUS_OPTIONS]}
        />
      </div>

      {loading ? (
        <ContentLoader />
      ) : items.length === 0 ? (
        <Typography variant="small" tone="muted">
          No documents match your filters.
        </Typography>
      ) : (
        <>
          <ul className="max-h-48 space-y-1 overflow-auto text-sm">
            {items.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleDocument(item)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">{item.title}</span>
                    <span className="ml-2 text-muted-foreground">
                      {item.document_type} · {item.workflow_status}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={loadingMore}
              onClick={() => void loadPage(offset, true)}
            >
              Load more
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
