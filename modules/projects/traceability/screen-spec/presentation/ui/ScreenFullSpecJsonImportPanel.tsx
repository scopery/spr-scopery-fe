'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, BulkImportFormatHelp, JsonImportModal, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { ProjectSearchSelect } from '@/modules/projects/project'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
import { SCREEN_IMPORT_FULL_MAX_ITEMS, type ScreenImportItem } from '../../domain/model/screen-spec-import'
import { validateScreenFullSpecJsonImport } from '../../domain/rules/screen-spec-import.validation'
import * as api from '../../infrastructure/api/spec-doc.api'
import { SCREEN_FULL_SPEC_IMPORT_GUIDE } from './screen-full-spec-import.guide'
import { SCREEN_IMPORT_WORKFLOW_STEPS, ScreenSpecHowTo } from './ScreenSpecHowTo'

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

  const projectHint = defaultProjectId.trim() || null

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
        Up to {SCREEN_IMPORT_FULL_MAX_ITEMS} screens per job. Catalog Excel above does not import
        fields.
      </Typography>
      <ProjectSearchSelect
        workspaceId={workspaceId}
        value={defaultProjectId}
        onChange={setDefaultProjectId}
        autoSelectSingle
        helperText="Used when JSON items omit projectId."
      />
      <div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Paste JSON
        </Button>
      </div>
      <ScreenSpecHowTo
        title="How to import screens"
        steps={SCREEN_IMPORT_WORKFLOW_STEPS}
        note="Failed items keep the original JSON so you can retry only those screens."
      />
      <BulkImportFormatHelp guide={SCREEN_FULL_SPEC_IMPORT_GUIDE} />
      <JsonImportModal<ScreenImportItem>
        open={open}
        onClose={() => setOpen(false)}
        title="JSON import — Screen full spec"
        guide={SCREEN_FULL_SPEC_IMPORT_GUIDE}
        description="Paste a JSON array of screens (or { items: [...] }). Client checks the shape first, then one async job creates modes, fields, validations, processes, and events."
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
