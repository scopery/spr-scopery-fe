'use client'

import { Plus, Download, FileOutput } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'

type DocumentHubHeaderProps = {
  canCreateDocument: boolean
  canExportDocuments: boolean
  canCreateDeliverable: boolean
  selectedCount: number
  totalCount: number
  deliverableLoading: boolean
  onCreate: () => void
  onExport: () => void
  onDeliverable: () => void
}

export function DocumentHubHeader({
  canCreateDocument,
  canExportDocuments,
  canCreateDeliverable,
  selectedCount,
  totalCount,
  deliverableLoading,
  onCreate,
  onExport,
  onDeliverable,
}: DocumentHubHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Typography as="h1" variant="h1" weight="semibold">
          Document Hub
        </Typography>
        <Typography tone="muted" className="mt-1">
          Search and manage project knowledge across your workspace.
        </Typography>
      </div>
      {canCreateDocument && (
        <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={onCreate}>
          New document
        </Button>
      )}
      {canExportDocuments && (
        <Button
          variant="outline"
          size="sm"
          icon={<Download size={16} />}
          disabled={selectedCount === 0 && totalCount === 0}
          onClick={onExport}
        >
          Export
        </Button>
      )}
      {canCreateDeliverable && (
        <Button
          variant="outline"
          size="sm"
          icon={<FileOutput size={16} />}
          loading={deliverableLoading}
          onClick={onDeliverable}
        >
          {selectedCount > 0 ? 'Create deliverable from selected' : 'Create deliverable'}
        </Button>
      )}
    </div>
  )
}
