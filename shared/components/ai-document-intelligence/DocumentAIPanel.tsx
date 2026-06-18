'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as aiDocService from '@/services/ai-document-intelligence.service'
import { AIGeneratedBadge, originLabel } from './AIGeneratedBadge'
import { AIPreviewDialog } from './AIPreviewDialog'
import { RelatedDocumentsPanel } from './RelatedDocumentsPanel'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'
import type { DocumentOriginType } from '@/types/document'

interface DocumentAIPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  documentTitle: string
  generatedByAI?: boolean
  originType?: DocumentOriginType
  permissions: {
    canSummarizeDocument: boolean
    canFindRelatedDocuments: boolean
    canViewAIMetadata: boolean
  }
}

export function DocumentAIPanel({
  orgId,
  documentId,
  projectId,
  documentTitle,
  generatedByAI,
  originType,
  permissions,
}: DocumentAIPanelProps) {
  const router = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<aiDocService.AIStructuredPreview | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<aiDocService.DocumentAIMetadata | null>(null)

  const showPanel =
    permissions.canSummarizeDocument ||
    permissions.canFindRelatedDocuments ||
    (permissions.canViewAIMetadata && generatedByAI)

  if (!showPanel) return null

  const handleError = (err: unknown) => {
    const msg =
      err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'AI action failed'
    toast.error(msg)
  }

  const summarize = async () => {
    setLoading(true)
    setPreviewOpen(true)
    setPreview(null)
    try {
      const res = await aiDocService.summarizeDocument(orgId, documentId, {
        project_id: projectId,
        save: false,
      })
      if ('preview' in res) {
        setPreview(res.preview)
        setGenerationId(res.generationId)
        setWarnings(res.warnings ?? [])
      }
    } catch (err) {
      setPreviewOpen(false)
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const saveSummary = async () => {
    if (!preview || !generationId || !projectId) {
      toast.error('Open this document from a project to save the summary.')
      return
    }
    setLoading(true)
    try {
      const res = await aiDocService.saveAIPreviewAsDocument(orgId, {
        generation_id: generationId,
        project_id: projectId,
        title: preview.title,
        sections: preview.sections,
        origin_type: 'document_summary',
        document_type: 'summary',
      })
      toast.success('Summary saved')
      setPreviewOpen(false)
      router.push(ROUTES.org.document(orgId, res.document.id, projectId))
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMetadata = () => {
    if (metadata || !permissions.canViewAIMetadata) return
    aiDocService.getDocumentAIMetadata(orgId, documentId).then(setMetadata).catch(() => {})
  }

  return (
    <div className="space-y-4">
      {(generatedByAI || originType) && (
        <div className="border border-neutral-200 bg-white p-4 space-y-2">
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
            <Button variant="ghost" size="sm" onClick={loadMetadata}>
              Show AI metadata
            </Button>
          )}
          {metadata?.ai_metadata && (
            <Typography variant="small" className="text-neutral-600 whitespace-pre-wrap">
              {JSON.stringify(metadata.ai_metadata, null, 2)}
            </Typography>
          )}
        </div>
      )}

      {permissions.canSummarizeDocument && (
        <div className="border border-neutral-200 bg-white p-4">
          <Typography as="h3" weight="semibold" className="mb-2">
            AI actions
          </Typography>
          <Button variant="outline" size="sm" icon={<Sparkles size={16} />} onClick={summarize}>
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
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={preview}
        warnings={warnings}
        loading={loading && !preview}
        onSave={generationId && projectId ? saveSummary : undefined}
        saveLabel={`Save summary of “${documentTitle}”`}
      />
    </div>
  )
}
