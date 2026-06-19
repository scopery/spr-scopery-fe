'use client'

import { Search } from 'lucide-react'
import { Input, Select } from '@/shared/ui'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
  type DocumentWorkflowStatus,
} from '@/modules/documents/document'
import type { ProjectListItem } from '../hooks/useDocumentHub'

type DocumentHubFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  projectId: string
  onProjectIdChange: (value: string) => void
  documentType: string
  onDocumentTypeChange: (value: string) => void
  originType: string
  onOriginTypeChange: (value: string) => void
  aiOnly: string
  onAiOnlyChange: (value: string) => void
  lifecycleStatus: 'active' | 'archived'
  onLifecycleStatusChange: (value: 'active' | 'archived') => void
  workflowStatus: DocumentWorkflowStatus | ''
  onWorkflowStatusChange: (value: DocumentWorkflowStatus | '') => void
  projects: ProjectListItem[]
}

export function DocumentHubFilters({
  search,
  onSearchChange,
  projectId,
  onProjectIdChange,
  documentType,
  onDocumentTypeChange,
  originType,
  onOriginTypeChange,
  aiOnly,
  onAiOnlyChange,
  lifecycleStatus,
  onLifecycleStatusChange,
  workflowStatus,
  onWorkflowStatusChange,
  projects,
}: DocumentHubFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <div className="relative lg:col-span-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          size={16}
        />
        <Input
          placeholder="Search documents…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          fullWidth
        />
      </div>
      <Select
        value={projectId || '__all__'}
        onValueChange={(v: string) => onProjectIdChange(v === '__all__' ? '' : v)}
        options={[
          { value: '__all__', label: 'All projects' },
          ...projects.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <Select
        value={documentType || '__all__'}
        onValueChange={(v: string) => onDocumentTypeChange(v === '__all__' ? '' : v)}
        options={[
          { value: '__all__', label: 'All types' },
          ...DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        ]}
      />
      <Select
        value={originType || '__all__'}
        onValueChange={(v: string) => onOriginTypeChange(v === '__all__' ? '' : v)}
        options={[
          { value: '__all__', label: 'All origins' },
          { value: 'manual', label: 'Manual' },
          { value: 'ai_generated', label: 'AI generated' },
          { value: 'project_summary', label: 'Project brief' },
          { value: 'document_summary', label: 'Summary' },
          { value: 'qa_session', label: 'QA session' },
          { value: 'clarity_assessment', label: 'Clarity' },
          { value: 'readiness_summary', label: 'Readiness' },
        ]}
      />
      <Select
        value={aiOnly || '__all__'}
        onValueChange={(v: string) => onAiOnlyChange(v === '__all__' ? '' : v)}
        options={[
          { value: '__all__', label: 'AI: any' },
          { value: 'true', label: 'AI generated only' },
          { value: 'false', label: 'Not AI generated' },
        ]}
      />
      <Select
        value={lifecycleStatus}
        onValueChange={(v: string) => onLifecycleStatusChange(v as 'active' | 'archived')}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
      />
      <Select
        value={workflowStatus || '__all__'}
        onValueChange={(v: string) =>
          onWorkflowStatusChange(v === '__all__' ? '' : (v as DocumentWorkflowStatus))
        }
        options={[
          { value: '__all__', label: 'All workflow' },
          ...DOCUMENT_WORKFLOW_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        ]}
      />
    </div>
  )
}
