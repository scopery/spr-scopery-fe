'use client'

import { useRef } from 'react'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import type { CreateTaskPayload } from '../../domain/model/task'
import { TASK_BULK_IMPORT_GUIDE } from '../../domain/model/task-json-import.guide'
import { validateTaskJsonImport } from '../../domain/model/task-json-import.validation'

interface Props {
  open: boolean
  onClose: () => void
  onSubmitBulk: (items: CreateTaskPayload[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function TaskJsonImportModal({ open, onClose, onSubmitBulk, onBatchComplete }: Props) {
  const lastItemsRef = useRef<CreateTaskPayload[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'task',
    onBatchComplete,
  })

  const rememberAndWireRetries = (items: CreateTaskPayload[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmitBulk(lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await onSubmitBulk(failedItems as unknown as CreateTaskPayload[])
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<CreateTaskPayload>
        open={open}
        onClose={onClose}
        title="JSON import — Work Items (Tasks)"
        guide={TASK_BULK_IMPORT_GUIDE}
        description="Validates on the client, then submits one async bulk job. The paste dialog closes as soon as the job is accepted."
        maxItems={BULK_MAX_ITEMS}
        validate={(raw) => validateTaskJsonImport(raw)}
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
