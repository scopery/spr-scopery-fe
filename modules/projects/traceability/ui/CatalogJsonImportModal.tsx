'use client'

import { useRef } from 'react'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
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
  onBatchComplete?: () => Promise<void> | void
}

export function CatalogJsonImportModal({
  open,
  kind,
  title,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
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
            const message =
              err instanceof ApiError
                ? err.problem.detail || err.message
                : err instanceof Error
                  ? err.message
                  : 'Import failed'
            throw new Error(message)
          }
        }}
      />
      {resultModal}
    </>
  )
}
