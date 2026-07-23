'use client'

import { useRef, useState } from 'react'
import { Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
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
   * Called only after full-file validation passes.
   * Throw / reject to mark the row as failed; throw ApiError 409 to skip.
   */
  onImportRow: (row: Record<string, string>, rowNumber: number) => Promise<void>
  onComplete?: (summary: ExcelImportRunSummary) => void
}

export function SimpleExcelImportPanel({
  title = 'Import from Excel',
  spec,
  uniqueKeys,
  disabled,
  onImportRow,
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

    setBusy(true)
    const results: ExcelImportRunSummary['results'] = []
    let created = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i]
      const rowNumber = i + 2
      setProgress(`Importing ${i + 1}/${parsed.rows.length}…`)
      try {
        await onImportRow(row, rowNumber)
        created += 1
        results.push({ status: 'created', row: rowNumber })
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 409) {
          skipped += 1
          results.push({
            status: 'skipped',
            row: rowNumber,
            reason: 'Already exists (409)',
          })
        } else {
          failed += 1
          results.push({
            status: 'failed',
            row: rowNumber,
            reason: err instanceof Error ? err.message : 'Import failed',
          })
        }
      }
    }

    const next: ExcelImportRunSummary = { created, skipped, failed, results }
    setSummary(next)
    setProgress(null)
    setBusy(false)
    onComplete?.(next)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Stack direction="vertical" spacing="sm">
      <Typography variant="small" weight="medium">
        {title}
      </Typography>
      <Typography variant="caption" tone="muted">
        {spec.instruction}
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
          Done: {summary.created} created, {summary.skipped} skipped, {summary.failed} failed
        </Typography>
      ) : null}
    </Stack>
  )
}
