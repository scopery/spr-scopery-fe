'use client'

import { ChevronDown, X } from 'lucide-react'

import { Input, Select, Typography, Button, Card, Skeleton } from '@/shared/ui'
import type { DeliverableDocumentSetPickerViewProps } from '../model/deliverable-document-set-picker'

export function DeliverableDocumentSetPickerView({
  selectedIds,
  search,
  documentType,
  documentTypeOptions,
  workflowStatus,
  workflowStatusOptions,
  items,
  total,
  loading,
  loadingMore,
  maxSelected,
  hasMore,
  onSearchChange,
  onDocumentTypeChange,
  onWorkflowStatusChange,
  onToggleDocument,
  onClearSelection,
  onLoadMore,
}: DeliverableDocumentSetPickerViewProps) {
  return (
    <Card className="border-border space-y-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="small" weight="medium">
          Document set picker ({selectedIds.length}/{maxSelected} selected)
        </Typography>
        {selectedIds.length > 0 ? (
          <Button type="button" variant="ghost" onClick={onClearSelection} icon={<X size={16} />}>
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search documents…"
        />
        <Select
          label="Document type"
          value={documentType}
          onValueChange={(v: string) => onDocumentTypeChange(v)}
          options={documentTypeOptions}
        />
        <Select
          label="Workflow status"
          value={workflowStatus}
          onValueChange={(v: string) => onWorkflowStatusChange(v)}
          options={workflowStatusOptions}
        />
      </div>

      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={80} />
      ) : items.length === 0 ? (
        <Typography variant="small" tone="muted">
          No documents match your filters.
        </Typography>
      ) : (
        <>
          <ul className="max-h-48 space-y-1 overflow-auto text-sm">
            {items.map((item) => (
              <li key={item.id}>
                <label className="hover:bg-muted/50 flex cursor-pointer items-start gap-2 rounded px-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onToggleDocument(item)}
                    className="mt-0.5"
                  />
                  <span>
                    <Typography as="span" variant="small" weight="medium">
                      {item.title}
                    </Typography>
                    <Typography as="span" variant="small" tone="muted" className="ml-2">
                      {item.document_type} · {item.workflow_status}
                    </Typography>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              loading={loadingMore}
              onClick={onLoadMore}
              icon={<ChevronDown size={16} />}
            >
              Load more
            </Button>
          ) : null}
        </>
      )}
    </Card>
  )
}
