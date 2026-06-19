'use client'

import { useDeliverableDocumentSetPicker } from '../hooks/useDeliverableDocumentSetPicker'
import type { DeliverableDocumentSetPickerProps } from '../model/deliverable-document-set-picker'
import { DeliverableDocumentSetPickerView } from './DeliverableDocumentSetPickerView'

export function DeliverableDocumentSetPicker({
  orgId,
  projectId,
  selectedIds,
  onSelectionChange,
  includeArchived,
}: DeliverableDocumentSetPickerProps) {
  const picker = useDeliverableDocumentSetPicker({
    orgId,
    projectId,
    selectedIds,
    onSelectionChange,
    includeArchived,
  })

  return (
    <DeliverableDocumentSetPickerView
      selectedIds={selectedIds}
      search={picker.search}
      documentType={picker.documentType}
      documentTypeOptions={picker.documentTypeOptions}
      workflowStatus={picker.workflowStatus}
      workflowStatusOptions={picker.workflowStatusOptions}
      items={picker.items}
      total={picker.total}
      loading={picker.loading}
      loadingMore={picker.loadingMore}
      maxSelected={picker.maxSelected}
      hasMore={picker.hasMore}
      onSearchChange={picker.setSearch}
      onDocumentTypeChange={picker.setDocumentType}
      onWorkflowStatusChange={picker.setWorkflowStatus}
      onToggleDocument={picker.toggleDocument}
      onClearSelection={picker.clearSelection}
      onLoadMore={picker.loadMore}
    />
  )
}
