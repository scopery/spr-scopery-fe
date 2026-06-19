import type { ProjectDocumentListItem } from '@/modules/documents/document'
import type { ProjectSection } from './project-section-types'

export interface ProjectSectionGroupProps {
  orgId: string
  projectId: string
  title: string
  description?: string | null
  documents: ProjectDocumentListItem[]
  canManage: boolean
  section?: ProjectSection
  onRename?: () => void
  onArchive?: () => void
  onNewDocument?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onPinToggle: (documentId: string, pinned: boolean) => void
  onDetach: (documentId: string) => void
  onMoveDocument?: (documentId: string) => void
  onMoveDocumentUp?: (documentId: string) => void
  onMoveDocumentDown?: (documentId: string) => void
  pinLoading?: string | null
}

export interface SectionFormDialogProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'rename'
  section?: ProjectSection | null
  onSubmit: (values: { title: string; description: string | null }) => Promise<void>
}

export interface MoveDocumentToSectionDialogProps {
  open: boolean
  onClose: () => void
  sections: ProjectSection[]
  documentTitle?: string
  currentSectionId?: string | null
  onMove: (sectionId: string | null) => Promise<void>
}
