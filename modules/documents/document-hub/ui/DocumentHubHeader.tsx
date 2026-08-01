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
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Typography as="h1" size="md" weight="medium">
          Document Hub
        </Typography>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Search and manage project knowledge across your workspace.
        </Typography>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canCreateDocument ? (
          <Button size="sm" variant="primary" icon={<Plus size={16} />} onClick={onCreate}>
            New document
          </Button>
        ) : null}
        {canExportDocuments ? (
          <Button
            size="sm"
            variant="outline"
            icon={<Download size={16} />}
            disabled={selectedCount === 0 && totalCount === 0}
            onClick={onExport}
          >
            Export
          </Button>
        ) : null}
        {canCreateDeliverable ? (
          <Button
            size="sm"
            variant="outline"
            icon={<FileOutput size={16} />}
            loading={deliverableLoading}
            onClick={onDeliverable}
          >
            Create deliverable
          </Button>
        ) : null}
      </div>
    </div>
  )
}
