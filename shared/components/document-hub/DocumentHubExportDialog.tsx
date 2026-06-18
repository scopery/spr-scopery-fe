'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Modal, Select, Typography, ContentLoader } from '@/shared/ui'
import type { DocumentExportFormat, ExportPackageFormat } from '@/utils/exportDownload'
import * as documentExportService from '@/services/document-export.service'

export type DocumentHubSelectionMode = 'page_selected' | 'filtered_all'

export interface DocumentHubExportOptions {
  format: DocumentExportFormat
  packageFormat: ExportPackageFormat
  includeEvidenceIndex: boolean
  includeArchived: boolean
}

interface DocumentHubExportDialogProps {
  open: boolean
  onClose: () => void
  orgId: string
  selectionMode: DocumentHubSelectionMode
  selectedCount: number
  totalCount: number
  filters: Record<string, unknown>
  documentIds: string[]
  lifecycleStatus: 'active' | 'archived'
  loading?: boolean
  onExport: (options: DocumentHubExportOptions, previewUsed: boolean) => Promise<void>
}

export function DocumentHubExportDialog({
  open,
  onClose,
  orgId,
  selectionMode,
  selectedCount,
  totalCount,
  filters,
  documentIds,
  lifecycleStatus,
  loading = false,
  onExport,
}: DocumentHubExportDialogProps) {
  const [format, setFormat] = useState<DocumentExportFormat>('markdown')
  const [packageFormat, setPackageFormat] = useState<ExportPackageFormat>('zip')
  const [includeEvidenceIndex, setIncludeEvidenceIndex] = useState(true)
  const [includeArchived, setIncludeArchived] = useState(lifecycleStatus === 'archived')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<documentExportService.DocumentHubExportPreviewResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const exportMode = selectionMode === 'filtered_all' ? 'filtered' : 'selected'
  const exportDocumentCount = selectionMode === 'filtered_all' ? totalCount : selectedCount

  const buildPreviewBody = useCallback(() => ({
    mode: exportMode as 'selected' | 'filtered',
    document_ids: exportMode === 'selected' ? documentIds : undefined,
    filters: exportMode === 'filtered' ? filters : undefined,
    format,
    package_format: packageFormat,
    include_evidence_index: includeEvidenceIndex,
    include_archived: lifecycleStatus === 'archived' ? true : includeArchived,
  }), [
    documentIds,
    exportMode,
    filters,
    format,
    includeArchived,
    includeEvidenceIndex,
    lifecycleStatus,
    packageFormat,
  ])

  useEffect(() => {
    if (!open) {
      setPreview(null)
      setPreviewError(null)
      return
    }

    if (exportMode === 'selected' && documentIds.length === 0) {
      setPreview(null)
      return
    }

    const timer = setTimeout(() => {
      setPreviewLoading(true)
      setPreviewError(null)
      documentExportService
        .previewDocumentHubExport(orgId, buildPreviewBody())
        .then((result) => setPreview(result))
        .catch((err: unknown) => {
          setPreview(null)
          setPreviewError(err instanceof Error ? err.message : 'Failed to load export preview')
        })
        .finally(() => setPreviewLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [open, orgId, buildPreviewBody, exportMode, documentIds.length])

  const buildOptions = (): DocumentHubExportOptions => ({
    format,
    packageFormat,
    includeEvidenceIndex,
    includeArchived: lifecycleStatus === 'archived' ? true : includeArchived,
  })

  const estimatedSize =
    packageFormat === 'zip'
      ? preview?.estimated_zip_size_bytes
      : preview?.estimated_serialized_size_bytes

  const handleExport = async () => {
    await onExport(buildOptions(), preview !== null)
  }

  const canExport = preview?.can_export ?? false

  return (
    <Modal open={open} onClose={onClose} title="Export documents" size="sm">
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          {selectionMode === 'filtered_all'
            ? `Export all ${totalCount} matching filtered documents (cross-page).`
            : `Export ${selectedCount} selected document${selectedCount === 1 ? '' : 's'}.`}
        </Typography>

        <Select
          label="Content format"
          value={format}
          onValueChange={(v: string) => setFormat(v as DocumentExportFormat)}
          options={[
            { value: 'markdown', label: 'Markdown (.md)' },
            { value: 'text', label: 'Plain text (.txt)' },
          ]}
        />

        <Typography variant="small" tone="muted">
          PDF/DOCX and HTML export are not available yet.
        </Typography>

        <Select
          label="Package format"
          value={packageFormat}
          onValueChange={(v: string) => setPackageFormat(v as ExportPackageFormat)}
          options={[
            { value: 'zip', label: 'ZIP archive (recommended)' },
            { value: 'json', label: 'JSON package (multiple downloads)' },
          ]}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeEvidenceIndex}
            onChange={(e) => setIncludeEvidenceIndex(e.target.checked)}
          />
          Include evidence index
        </label>

        {lifecycleStatus === 'archived' && (
          <Typography variant="small" tone="muted">
            Archived documents are included because the archived filter is active.
          </Typography>
        )}

        <div className="border border-neutral-200 bg-neutral-50 p-3 space-y-2">
          <Typography variant="small" weight="semibold">
            Export preview
          </Typography>
          {previewLoading ? (
            <div className="flex items-center gap-2 py-2">
              <ContentLoader variant="easeOut" className="w-8" />
              <Typography variant="small" tone="muted">
                Estimating package size…
              </Typography>
            </div>
          ) : previewError ? (
            <Typography variant="small" tone="error">
              {previewError}
            </Typography>
          ) : preview ? (
            <div className="space-y-1 text-sm text-neutral-600">
              <div>Documents: {preview.document_count}</div>
              {preview.evidence_link_count > 0 && (
                <div>Evidence links: {preview.evidence_link_count}</div>
              )}
              {estimatedSize !== undefined && (
                <div>
                  Estimated size: {documentExportService.formatExportSize(estimatedSize)}
                </div>
              )}
              {preview.suggested_filename && (
                <div className="truncate">File: {preview.suggested_filename}</div>
              )}
              {preview.warnings.length > 0 && (
                <ul className="list-disc pl-4 pt-1 space-y-1">
                  {preview.warnings.slice(0, 4).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              {preview.blocked_reason && (
                <Typography variant="small" tone="error" className="pt-1">
                  {preview.blocked_reason}
                </Typography>
              )}
            </div>
          ) : (
            <Typography variant="small" tone="muted">
              Select documents to preview export.
            </Typography>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!canExport || exportDocumentCount === 0 || previewLoading}
            onClick={() => void handleExport()}
          >
            {loading
              ? 'Preparing export…'
              : `Export ${exportDocumentCount} document${exportDocumentCount === 1 ? '' : 's'}`}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
