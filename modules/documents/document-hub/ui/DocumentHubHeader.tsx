'use client'

import { Plus, Download, FileOutput, LayoutGrid, List } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export type DocumentHubViewMode = 'grid' | 'table'

type DocumentHubHeaderProps = {
  canCreateDocument: boolean
  canExportDocuments: boolean
  canCreateDeliverable: boolean
  selectedCount: number
  totalCount: number
  deliverableLoading: boolean
  viewMode: DocumentHubViewMode
  onViewModeChange: (mode: DocumentHubViewMode) => void
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
  viewMode,
  onViewModeChange,
  onCreate,
  onExport,
  onDeliverable,
}: DocumentHubHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Typography as="h1" size="lg" weight="semibold">
          Document Hub
        </Typography>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Search and manage project knowledge across your workspace.
        </Typography>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex h-8 border border-neutral-200 bg-white"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            aria-pressed={viewMode === 'grid'}
            title="Grid view"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center transition-colors',
              viewMode === 'grid'
                ? 'bg-secondary text-white'
                : 'text-neutral-600 hover:bg-neutral-50'
            )}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'table'}
            title="Table view"
            onClick={() => onViewModeChange('table')}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center border-l border-neutral-200 transition-colors',
              viewMode === 'table'
                ? 'bg-secondary text-white'
                : 'text-neutral-600 hover:bg-neutral-50'
            )}
          >
            <List size={14} />
          </button>
        </div>

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
            {selectedCount > 0 ? 'Create deliverable' : 'Create deliverable'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
