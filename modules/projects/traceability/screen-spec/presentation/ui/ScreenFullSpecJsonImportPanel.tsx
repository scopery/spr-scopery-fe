'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, Input, JsonImportModal, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { isUuid } from '@/shared/lib/jsonImportValidation'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import { SCREEN_IMPORT_FULL_MAX_ITEMS, type ScreenImportItem } from '../../domain/model/screen-spec-import'
import { validateScreenFullSpecJsonImport } from '../../domain/rules/screen-spec-import.validation'
import * as api from '../../infrastructure/api/spec-doc.api'
import { SCREEN_FULL_SPEC_IMPORT_GUIDE } from './screen-full-spec-import.guide'

export function ScreenFullSpecJsonImportPanel({
  workspaceId,
  applicationId,
  onComplete,
}: {
  workspaceId: string
  applicationId: string
  onComplete?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [defaultProjectId, setDefaultProjectId] = useState('')
  const lastItemsRef = useRef<ScreenImportItem[]>([])
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'screen',
    onBatchComplete: onComplete,
  })

  const projectHint = defaultProjectId.trim() && isUuid(defaultProjectId.trim()) ? defaultProjectId.trim() : null

  const submit = async (items: ScreenImportItem[]) => {
    lastItemsRef.current = items
    setRetryHandlers({
      retryAll: async () => {
        if (!lastItemsRef.current.length) return
        const job = await api.importFullScreens(workspaceId, applicationId, lastItemsRef.current)
        acceptAndFollow(job, () => undefined)
      },
      retryFailed: async (failedItems) => {
        const job = await api.importFullScreens(
          workspaceId,
          applicationId,
          failedItems as unknown as ScreenImportItem[]
        )
        acceptAndFollow(job, () => undefined)
      },
    })
    return api.importFullScreens(workspaceId, applicationId, items)
  }

  return (
    <Stack direction="vertical" spacing="sm">
      <Typography variant="small" weight="medium">
        Import full screen spec (JSON)
      </Typography>
      <Typography variant="caption" tone="muted">
        One POST …/screens/import-full (max {SCREEN_IMPORT_FULL_MAX_ITEMS}). Job is accepted as 202;
        this page polls GET /bulk-jobs/{'{id}'} for per-screen success and failure.
      </Typography>
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
        <Typography variant="caption" tone="error">
          Default project ID must be a UUID.
        </Typography>
      ) : null}
      <div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Paste JSON
        </Button>
      </div>
      <JsonImportModal<ScreenImportItem>
        open={open}
        onClose={() => setOpen(false)}
        title="JSON import — Screen full spec"
        guide={SCREEN_FULL_SPEC_IMPORT_GUIDE}
        description="Creates screens with modes, fields, validations, processes, and events in one async job."
        maxItems={SCREEN_IMPORT_FULL_MAX_ITEMS}
        validate={(raw) => validateScreenFullSpecJsonImport(raw, projectHint)}
        onImport={async (items, { markSubmitted }) => {
          try {
            const job = await submit(items)
            acceptAndFollow(job, markSubmitted)
          } catch (err) {
            const message =
              err instanceof ApiError
                ? err.problem.detail || err.message
                : err instanceof Error
                  ? err.message
                  : 'Import failed'
            toast.error(message)
            throw new Error(message)
          }
        }}
      />
      {resultModal}
    </Stack>
  )
}
