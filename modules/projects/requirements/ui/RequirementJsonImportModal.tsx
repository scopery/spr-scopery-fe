'use client'

import { useRef } from 'react'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import type { CreateRequirementPayload } from '../model/requirements'
import { REQUIREMENT_BULK_IMPORT_GUIDE } from '../model/requirement-bulk-import.guide'
import { validateRequirementJsonImport } from '../model/requirement-json-import.validation'

interface Props {
  open: boolean
  onClose: () => void
  onSubmitBulk: (items: CreateRequirementPayload[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function RequirementJsonImportModal({
  open,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
  const lastItemsRef = useRef<CreateRequirementPayload[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'requirement',
    onBatchComplete,
  })

  const rememberAndWireRetries = (items: CreateRequirementPayload[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmitBulk(lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await onSubmitBulk(failedItems as unknown as CreateRequirementPayload[])
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<CreateRequirementPayload>
        open={open}
        onClose={onClose}
        title="JSON import — Requirements"
        guide={REQUIREMENT_BULK_IMPORT_GUIDE}
        description="Validates on the client, then submits one async bulk job. The paste dialog closes as soon as the job is accepted."
        maxItems={BULK_MAX_ITEMS}
        validate={validateRequirementJsonImport}
        onImport={async (items, { markSubmitted }) => {
          try {
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
