'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Checkbox,
  Modal,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ApiError } from '@/shared/lib/api-types'
import * as functionalCatalogApi from '../api/functional-catalog.api'
import type {
  FunctionalItemConflictResolution,
  FunctionalItemImportPreviewResponse,
} from '../model/functional-item-import'
import {
  buildFunctionalItemImportExecutePayload,
  formatFunctionalImportChangeValue,
  parseFunctionalItemImportPaste,
} from '../lib/functional-item-import.rules'
import { cn } from '@/utils/cn'

function functionalImportErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.problem.code) {
      case 'FUNCTIONAL_IMPORT_INVALID_ITEM':
        return err.problem.detail || 'One or more items are invalid (title, priority, or type)'
      case 'FUNCTIONAL_IMPORT_ITEM_NOT_FOUND':
        return 'A matched functional item is no longer in this project'
      default:
        return err.problem.detail || err.message
    }
  }
  return getProblemToastMessage(err)
}

type Step = 'paste' | 'review'

interface ImportFunctionalItemsModalProps {
  open: boolean
  projectId: string
  workspaceId: string
  onClose: () => void
  onImported?: () => void
}

export function ImportFunctionalItemsModal({
  open,
  projectId,
  workspaceId,
  onClose,
  onImported,
}: ImportFunctionalItemsModalProps) {
  const [step, setStep] = useState<Step>('paste')
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState<FunctionalItemImportPreviewResponse | null>(null)
  const [resolutions, setResolutions] = useState<FunctionalItemConflictResolution[]>([])
  const [archiveUnmatched, setArchiveUnmatched] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep('paste')
    setRaw('')
    setPreview(null)
    setResolutions([])
    setArchiveUnmatched(false)
    setParseError(null)
  }, [open])

  const allConflictsResolved = useMemo(() => {
    if (!preview) return false
    if (preview.conflicts.length === 0) return true
    return (
      resolutions.length === preview.conflicts.length &&
      resolutions.every((r) => {
        if (r.kind === 'create' || r.kind === 'skip') return true
        return Boolean(r.existingItemId)
      })
    )
  }, [preview, resolutions])

  const handlePreview = async () => {
    setParseError(null)
    let items
    try {
      items = parseFunctionalItemImportPaste(raw, { workspaceId })
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid input')
      return
    }
    if (items.length === 0) {
      setParseError('Paste at least one item')
      return
    }

    setLoadingPreview(true)
    try {
      const res = await functionalCatalogApi.previewFunctionalItemsImport(projectId, {
        items,
      })
      setPreview(res)
      setResolutions(
        res.conflicts.map((c) =>
          c.candidates[0]
            ? { kind: 'match' as const, existingItemId: c.candidates[0].existingId }
            : { kind: 'create' as const }
        )
      )
      setStep('review')
    } catch (err) {
      toast.error(functionalImportErrorMessage(err))
    } finally {
      setLoadingPreview(false)
    }
  }

  const setConflictResolution = (index: number, value: string) => {
    setResolutions((prev) => {
      const next = [...prev]
      if (value === '__create__') next[index] = { kind: 'create' }
      else if (value === '__skip__') next[index] = { kind: 'skip' }
      else next[index] = { kind: 'match', existingItemId: value }
      return next
    })
  }

  const handleExecute = async () => {
    if (!preview || !allConflictsResolved) return
    setExecuting(true)
    try {
      const body = buildFunctionalItemImportExecutePayload(
        preview,
        resolutions,
        archiveUnmatched
      )
      const result = await functionalCatalogApi.executeFunctionalItemsImport(
        projectId,
        body
      )
      toast.success(
        `Imported: ${result.created} created, ${result.updated} updated, ${result.archived} archived`
      )
      onImported?.()
      onClose()
    } catch (err) {
      toast.error(functionalImportErrorMessage(err))
    } finally {
      setExecuting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 'paste' ? 'Import functional items' : 'Review import'}
      size="xl"
      actions={
        step === 'paste'
          ? [
              { label: 'Cancel', onClick: onClose, variant: 'ghost' },
              {
                label: 'Preview',
                onClick: () => void handlePreview(),
                variant: 'primary',
                loading: loadingPreview,
              },
            ]
          : [
              {
                label: 'Back',
                onClick: () => setStep('paste'),
                variant: 'ghost',
                disabled: executing,
              },
              {
                label: 'Confirm import',
                onClick: () => void handleExecute(),
                variant: 'primary',
                loading: executing,
                disabled: !allConflictsResolved,
              },
            ]
      }
    >
      {step === 'paste' ? (
        <div className="space-y-3">
          <Typography variant="small" tone="muted">
            Paste a JSON array of items, or one title per line. Optional format:{' '}
            <code className="text-xs">CODE | Title</code>. Matching uses exact code when
            present, otherwise fuzzy title match.
          </Typography>
          <Textarea
            fullWidth
            rows={14}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`[\n  {\n    "code": "FR-001",\n    "title": "User login",\n    "priority": "MEDIUM",\n    "type": "FUNCTIONAL",\n    "description": "Authenticate users",\n    "acceptanceCriteria": ["Valid credentials succeed"]\n  }\n]\n\n— or —\n\nFR-001 | User login\nPassword reset`}
          />
          {parseError ? (
            <Typography variant="small" tone="error">
              {parseError}
            </Typography>
          ) : null}
        </div>
      ) : preview ? (
        <div className="max-h-[min(70vh,36rem)] space-y-5 overflow-y-auto pr-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
            <Checkbox
              size="sm"
              checked={archiveUnmatched}
              onChange={(e) => setArchiveUnmatched(e.target.checked)}
            />
            <span>
              Archive functional items in this project that are not in the import list
            </span>
          </label>

          <section className="space-y-2">
            <Stack direction="horizontal" spacing="sm" className="items-center">
              <Typography weight="semibold">To create</Typography>
              <Badge tone="neutral">{preview.toCreate.length}</Badge>
            </Stack>
            {preview.toCreate.length === 0 ? (
              <Typography variant="small" tone="muted">
                None
              </Typography>
            ) : (
              <ul className="divide-y divide-neutral-100 border border-neutral-200">
                {preview.toCreate.map((item, i) => (
                  <li key={`create-${i}`} className="px-3 py-2 text-sm">
                    <span className="font-medium text-neutral-900">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {[item.code, item.type, item.priority].filter(Boolean).join(' · ') ||
                        'FUNCTIONAL'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <Stack direction="horizontal" spacing="sm" className="items-center">
              <Typography weight="semibold">To update</Typography>
              <Badge tone="info">{preview.toUpdate.length}</Badge>
            </Stack>
            {preview.toUpdate.length === 0 ? (
              <Typography variant="small" tone="muted">
                None
              </Typography>
            ) : (
              <ul className="space-y-2">
                {preview.toUpdate.map((diff) => (
                  <li
                    key={diff.existingId}
                    className="border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-sm"
                  >
                    <Typography size="sm" weight="medium">
                      {diff.existingCode ? `${diff.existingCode} · ` : ''}
                      {diff.existingTitle}
                    </Typography>
                    <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                      {Object.entries(diff.changes ?? {}).map(([field, pair]) => {
                        const arr = Array.isArray(pair) ? pair : []
                        return (
                          <li key={field}>
                            <span className="font-medium text-neutral-800">{field}</span>:{' '}
                            <span className="line-through opacity-70">
                              {formatFunctionalImportChangeValue(arr[0])}
                            </span>{' '}
                            → <span>{formatFunctionalImportChangeValue(arr[1])}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <Stack direction="horizontal" spacing="sm" className="items-center">
              <Typography weight="semibold">Conflicts</Typography>
              <Badge tone={preview.conflicts.length ? 'warning' : 'neutral'}>
                {preview.conflicts.length}
              </Badge>
            </Stack>
            {preview.conflicts.length === 0 ? (
              <Typography variant="small" tone="muted">
                None
              </Typography>
            ) : (
              <ul className="space-y-3">
                {preview.conflicts.map((conflict, index) => {
                  const resolution = resolutions[index]
                  const selectValue =
                    resolution?.kind === 'match'
                      ? resolution.existingItemId
                      : resolution?.kind === 'skip'
                        ? '__skip__'
                        : '__create__'
                  return (
                    <li
                      key={`conflict-${index}`}
                      className={cn('border border-orange-200/80 bg-orange-50/40 px-3 py-3')}
                    >
                      <Typography size="sm" weight="medium">
                        {conflict.incoming.title}
                      </Typography>
                      <Typography variant="small" tone="muted" className="mt-0.5">
                        Choose an existing match or create as new
                      </Typography>
                      <div className="mt-2">
                        <Select
                          value={selectValue}
                          onValueChange={(v: string) => setConflictResolution(index, v)}
                          options={[
                            { value: '__create__', label: 'Create as new item' },
                            { value: '__skip__', label: 'Skip (ignore this item)' },
                            ...conflict.candidates.map((c) => ({
                              value: c.existingId,
                              label: `${c.existingCode ?? '—'} · ${c.existingTitle} (${Math.round(c.similarity * 100)}%)`,
                            })),
                          ]}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {!allConflictsResolved ? (
              <Typography variant="small" tone="error">
                Resolve all conflicts before confirming.
              </Typography>
            ) : null}
          </section>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setStep('paste')} disabled={executing}>
              Edit paste
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
