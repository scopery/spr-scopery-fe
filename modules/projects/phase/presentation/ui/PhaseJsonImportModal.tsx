'use client'

import { useRef } from 'react'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import type { CreateProjectPhasePayload } from '../../domain/model/phase'
import { PHASE_BULK_IMPORT_GUIDE } from '../../domain/model/phase-bulk-import.guide'
import { validatePhaseJsonImport } from '../../domain/model/phase-json-import.validation'

interface Props {
  open: boolean
  nextDisplayOrder: number
  onClose: () => void
  onSubmitBulk: (items: CreateProjectPhasePayload[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function PhaseJsonImportModal({
  open,
  nextDisplayOrder,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
  const lastItemsRef = useRef<CreateProjectPhasePayload[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'phase',
    onBatchComplete,
  })

  const rememberAndWireRetries = (items: CreateProjectPhasePayload[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmitBulk(lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await onSubmitBulk(failedItems as unknown as CreateProjectPhasePayload[])
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<CreateProjectPhasePayload>
        open={open}
        onClose={onClose}
        title="JSON import — Project Phases"
        guide={PHASE_BULK_IMPORT_GUIDE}
        description="Validates on the client, then submits one async bulk job. The paste dialog closes as soon as the job is accepted."
        maxItems={BULK_MAX_ITEMS}
        validate={(raw) => validatePhaseJsonImport(raw, nextDisplayOrder)}
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
