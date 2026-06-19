'use client'

import { Sparkles } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import type { DocumentAIPanelProps } from '../model/ai-document-intelligence'
import { AIGeneratedBadge, originLabel } from './AIGeneratedBadge'
import { AIPreviewDialog } from './AIPreviewDialog'
import { RelatedDocumentsPanel } from '@/modules/ai-document-intelligence/related-documents/ui/RelatedDocumentsPanel'
import { useDocumentAIPanel } from '../hooks/useDocumentAIPanel'

export function DocumentAIPanel({
  orgId,
  documentId,
  projectId,
  documentTitle,
  generatedByAI,
  originType,
  permissions,
}: DocumentAIPanelProps) {
  const panel = useDocumentAIPanel({ orgId, documentId, projectId, permissions })

  const showPanel =
    permissions.canSummarizeDocument ||
    permissions.canFindRelatedDocuments ||
    (permissions.canViewAIMetadata && generatedByAI)

  if (!showPanel) return null

  return (
    <div className="space-y-4">
      {(generatedByAI || originType) && (
        <div className="space-y-2 border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Typography as="h3" weight="semibold">
              Document origin
            </Typography>
            <AIGeneratedBadge generatedByAI={generatedByAI} originType={originType} />
          </div>
          {originType && (
            <Typography variant="small" tone="muted">
              {originLabel(originType)}
            </Typography>
          )}
          {permissions.canViewAIMetadata && (
            <Button variant="ghost" size="sm" onClick={panel.loadMetadata}>
              Show AI metadata
            </Button>
          )}
          {panel.metadata?.ai_metadata && (
            <Typography variant="small" className="whitespace-pre-wrap text-neutral-600">
              {JSON.stringify(panel.metadata.ai_metadata, null, 2)}
            </Typography>
          )}
        </div>
      )}

      {permissions.canSummarizeDocument && (
        <div className="border border-neutral-200 bg-white p-4">
          <Typography as="h3" weight="semibold" className="mb-2">
            AI actions
          </Typography>
          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles size={16} />}
            onClick={() => void panel.summarize()}
          >
            Summarize this document
          </Button>
        </div>
      )}

      <RelatedDocumentsPanel
        orgId={orgId}
        documentId={documentId}
        projectId={projectId}
        enabled={permissions.canFindRelatedDocuments}
      />

      <AIPreviewDialog
        open={panel.previewOpen}
        onOpenChange={panel.setPreviewOpen}
        preview={panel.preview}
        warnings={panel.warnings}
        loading={panel.loading && !panel.preview}
        onSave={panel.generationId && projectId ? () => void panel.saveSummary() : undefined}
        saveLabel={`Save summary of “${documentTitle}”`}
      />
    </div>
  )
}
