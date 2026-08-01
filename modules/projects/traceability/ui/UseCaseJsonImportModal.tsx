'use client'

import { useRef } from 'react'
import { JsonImportModal } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import type { BulkCreateUseCaseItem } from '../model/use-case'
import { USE_CASE_BULK_IMPORT_GUIDE } from '../model/use-case-bulk-import.guide'
import {
  validateUseCaseJsonImport,
  type UseCaseJsonImportItem,
} from '../model/use-case-json-import.validation'

interface Props {
  open: boolean
  projectId: string
  onClose: () => void
  onSubmitBulk: (items: BulkCreateUseCaseItem[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

/** Flatten validated JSON row → one bulk item (shell + nested). BE applies nested. */
function toBulkItems(items: UseCaseJsonImportItem[]): BulkCreateUseCaseItem[] {
  return items.map((item) => {
    const nested = item.nested
    return {
      ...item.shell,
      ...(nested?.flows?.length ? { flows: nested.flows } : {}),
      ...(nested?.conditions?.length ? { conditions: nested.conditions } : {}),
      ...(nested?.businessRules?.length ? { businessRules: nested.businessRules } : {}),
      ...(nested?.acceptanceCriteria?.length
        ? { acceptanceCriteria: nested.acceptanceCriteria }
        : {}),
    }
  })
}

/**
 * JSON import = one POST …/bulk. Nested parts travel in the same items[]; BE creates them.
 */
export function UseCaseJsonImportModal({
  open,
  projectId: _projectId,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
  void _projectId
  const lastItemsRef = useRef<UseCaseJsonImportItem[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'use case',
    onBatchComplete,
  })

  const rememberAndWireRetries = (items: UseCaseJsonImportItem[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await onSubmitBulk(toBulkItems(lastItemsRef.current))
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const shells = failedItems as unknown as BulkCreateUseCaseItem[]
        const rebuilt = shells.map((shell) => {
          const prev = lastItemsRef.current.find((item) => item.shell.key === shell.key)
          return prev ?? { shell, nested: undefined }
        })
        lastItemsRef.current = rebuilt
        const job = await onSubmitBulk(toBulkItems(rebuilt))
        acceptAndFollow(job, () => undefined)
      },
    })
  }

  return (
    <>
      <JsonImportModal<UseCaseJsonImportItem>
        open={open}
        onClose={onClose}
        title="JSON import — Use Cases"
        guide={USE_CASE_BULK_IMPORT_GUIDE}
        description="One async bulk job. Shells and optional nested flows/conditions/rules/criteria are processed by the backend."
        maxItems={BULK_MAX_ITEMS}
        validate={validateUseCaseJsonImport}
        onImport={async (items, { markSubmitted }) => {
          try {
            rememberAndWireRetries(items)
            const job = await onSubmitBulk(toBulkItems(items))
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
