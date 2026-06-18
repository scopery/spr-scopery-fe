'use client'

import Link from 'next/link'
import { Pin, PinOff } from 'lucide-react'
import { Typography, Button, Badge } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import type { ProjectDocumentListItem } from '@/types/document'
import { snippet } from '@/types/document'
import { DocumentTypeBadge } from './DocumentTypeBadge'
import { DocumentVisibilityBadge } from './DocumentVisibilityBadge'

interface ProjectDocumentCardProps {
  orgId: string
  projectId: string
  item: ProjectDocumentListItem
  canManage: boolean
  onPinToggle: (documentId: string, pinned: boolean) => void
  onDetach: (documentId: string) => void
  onMoveToSection?: () => void
  pinLoading?: string | null
}

export function ProjectDocumentCard({
  orgId,
  projectId,
  item,
  canManage,
  onPinToggle,
  onDetach,
  onMoveToSection,
  pinLoading,
}: ProjectDocumentCardProps) {
  const href = ROUTES.org.document(orgId, item.document_id, projectId)

  return (
    <article className="border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <Link href={href} className="block group">
            <Typography as="h3" weight="semibold" className="group-hover:text-primary truncate">
              {item.title}
            </Typography>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <DocumentTypeBadge type={item.document_type} />
            <DocumentVisibilityBadge visibility={item.visibility} />
            {item.pinned && (
              <Badge variant="soft" tone="warning" size="sm">
                Pinned
              </Badge>
            )}
            {(item.link_count ?? 0) > 0 && (
              <Badge variant="soft" tone="info" size="sm">
                {item.link_count} link{(item.link_count ?? 0) === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon={item.pinned ? <PinOff size={16} /> : <Pin size={16} />}
              aria-label={item.pinned ? 'Unpin document' : 'Pin document'}
              loading={pinLoading === item.document_id}
              onClick={() => onPinToggle(item.document_id, !item.pinned)}
            />
          </div>
        )}
      </div>

      {item.plain_text && (
        <Typography variant="small" tone="muted" className="line-clamp-2 mb-3">
          {snippet(item.plain_text)}
        </Typography>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500">
        <Typography variant="small" tone="muted">
          Updated {new Date(item.updated_at).toLocaleDateString()}
          {item.creator_display_name ? ` · ${item.creator_display_name}` : ''}
        </Typography>
        <div className="flex gap-2">
          <Link href={href}>
            <Button variant="ghost" size="sm">
              Open
            </Button>
          </Link>
          {canManage && onMoveToSection && (
            <Button variant="ghost" size="sm" onClick={onMoveToSection}>
              Move
            </Button>
          )}
          {canManage && (
            <Button variant="ghost" size="sm" className="text-error" onClick={() => onDetach(item.document_id)}>
              Detach
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
