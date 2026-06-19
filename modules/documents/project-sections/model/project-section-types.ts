import type { ProjectDocumentListItem } from '@/modules/documents/document'

export type ProjectSectionStatus = 'active' | 'archived'

export interface ProjectSection {
  id: string
  org_id: string
  project_id: string
  title: string
  description: string | null
  icon: string | null
  color: string | null
  display_order: number
  status: ProjectSectionStatus
  is_default: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface ProjectSectionGroup {
  section: ProjectSection
  documents: ProjectDocumentListItem[]
  document_count: number
}

export interface GroupedProjectDocuments {
  sections: ProjectSectionGroup[]
  pinned: ProjectDocumentListItem[]
  unsectioned: ProjectDocumentListItem[]
  total: number
}

export const UNSECTIONED_SECTION_KEY = '__unsectioned__'
