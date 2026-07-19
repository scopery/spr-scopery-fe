'use client'

import { Button, Stack, Typography } from '@/shared/ui'
import { Paperclip, Upload } from 'lucide-react'
import { useDocumentAttachments } from '../hooks/useDocumentAttachments'
import type { DocumentAttachment } from '../model/document-attachment'

function statusLabel(status: DocumentAttachment['storageStatus']) {
  switch (status) {
    case 'AVAILABLE':
      return 'Ready'
    case 'PENDING_UPLOAD':
      return 'Pending'
    case 'FAILED':
      return 'Failed'
    case 'PURGED':
      return 'Purged'
    default:
      return status
  }
}

export function DocumentAttachmentsPanel({
  projectId,
  documentId,
}: {
  projectId: string
  documentId: string
}) {
  const {
    items,
    loading,
    error,
    uploading,
    progress,
    inputRef,
    uploadFiles,
    openFilePicker,
  } = useDocumentAttachments(projectId, documentId)

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <div className="flex items-center justify-between gap-sm">
        <Typography variant="h4">Attachments</Typography>
        <Button
          size="sm"
          variant="outline"
          icon={<Upload size={14} />}
          disabled={uploading}
          onClick={openFilePicker}
        >
          {uploading ? `Uploading ${progress}%` : 'Upload'}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        aria-label="Upload attachments"
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files)
        }}
      />

      {error ? <Typography tone="error">{error}</Typography> : null}
      {loading && !items.length ? (
        <Typography tone="muted" variant="caption">
          Loading…
        </Typography>
      ) : null}
      {!loading && !items.length ? (
        <Typography tone="muted" variant="caption">
          No attachments yet. Upload images or files for this document.
        </Typography>
      ) : null}

      <ul className="divide-y divide-neutral-200">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-sm py-xs text-sm">
            <Paperclip size={14} className="mt-0.5 shrink-0 text-neutral-500" />
            <div className="min-w-0 flex-1">
              <Typography variant="small" className="truncate">
                {a.fileName}
              </Typography>
              <Typography variant="caption" tone="muted">
                {statusLabel(a.storageStatus)}
                {a.mediaType ? ` · ${a.mediaType}` : ''}
                {a.fileSizeBytes != null ? ` · ${formatBytes(a.fileSizeBytes)}` : ''}
              </Typography>
            </div>
          </li>
        ))}
      </ul>
    </Stack>
  )
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
