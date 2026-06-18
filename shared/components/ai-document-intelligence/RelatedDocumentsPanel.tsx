'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as aiDocService from '@/services/ai-document-intelligence.service'
import { DocumentTypeBadge } from '@/shared/components/documents/DocumentTypeBadge'

interface RelatedDocumentsPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  enabled: boolean
}

export function RelatedDocumentsPanel({ orgId, documentId, projectId, enabled }: RelatedDocumentsPanelProps) {
  const [items, setItems] = useState<aiDocService.RelatedDocumentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    aiDocService
      .findRelatedDocuments(orgId, documentId, { project_id: projectId, limit: 8 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [enabled, orgId, documentId, projectId])

  if (!enabled) return null

  return (
    <div className="border border-neutral-200 bg-white p-4 space-y-3">
      <Typography as="h3" weight="semibold">
        Related documents
      </Typography>
      {loading && (
        <Typography variant="small" tone="muted">
          Finding related documents…
        </Typography>
      )}
      {!loading && items.length === 0 && (
        <Typography variant="small" tone="muted">
          No related documents found.
        </Typography>
      )}
      {items.map((item) => (
        <div key={item.document_id} className="border-t border-neutral-100 pt-3 first:border-0 first:pt-0">
          <Link
            href={ROUTES.org.document(orgId, item.document_id, item.project_id ?? undefined)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {item.title}
          </Link>
          <div className="flex flex-wrap gap-2 mt-1">
            <DocumentTypeBadge type={item.document_type as never} />
            {item.project_name && (
              <Typography variant="small" tone="muted">
                {item.project_name}
              </Typography>
            )}
          </div>
          <Typography variant="small" tone="muted" className="mt-1 line-clamp-2">
            {item.snippet}
          </Typography>
          <Typography variant="small" className="text-neutral-500 mt-1">
            {item.reason}
          </Typography>
        </div>
      ))}
    </div>
  )
}
