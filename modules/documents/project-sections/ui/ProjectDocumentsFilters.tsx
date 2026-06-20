'use client'

import { Search, FolderPlus, LayoutTemplate } from 'lucide-react'
import { Typography, Button, Input, Select } from '@/shared/ui'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
  type DocumentType,
  type DocumentWorkflowStatus,
} from '@/modules/documents/document'

type ProjectDocumentsFiltersProps = {
  canManageSections: boolean
  sectionsCount: number
  actionLoading: boolean
  search: string
  onSearchChange: (value: string) => void
  typeFilter: DocumentType | ''
  onTypeFilterChange: (value: DocumentType | '') => void
  statusFilter: 'active' | 'archived'
  onStatusFilterChange: (value: 'active' | 'archived') => void
  workflowFilter: DocumentWorkflowStatus | ''
  onWorkflowFilterChange: (value: DocumentWorkflowStatus | '') => void
  sectionFilter: string
  onSectionFilterChange: (value: string) => void
  sectionFilterOptions: Array<{ value: string; label: string }>
  pinnedOnly: boolean
  onPinnedOnlyToggle: () => void
  onNewSection: () => void
  onCreateDefaultSections: () => void
}

export function ProjectDocumentsFilters({
  canManageSections,
  sectionsCount,
  actionLoading,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  workflowFilter,
  onWorkflowFilterChange,
  sectionFilter,
  onSectionFilterChange,
  sectionFilterOptions,
  pinnedOnly,
  onPinnedOnlyToggle,
  onNewSection,
  onCreateDefaultSections,
}: ProjectDocumentsFiltersProps) {
  return (
    <>
      <div className="mb-6">
        <Typography as="h2" weight="semibold" className="text-neutral-900">
          Documents Space
        </Typography>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Organize project notes, decisions, research, and summaries.
        </Typography>
      </div>

      {canManageSections && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewSection}
            className="flex items-center gap-2"
          >
            <FolderPlus size={16} aria-hidden />
            New section
          </Button>
          {sectionsCount === 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={actionLoading}
              onClick={() => void onCreateDefaultSections()}
              className="flex items-center gap-2"
            >
              <LayoutTemplate size={16} aria-hidden />
              Create default sections
            </Button>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
            aria-hidden
          />
          <Input
            aria-label="Search documents"
            placeholder="Search by title or content…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            fullWidth
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={typeFilter || '__all__'}
            onValueChange={(v: string) =>
              onTypeFilterChange(v === '__all__' ? '' : (v as DocumentType))
            }
            options={[
              { value: '__all__', label: 'All types' },
              ...DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-full sm:w-36">
          <Select
            value={statusFilter}
            onValueChange={(v: string) => onStatusFilterChange(v as 'active' | 'archived')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            value={workflowFilter || '__all__'}
            onValueChange={(v: string) =>
              onWorkflowFilterChange(v === '__all__' ? '' : (v as DocumentWorkflowStatus))
            }
            options={[
              { value: '__all__', label: 'All workflow' },
              ...DOCUMENT_WORKFLOW_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={sectionFilter || '__all__'}
            onValueChange={(v: string) => onSectionFilterChange(v === '__all__' ? '' : v)}
            options={sectionFilterOptions}
          />
        </div>
        <Button
          variant={pinnedOnly ? 'primary' : 'outline'}
          size="md"
          onClick={onPinnedOnlyToggle}
          aria-pressed={pinnedOnly}
        >
          Pinned only
        </Button>
      </div>
    </>
  )
}
