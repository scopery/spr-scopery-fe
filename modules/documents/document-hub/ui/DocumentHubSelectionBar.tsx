'use client'

import { CheckSquare, Download, Plus, X } from 'lucide-react'

import { Button, Typography } from '@/shared/ui'
import type { DocumentHubSelectionMode } from '../model/document-hub'

type DocumentHubSelectionBarProps = {
  selectionMode: DocumentHubSelectionMode
  selectedCount: number
  totalCount: number
  canSelectAllFiltered: boolean
  canCreateDeliverable: boolean
  deliverableLoading: boolean
  onSelectAllFiltered: () => void
  onClearSelection: () => void
  onExport: () => void
  onDeliverable: () => void
}

export function DocumentHubSelectionBar({
  selectionMode,
  selectedCount,
  totalCount,
  canSelectAllFiltered,
  canCreateDeliverable,
  deliverableLoading,
  onSelectAllFiltered,
  onClearSelection,
  onExport,
  onDeliverable,
}: DocumentHubSelectionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border border-neutral-200 bg-neutral-50 px-3 py-2">
      {selectionMode === 'filtered_all' ? (
        <Typography variant="small">
          All {totalCount} matching documents selected for export
        </Typography>
      ) : (
        <Typography variant="small">{selectedCount} selected on this page</Typography>
      )}
      {canSelectAllFiltered && selectionMode !== 'filtered_all' && (
        <Button variant="outline" onClick={onSelectAllFiltered} icon={<CheckSquare size={16} />}>
          Select all {totalCount} matching documents
        </Button>
      )}
      <Button variant="ghost" onClick={onClearSelection} icon={<X size={16} />}>
        Clear selection
      </Button>
      <Button variant="primary" onClick={onExport} icon={<Download size={16} />}>
        Export
      </Button>
      {canCreateDeliverable ? (
        <Button
          variant="outline"
          loading={deliverableLoading}
          onClick={onDeliverable} icon={<Plus size={16} />}>
          Create deliverable
        </Button>
      ) : null}
    </div>
  )
}
