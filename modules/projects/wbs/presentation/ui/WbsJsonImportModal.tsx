'use client'

import { useMemo, useRef } from 'react'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import type { CreateWbsNodePayload } from '../../domain/model/wbs'
import { buildWbsBulkImportGuide } from '../../domain/model/wbs-bulk-import.guide'
import { validateWbsJsonImport } from '../../domain/model/wbs-json-import.validation'
import { WbsPhaseIdReference } from './WbsPhaseIdReference'

interface PhaseOption {
  value: string
  label: string
}

interface Props {
  open: boolean
  phaseOptions: PhaseOption[]
  onClose: () => void
  onSubmitBulk: (items: CreateWbsNodePayload[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

export function WbsJsonImportModal({
  open,
  phaseOptions,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
  const lastItemsRef = useRef<CreateWbsNodePayload[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'Planning element',
    onBatchComplete,
  })

  const guide = useMemo(
    () => buildWbsBulkImportGuide(phaseOptions),
    [phaseOptions]
  )

  const rememberAndWireRetries = (items: CreateWbsNodePayload[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmitBulk(lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await onSubmitBulk(failedItems as unknown as CreateWbsNodePayload[])
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<CreateWbsNodePayload>
        open={open}
        onClose={onClose}
        title="JSON import — Planning elements"
        guide={guide}
        description="Validates on the client, then submits one async bulk job. Copy a phase id below into phaseId, or use Copy sample (prefilled with the first phase)."
        extra={<WbsPhaseIdReference phases={phaseOptions} />}
        maxItems={BULK_MAX_ITEMS}
        validate={(raw) => validateWbsJsonImport(raw)}
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
