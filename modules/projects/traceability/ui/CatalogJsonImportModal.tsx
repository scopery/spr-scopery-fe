'use client'

import { useRef, useState } from 'react'
import { Input, JsonImportModal, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { isUuid } from '@/shared/lib/jsonImportValidation'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import {
  SCREEN_FULL_SPEC_IMPORT_GUIDE,
  SCREEN_IMPORT_FULL_MAX_ITEMS,
  validateScreenFullSpecJsonImport,
  type ScreenImportItem,
} from '@/modules/projects/traceability/screen-spec'
import { CATALOG_BULK_IMPORT_GUIDES } from '../model/catalog-bulk-import.guide'
import {
  validateCatalogJsonImport,
  type CatalogJsonImportItem,
} from '../model/catalog-json-import.validation'
import type { CatalogAddKind, CatalogBulkCreateInput } from './CatalogBulkAddModal'

interface Props {
  open: boolean
  kind: CatalogAddKind
  title: string
  onClose: () => void
  onSubmitBulk: (items: CatalogBulkCreateInput[]) => Promise<BulkJobResponse>
  /** Screen JSON uses import-full (modes, fields, processes, events). */
  onSubmitScreenFullSpec?: (items: ScreenImportItem[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function CatalogJsonImportModal({
  open,
  kind,
  title,
  onClose,
  onSubmitBulk,
  onSubmitScreenFullSpec,
  onBatchComplete,
}: Props) {
  if (kind === 'SCREEN' && onSubmitScreenFullSpec) {
    return (
      <ScreenFullSpecFromCatalogModal
        open={open}
        onClose={onClose}
        onSubmit={onSubmitScreenFullSpec}
        onBatchComplete={onBatchComplete}
      />
    )
  }

  return (
    <CatalogShellJsonModal
      open={open}
      kind={kind}
      title={title}
      onClose={onClose}
      onSubmitBulk={onSubmitBulk}
      onBatchComplete={onBatchComplete}
    />
  )
}

function CatalogShellJsonModal({
  open,
  kind,
  title,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: {
  open: boolean
  kind: CatalogAddKind
  title: string
  onClose: () => void
  onSubmitBulk: (items: CatalogBulkCreateInput[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}) {
  const lastItemsRef = useRef<CatalogBulkCreateInput[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'item',
    onBatchComplete,
  })

  const toBulk = (validated: CatalogJsonImportItem[]): CatalogBulkCreateInput[] =>
    validated.map((item) => ({
      code: item.code,
      name: item.name,
      extra: item.extra,
    }))

  const rememberAndWireRetries = (items: CatalogBulkCreateInput[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmitBulk(lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await onSubmitBulk(failedItems as unknown as CatalogBulkCreateInput[])
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<CatalogJsonImportItem>
        open={open}
        onClose={onClose}
        title={`JSON import — ${title}`}
        guide={CATALOG_BULK_IMPORT_GUIDES[kind]}
        description="Validates on the client, then submits one async bulk job. The paste dialog closes as soon as the job is accepted."
        maxItems={BULK_MAX_ITEMS}
        validate={(raw) => validateCatalogJsonImport(kind, raw)}
        onImport={async (validated, { markSubmitted }) => {
          try {
            const items = toBulk(validated)
            rememberAndWireRetries(items)
            const job = await onSubmitBulk(items)
            acceptAndFollow(job, markSubmitted)
          } catch (err) {
            throw new Error(toErrorMessage(err))
          }
        }}
      />
      {resultModal}
    </>
  )
}

function ScreenFullSpecFromCatalogModal({
  open,
  onClose,
  onSubmit,
  onBatchComplete,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (items: ScreenImportItem[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}) {
  const [defaultProjectId, setDefaultProjectId] = useState('')
  const lastItemsRef = useRef<ScreenImportItem[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'screen',
    onBatchComplete,
  })
  const projectHint =
    defaultProjectId.trim() && isUuid(defaultProjectId.trim()) ? defaultProjectId.trim() : null

  const rememberAndWireRetries = (items: ScreenImportItem[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmit(lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await onSubmit(failedItems as unknown as ScreenImportItem[])
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<ScreenImportItem>
        open={open}
        onClose={onClose}
        title="JSON import — Screen full spec"
        size="2xl"
        guide={SCREEN_FULL_SPEC_IMPORT_GUIDE}
        description="Paste screens with nested modes, fields, validations, processes, and events. Client checks the shape, then POST …/screens/import-full."
        maxItems={SCREEN_IMPORT_FULL_MAX_ITEMS}
        extra={
          <div>
            <Input
              size="sm"
              fullWidth
              label="Default project ID"
              helperText="Used when JSON items omit projectId (required by the API)."
              value={defaultProjectId}
              onChange={(e) => setDefaultProjectId(e.target.value)}
              placeholder="uuid"
            />
            {defaultProjectId.trim() && !projectHint ? (
              <Typography variant="caption" tone="error" className="mt-1 block">
                Default project ID must be a UUID.
              </Typography>
            ) : null}
          </div>
        }
        validate={(raw) => validateScreenFullSpecJsonImport(raw, projectHint)}
        onImport={async (items, { markSubmitted }) => {
          try {
            rememberAndWireRetries(items)
            const job = await onSubmit(items)
            acceptAndFollow(job, markSubmitted)
          } catch (err) {
            throw new Error(toErrorMessage(err))
          }
        }}
      />
      {resultModal}
    </>
  )
}

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.problem.detail || err.message
  if (err instanceof Error) return err.message
  return 'Import failed'
}
