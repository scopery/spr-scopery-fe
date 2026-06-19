'use client'

import { Input, Select, Typography, Button, ContentLoader } from '@/shared/ui'
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
    <div className="border-border space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="small" className="font-medium">
          Document set picker ({selectedIds.length}/{maxSelected} selected)
        </Typography>
        {selectedIds.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
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
                <label className="hover:bg-muted/50 flex cursor-pointer items-start gap-2 rounded px-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onToggleDocument(item)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground ml-2">
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
              onClick={onLoadMore}
            >
              Load more
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
