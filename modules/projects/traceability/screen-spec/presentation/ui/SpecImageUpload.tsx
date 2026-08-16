'use client'

import { useRef } from 'react'
import { Button, Typography } from '@/shared/ui'
import { SCREEN_MEDIA_CONTENT_TYPES } from '../../domain/rules/screen-media.rules'
import {
  useComponentScreenshotUpload,
  useScreenMockupUpload,
} from '../hooks/useScreenMediaUpload'

export function SpecImageUpload({
  label,
  imageUrl,
  uploading,
  progress,
  error,
  onFile,
}: {
  label: string
  imageUrl: string | null
  uploading: boolean
  progress: number | null
  error: string | null
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="small" weight="medium">
          {label}
        </Typography>
        <Button
          size="sm"
          variant="ghost"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {imageUrl ? 'Replace' : 'Upload'}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={SCREEN_MEDIA_CONTENT_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
      {imageUrl ? (
        // External MinIO URL — not in the Next image host list.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={label}
          className="max-h-48 w-full border border-neutral-200 object-contain"
        />
      ) : (
        <Typography variant="caption" tone="muted">
          PNG, JPEG, WebP, or GIF. Max 5MB. File goes to storage, then the spec is updated.
        </Typography>
      )}
      {progress != null ? (
        <Typography variant="caption" tone="muted">
          Uploading {progress}%
        </Typography>
      ) : null}
      {error ? (
        <Typography variant="caption" className="text-error">
          {error}
        </Typography>
      ) : null}
    </div>
  )
}

export function ScreenMockupUpload({
  workspaceId,
  screenId,
  initialUrl,
}: {
  workspaceId: string
  screenId: string
  initialUrl?: string | null
}) {
  const { imageUrl, progress, error, uploading, onFile } = useScreenMockupUpload(
    workspaceId,
    screenId,
    initialUrl
  )
  return (
    <SpecImageUpload
      label="Screen mockup"
      imageUrl={imageUrl}
      uploading={uploading}
      progress={progress}
      error={error}
      onFile={onFile}
    />
  )
}

export function ComponentScreenshotUpload({
  workspaceId,
  componentId,
  initialUrl,
}: {
  workspaceId: string
  componentId: string
  initialUrl?: string | null
}) {
  const { imageUrl, progress, error, uploading, onFile } = useComponentScreenshotUpload(
    workspaceId,
    componentId,
    initialUrl
  )
  return (
    <SpecImageUpload
      label="Component screenshot"
      imageUrl={imageUrl}
      uploading={uploading}
      progress={progress}
      error={error}
      onFile={onFile}
    />
  )
}
