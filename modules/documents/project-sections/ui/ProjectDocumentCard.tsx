'use client'

import Link from 'next/link'
import { Move, Pin, PinOff, Unlink } from 'lucide-react'
import { Typography, Button, Badge } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { snippet } from '@/modules/documents/document'
import type { ProjectDocumentCardProps } from '@/modules/documents/document'
import { DocumentTypeBadge } from '@/modules/documents/document/ui/DocumentTypeBadge'
import { DocumentVisibilityBadge } from '@/modules/documents/document/ui/DocumentVisibilityBadge'

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
  const href = ROUTES.workspace.document(orgId, item.document_id, projectId)

  return (
    <article className="border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={href} className="group block">
            <Typography as="h3" weight="semibold" className="truncate group-hover:text-primary">
              {item.title}
            </Typography>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DocumentTypeBadge type={item.document_type} />
            <DocumentVisibilityBadge visibility={item.visibility} />
            {item.pinned && (
              <Badge variant="soft" tone="warning">
                Pinned
              </Badge>
            )}
            {(item.link_count ?? 0) > 0 && (
              <Badge variant="soft" tone="info">
                {item.link_count} link{(item.link_count ?? 0) === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
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
        <Typography variant="small" tone="muted" className="mb-3 line-clamp-2">
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
            <Button variant="ghost">
              Open
            </Button>
          </Link>
          {canManage && onMoveToSection && (
            <Button variant="ghost" onClick={onMoveToSection} icon={<Move size={16} />}>
              Move
            </Button>
          )}
          {canManage && (
            <Button
              variant="ghost"
              className="text-error"
              onClick={() => onDetach(item.document_id)} icon={<Unlink size={16} />}>
              Detach
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
