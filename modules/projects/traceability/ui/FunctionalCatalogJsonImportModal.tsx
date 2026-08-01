'use client'

import { useRef } from 'react'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import {
  FUNCTIONAL_ITEM_BULK_IMPORT_GUIDE,
  NON_FUNCTIONAL_ITEM_BULK_IMPORT_GUIDE,
} from '../model/functional-catalog-bulk-import.guide'
import {
  validateFunctionalCatalogJsonImport,
  type FunctionalCatalogJsonImportItem,
} from '../model/functional-catalog-json-import.validation'
import type {
  FunctionalCatalogAddKind,
  FunctionalCatalogBulkCreateInput,
} from './FunctionalCatalogBulkAddModal'

interface Props {
  open: boolean
  kind: FunctionalCatalogAddKind
  onClose: () => void
  onSubmitBulk: (items: FunctionalCatalogBulkCreateInput[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function FunctionalCatalogJsonImportModal({
  open,
  kind,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
  const lastItemsRef = useRef<FunctionalCatalogBulkCreateInput[]>([])
  const guide =
    kind === 'FR' ? FUNCTIONAL_ITEM_BULK_IMPORT_GUIDE : NON_FUNCTIONAL_ITEM_BULK_IMPORT_GUIDE
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'item',
    onBatchComplete,
  })

  const toBulk = (
    validated: FunctionalCatalogJsonImportItem[]
  ): FunctionalCatalogBulkCreateInput[] =>
    validated.map((item) => ({
      kind: item.kind,
      code: item.code,
      title: item.title,
      priority: item.priority,
      type: item.type,
      category: item.category,
      scopeType: item.scopeType,
      description: item.description,
      acceptanceCriteria: item.acceptanceCriteria,
      businessRules: item.businessRules,
      targetMetric: item.targetMetric,
    }))

  const rememberAndWireRetries = (items: FunctionalCatalogBulkCreateInput[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmitBulk(lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await onSubmitBulk(
          failedItems as unknown as FunctionalCatalogBulkCreateInput[]
        )
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<FunctionalCatalogJsonImportItem>
        open={open}
        onClose={onClose}
        title={`JSON import — ${kind === 'FR' ? 'Functional Items' : 'Non-Functional Items'}`}
        guide={guide}
        description="Validates on the client, then submits one async bulk job. The paste dialog closes as soon as the job is accepted."
        maxItems={BULK_MAX_ITEMS}
        validate={(raw) => validateFunctionalCatalogJsonImport(kind, raw)}
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
