'use client'

import { EmptyDocumentsState, ProjectSectionGroup } from '@/modules/documents'
import { UNSECTIONED_SECTION_KEY } from '@/modules/documents'
import type { GroupedProjectDocuments, ProjectSection } from '../model/project-section-types'

type ProjectDocumentsContentProps = {
  orgId: string
  projectId: string
  grouped: GroupedProjectDocuments | null
  sections: ProjectSection[]
  canManageDocuments: boolean
  canCreateDocument: boolean
  pinnedOnly: boolean
  sectionFilter: string
  pinLoading: string | null
  onPinToggle: (documentId: string, pinned: boolean) => void
  onDetach: (documentId: string) => void
  onMoveDocument: (documentId: string) => void
  onRenameSection: (section: ProjectSection) => void
  onArchiveSection: (section: ProjectSection) => void
  onCreateInSection: (sectionId: string | null) => void
  onMoveSection: (index: number, direction: 'up' | 'down') => void
  onMoveDocumentInList: (
    docs: GroupedProjectDocuments['unsectioned'],
    index: number,
    direction: 'up' | 'down',
    sectionId: string | null
  ) => void
}

export function ProjectDocumentsContent({
  orgId,
  projectId,
  grouped,
  sections,
  canManageDocuments,
  canCreateDocument,
  pinnedOnly,
  sectionFilter,
  pinLoading,
  onPinToggle,
  onDetach,
  onMoveDocument,
  onRenameSection,
  onArchiveSection,
  onCreateInSection,
  onMoveSection,
  onMoveDocumentInList,
}: ProjectDocumentsContentProps) {
  const hasContent = grouped && (grouped.total > 0 || sections.length > 0)

  if (!hasContent) {
    return (
      <EmptyDocumentsState
        canCreate={canCreateDocument}
        onCreate={() => onCreateInSection(null)}
      />
    )
  }

  if (!grouped) return null

  const showPinned = !pinnedOnly && grouped.pinned.length > 0 && !sectionFilter
  const showSections =
    !sectionFilter ||
    sectionFilter === '__all__' ||
    (sectionFilter !== UNSECTIONED_SECTION_KEY && !!sectionFilter)
  const showUnsectioned =
    grouped.unsectioned.length > 0 &&
    (!sectionFilter || sectionFilter === UNSECTIONED_SECTION_KEY)

  return (
    <div className="space-y-8">
      {!pinnedOnly && showPinned && (
        <ProjectSectionGroup
          orgId={orgId}
          projectId={projectId}
          title="Pinned"
          documents={grouped.pinned}
          canManage={canManageDocuments}
          onPinToggle={onPinToggle}
          onDetach={onDetach}
          onMoveDocument={canManageDocuments ? onMoveDocument : undefined}
          pinLoading={pinLoading}
        />
      )}

      {showSections &&
        grouped.sections
          .filter(
            (group) =>
              !sectionFilter ||
              sectionFilter === '__all__' ||
              group.section.id === sectionFilter
          )
          .map((group, index) => (
            <ProjectSectionGroup
              key={group.section.id}
              orgId={orgId}
              projectId={projectId}
              title={group.section.title}
              description={group.section.description}
              documents={group.documents}
              canManage={canManageDocuments}
              section={group.section}
              onRename={() => onRenameSection(group.section)}
              onArchive={() => onArchiveSection(group.section)}
              onNewDocument={() => onCreateInSection(group.section.id)}
              onMoveUp={
                canManageDocuments ? () => void onMoveSection(index, 'up') : undefined
              }
              onMoveDown={
                canManageDocuments ? () => void onMoveSection(index, 'down') : undefined
              }
              canMoveUp={index > 0}
              canMoveDown={index < grouped.sections.length - 1}
              onPinToggle={onPinToggle}
              onDetach={onDetach}
              onMoveDocument={canManageDocuments ? onMoveDocument : undefined}
              onMoveDocumentUp={
                canManageDocuments
                  ? (docId) => {
                      const idx = group.documents.findIndex((d) => d.document_id === docId)
                      if (idx >= 0)
                        void onMoveDocumentInList(group.documents, idx, 'up', group.section.id)
                    }
                  : undefined
              }
              onMoveDocumentDown={
                canManageDocuments
                  ? (docId) => {
                      const idx = group.documents.findIndex((d) => d.document_id === docId)
                      if (idx >= 0)
                        void onMoveDocumentInList(group.documents, idx, 'down', group.section.id)
                    }
                  : undefined
              }
              pinLoading={pinLoading}
            />
          ))}

      {showUnsectioned && (
        <ProjectSectionGroup
          orgId={orgId}
          projectId={projectId}
          title="Unsectioned"
          documents={grouped.unsectioned}
          canManage={canManageDocuments}
          onNewDocument={() => onCreateInSection(null)}
          onPinToggle={onPinToggle}
          onDetach={onDetach}
          onMoveDocument={canManageDocuments ? onMoveDocument : undefined}
          onMoveDocumentUp={
            canManageDocuments
              ? (docId) => {
                  const idx = grouped.unsectioned.findIndex((d) => d.document_id === docId)
                  if (idx >= 0)
                    void onMoveDocumentInList(grouped.unsectioned, idx, 'up', null)
                }
              : undefined
          }
          onMoveDocumentDown={
            canManageDocuments
              ? (docId) => {
                  const idx = grouped.unsectioned.findIndex((d) => d.document_id === docId)
                  if (idx >= 0)
                    void onMoveDocumentInList(grouped.unsectioned, idx, 'down', null)
                }
              : undefined
          }
          pinLoading={pinLoading}
        />
      )}
    </div>
  )
}
