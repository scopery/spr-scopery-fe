import type { ProjectDocumentListItem } from '../model/document'

export interface ProjectDocumentCardProps {
  orgId: string
  projectId: string
  item: ProjectDocumentListItem
  canManage: boolean
  onPinToggle: (documentId: string, pinned: boolean) => void
  onDetach: (documentId: string) => void
  onMoveToSection?: () => void
  pinLoading?: string | null
}
