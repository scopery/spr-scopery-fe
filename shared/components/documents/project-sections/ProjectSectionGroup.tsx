'use client'

import { ChevronDown, ChevronUp, FolderOpen, Plus } from 'lucide-react'
import { Typography, Button, Badge } from '@/shared/ui'
import { ProjectDocumentCard } from '../ProjectDocumentCard'
import type { ProjectDocumentListItem } from '@/types/document'
import type { ProjectSection } from '@/types/project-section'

interface ProjectSectionGroupProps {
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

export function ProjectSectionGroup({
  orgId,
  projectId,
  title,
  description,
  documents,
  canManage,
  section,
  onRename,
  onArchive,
  onNewDocument,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onPinToggle,
  onDetach,
  onMoveDocument,
  onMoveDocumentUp,
  onMoveDocumentDown,
  pinLoading,
}: ProjectSectionGroupProps) {
  return (
    <section aria-labelledby={`section-${section?.id ?? 'unsectioned'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-neutral-500 shrink-0" aria-hidden />
            <Typography as="h3" id={`section-${section?.id ?? 'unsectioned'}`} weight="semibold">
              {title}
            </Typography>
            <Badge variant="soft" tone="neutral" size="sm">
              {documents.length}
            </Badge>
          </div>
          {description && (
            <Typography variant="small" tone="muted" className="mt-1 ml-7">
              {description}
            </Typography>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {onMoveUp && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={<ChevronUp size={16} />}
                aria-label="Move section up"
                disabled={!canMoveUp}
                onClick={onMoveUp}
              />
            )}
            {onMoveDown && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={<ChevronDown size={16} />}
                aria-label="Move section down"
                disabled={!canMoveDown}
                onClick={onMoveDown}
              />
            )}
            {onNewDocument && (
              <Button variant="outline" size="sm" onClick={onNewDocument} className="flex items-center gap-1">
                <Plus size={14} aria-hidden />
                New document
              </Button>
            )}
            {onRename && (
              <Button variant="ghost" size="sm" onClick={onRename}>
                Rename
              </Button>
            )}
            {onArchive && section && (
              <Button variant="ghost" size="sm" onClick={onArchive}>
                Archive
              </Button>
            )}
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <Typography variant="small" tone="muted" className="py-4 border border-dashed border-neutral-200 px-4">
          No documents in this section yet.
        </Typography>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((item, index) => (
            <div key={item.link_id} className="relative">
              {canManage && (onMoveDocumentUp || onMoveDocumentDown) && (
                <div className="absolute top-2 right-2 z-10 flex gap-0.5">
                  {onMoveDocumentUp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<ChevronUp size={14} />}
                      aria-label="Move document up"
                      disabled={index === 0}
                      onClick={() => onMoveDocumentUp(item.document_id)}
                    />
                  )}
                  {onMoveDocumentDown && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<ChevronDown size={14} />}
                      aria-label="Move document down"
                      disabled={index === documents.length - 1}
                      onClick={() => onMoveDocumentDown(item.document_id)}
                    />
                  )}
                </div>
              )}
              <ProjectDocumentCard
                orgId={orgId}
                projectId={projectId}
                item={item}
                canManage={canManage}
                onPinToggle={onPinToggle}
                onDetach={onDetach}
                onMoveToSection={onMoveDocument ? () => onMoveDocument(item.document_id) : undefined}
                pinLoading={pinLoading}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
