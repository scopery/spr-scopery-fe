'use client'

import { useRef } from 'react'
import { useParams } from 'next/navigation'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { CreateTestCasePayload } from '../../domain/model/quality'
import { TEST_CASE_JSON_IMPORT_GUIDE } from '../model/quality-bulk-import.guide'
import {
  validateTestCaseJsonImport,
  type ValidatedTestCaseImportItem,
} from '../model/test-case-json-import.validation'

interface Props {
  open: boolean
  onClose: () => void
  onComplete?: () => Promise<void> | void
}

/** Flatten validated JSON row → one bulk item (shell + steps). BE applies steps. */
function toBulkItems(items: ValidatedTestCaseImportItem[]): CreateTestCasePayload[] {
  return items.map((item) => ({
    ...item.payload,
    ...(item.steps.length > 0 ? { steps: item.steps } : {}),
  }))
}

/**
 * JSON import = one POST …/bulk. Optional steps[] travel in the same items[]; BE creates them.
 */
export function TestCaseJsonImportModal({ open, onClose, onComplete }: Props) {
  const { projectId } = useParams<{ projectId: string }>()
  const lastItemsRef = useRef<ValidatedTestCaseImportItem[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'test case',
    onBatchComplete: onComplete,
  })

  const rememberAndWireRetries = (items: ValidatedTestCaseImportItem[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await qualityApi.submitTestCasesBulk(
          projectId,
          toBulkItems(lastItemsRef.current)
        )
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const rebuilt = failedItems.map((item) => {
          const prev = lastItemsRef.current.find(
            (row) =>
              (row.payload.code && row.payload.code === item.code) ||
              row.payload.title === item.title
          )
          return (
            prev ?? {
              payload: {
                title: String(item.title ?? ''),
                code: (item.code as string | null | undefined) ?? null,
                description: (item.description as string | null | undefined) ?? null,
                type: item.type as string | undefined,
                priority: item.priority as string | undefined,
                automationStatus: item.automationStatus as string | undefined,
                preconditions: (item.preconditions as string | null | undefined) ?? null,
                expectedResult: (item.expectedResult as string | null | undefined) ?? null,
              },
              steps: Array.isArray(item.steps)
                ? (item.steps as ValidatedTestCaseImportItem['steps'])
                : [],
            }
          )
        })
        lastItemsRef.current = rebuilt
        const job = await qualityApi.submitTestCasesBulk(projectId, toBulkItems(rebuilt))
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<ValidatedTestCaseImportItem>
        open={open}
        onClose={onClose}
        title="JSON import — Test Cases"
        guide={TEST_CASE_JSON_IMPORT_GUIDE}
        description="One async bulk job. Shells and optional steps[] are processed by the backend."
        maxItems={BULK_MAX_ITEMS}
        validate={validateTestCaseJsonImport}
        onImport={async (items, { markSubmitted }) => {
          try {
            rememberAndWireRetries(items)
            const job = await qualityApi.submitTestCasesBulk(projectId, toBulkItems(items))
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
