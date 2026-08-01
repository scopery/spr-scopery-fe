'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Stack, Typography } from '@/shared/ui'
import {
  BulkJobStatus,
  pollBulkJobUntilDone,
  type BulkJobResponse,
} from '@/shared/lib/bulkJobs'
import {
  parseAndValidateExcelList,
  type ExcelImportRunSummary,
  type ExcelListImportSpec,
} from '../lib/excelListImport'

interface SimpleExcelImportPanelProps {
  title?: string
  spec: ExcelListImportSpec
  /** Keys used for in-file uniqueness. Default ['code']. */
  uniqueKeys?: string[]
  disabled?: boolean
  /**
   * One POST …/bulk for the whole file. FE must not loop per-row creates.
   */
  onSubmitBulk: (rows: Record<string, string>[]) => Promise<BulkJobResponse>
  onComplete?: (summary: ExcelImportRunSummary) => void
}

/**
 * Excel list import → validate file → one async bulk job → poll.
 * Never calls create APIs in a per-row loop (rate-limit safe).
 */
export function SimpleExcelImportPanel({
  title = 'Import from Excel',
  spec,
  uniqueKeys,
  disabled,
  onSubmitBulk,
  onComplete,
}: SimpleExcelImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [summary, setSummary] = useState<ExcelImportRunSummary | null>(null)
  const [progress, setProgress] = useState<string | null>(null)

  const handleFile = async (file: File | null) => {
    if (!file) return
    setValidationErrors([])
    setSummary(null)
    setProgress(null)

    const buffer = await file.arrayBuffer()
    const unique =
      uniqueKeys ??
      (spec.columns.some((c) => c.key === 'code')
        ? ['code']
        : spec.columns.filter((c) => c.required).map((c) => c.key))

    const parsed = parseAndValidateExcelList(buffer, spec, { uniqueKeys: unique })
    if (parsed.issues.length > 0) {
      setValidationErrors(
        parsed.issues.map((i) =>
          i.row === 0
            ? i.message
            : `Row ${i.row}${i.column ? ` (${i.column})` : ''}: ${i.message}`
        )
      )
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    if (parsed.rows.length === 0) {
      setValidationErrors(['No data rows to import.'])
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setBusy(true)
    setProgress(`Submitting ${parsed.rows.length} rows as one bulk job…`)
    try {
      const job = await onSubmitBulk(parsed.rows)
      toast.message('Job accepted', { description: 'Processing in the background…' })
      setProgress('Processing bulk job…')
      const done = await pollBulkJobUntilDone(job.id)

      const next: ExcelImportRunSummary = {
        created: done.succeededItems,
        skipped: 0,
        failed: done.failedItems,
        results: (done.failures ?? []).map((f) => ({
          status: 'failed' as const,
          row: f.index + 2,
          reason: f.message || f.errorCode || 'Failed',
        })),
      }
      setSummary(next)
      onComplete?.(next)

      if (done.status === BulkJobStatus.Succeeded) {
        toast.success(
          done.resultSummary ??
            `Created ${done.succeededItems} item${done.succeededItems === 1 ? '' : 's'}`
        )
      } else if (done.status === BulkJobStatus.Partial) {
        toast.warning(
          done.resultSummary ??
            `${done.succeededItems} created, ${done.failedItems} failed`
        )
      } else {
        toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk import failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setValidationErrors([message])
      toast.error(message)
    } finally {
      setProgress(null)
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Stack direction="vertical" spacing="sm">
      <Typography variant="small" weight="medium">
        {title}
      </Typography>
      <Typography variant="caption" tone="muted">
        {spec.instruction}
      </Typography>
      <Typography variant="caption" tone="muted">
        Submits one async bulk job for the whole file (no per-row create loop).
      </Typography>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          disabled={disabled || busy}
          aria-label={title}
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            void handleFile(file)
          }}
        />
      </div>
      {busy ? (
        <Typography variant="small">{progress ?? 'Importing…'}</Typography>
      ) : null}

      {validationErrors.length > 0 ? (
        <Stack direction="vertical" spacing="xs">
          <Typography tone="error" variant="small" weight="medium">
            Validation failed — nothing was imported
          </Typography>
          <ul className="list-disc pl-md">
            {validationErrors.slice(0, 20).map((msg) => (
              <li key={msg}>
                <Typography variant="caption" tone="error">
                  {msg}
                </Typography>
              </li>
            ))}
          </ul>
          {validationErrors.length > 20 ? (
            <Typography variant="caption" tone="muted">
              …and {validationErrors.length - 20} more
            </Typography>
          ) : null}
        </Stack>
      ) : null}

      {summary ? (
        <Typography variant="small" tone="muted">
          Done: {summary.created} created, {summary.failed} failed
        </Typography>
      ) : null}
    </Stack>
  )
}
