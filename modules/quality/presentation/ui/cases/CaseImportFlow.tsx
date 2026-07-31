'use client'

import { useMemo, useState } from 'react'
import { Button, Modal, Select, Textarea, Typography } from '@/shared/ui'
import * as qualityApi from '../../../infrastructure/api/quality.api'
import type {
  CaseKind,
  CreateTestCasePayload,
  CreateVerificationCasePayload,
} from '../../../domain/model/quality'

type ImportStage = 'paste' | 'mapping' | 'preview'

const FUNCTIONAL_COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'title', label: 'Title', required: true },
  { key: 'priority', label: 'Priority' },
  { key: 'useCaseId', label: 'Use Case reference', required: true },
  { key: 'type', label: 'Type' },
] as const

const NFR_COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'title', label: 'Title', required: true },
  { key: 'requirementId', label: 'NFR / Requirement reference', required: true },
  { key: 'verificationMethod', label: 'Method', required: true },
  { key: 'environment', label: 'Environment' },
] as const

interface ParsedRow {
  values: Record<string, string>
  errors: string[]
}

function splitRows(text: string): string[][] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t').map((cell) => cell.trim()))
}

export function CaseImportFlow({
  open,
  caseKind,
  projectId,
  onClose,
  onComplete,
}: {
  open: boolean
  caseKind: CaseKind
  projectId: string
  onClose: () => void
  onComplete: () => Promise<void>
}) {
  const columns = caseKind === 'FUNCTIONAL' ? FUNCTIONAL_COLUMNS : NFR_COLUMNS
  const [stage, setStage] = useState<ImportStage>('paste')
  const [raw, setRaw] = useState('')
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [rowErrors, setRowErrors] = useState<ParsedRow[]>([])

  const matrix = useMemo(() => splitRows(raw), [raw])
  const headerCount = matrix[0]?.length ?? 0

  const columnOptions = useMemo(
    () => [
      { value: '-1', label: '— skip —' },
      ...Array.from({ length: headerCount }, (_, index) => ({
        value: String(index),
        label: `Column ${index + 1}${matrix[0]?.[index] ? `: ${matrix[0][index]}` : ''}`,
      })),
    ],
    [headerCount, matrix]
  )

  const reset = () => {
    setStage('paste')
    setRaw('')
    setMapping({})
    setRowErrors([])
    setSaving(false)
  }

  const buildRows = (): ParsedRow[] => {
    const dataRows = matrix.slice(1)
    return dataRows.map((cells) => {
      const values: Record<string, string> = {}
      const errors: string[] = []
      for (const col of columns) {
        const index = mapping[col.key]
        const value = index == null || index < 0 ? '' : (cells[index] ?? '')
        values[col.key] = value
        if ('required' in col && col.required && !value) {
          errors.push(`${col.label} is required`)
        }
      }
      return { values, errors }
    })
  }

  const goMapping = () => {
    if (matrix.length < 2) return
    const next: Record<string, number> = {}
    columns.forEach((col, index) => {
      next[col.key] = index < headerCount ? index : -1
    })
    setMapping(next)
    setStage('mapping')
  }

  const goPreview = () => {
    setRowErrors(buildRows())
    setStage('preview')
  }

  const downloadErrors = () => {
    const lines = rowErrors
      .filter((row) => row.errors.length > 0)
      .map((row) => `${Object.values(row.values).join('\t')}\t${row.errors.join('; ')}`)
    const blob = new Blob([['values\terrors', ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'case-import-errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const submit = async () => {
    const rows = buildRows()
    const valid = rows.filter((row) => row.errors.length === 0)
    if (valid.length === 0) {
      setRowErrors(rows)
      return
    }
    setSaving(true)
    try {
      if (caseKind === 'FUNCTIONAL') {
        const payloads: CreateTestCasePayload[] = valid.map((row) => ({
          title: row.values.title,
          code: row.values.code || null,
          priority: row.values.priority || 'MEDIUM',
          type: row.values.type || 'FUNCTIONAL',
          useCaseId: row.values.useCaseId,
        }))
        await qualityApi.bulkCreateTestCases(projectId, payloads)
      } else {
        const payloads: CreateVerificationCasePayload[] = valid.map((row) => ({
          title: row.values.title,
          code: row.values.code || null,
          requirementId: row.values.requirementId,
          verificationMethod: row.values.verificationMethod || 'MANUAL_REVIEW',
          environment: row.values.environment || null,
        }))
        const batched = await qualityApi.batchCreateVerificationCases(projectId, payloads)
        if (!batched) {
          for (const payload of payloads) {
            await qualityApi.createVerificationCase(projectId, payload)
          }
        }
      }
      await onComplete()
      reset()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={`Import ${caseKind === 'FUNCTIONAL' ? 'Functional' : 'NFR'} cases`}
      size="xl"
      actions={[
        {
          label: 'Cancel',
          variant: 'ghost',
          onClick: () => {
            reset()
            onClose()
          },
        },
        ...(stage === 'paste'
          ? [{ label: 'Next: Map columns', onClick: goMapping, disabled: matrix.length < 2 }]
          : []),
        ...(stage === 'mapping'
          ? [
              { label: 'Back', variant: 'outline' as const, onClick: () => setStage('paste') },
              { label: 'Next: Preview', onClick: goPreview },
            ]
          : []),
        ...(stage === 'preview'
          ? [
              { label: 'Back', variant: 'outline' as const, onClick: () => setStage('mapping') },
              {
                label: saving ? 'Importing…' : 'Import valid rows',
                onClick: () => void submit(),
                disabled: saving,
              },
            ]
          : []),
      ]}
    >
      <div className="space-y-3">
        <Typography variant="caption" tone="muted">
          Stage {stage === 'paste' ? '1' : stage === 'mapping' ? '2' : '3'} of 3 — paste TSV, map
          columns, validate, then batch create.
        </Typography>

        {stage === 'paste' ? (
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={12}
            placeholder={'code\ttitle\tpriority\tuseCaseId\nTC-1\tLogin works\tHIGH\tuc-id'}
          />
        ) : null}

        {stage === 'mapping' ? (
          <div className="grid gap-2">
            {columns.map((col) => (
              <div key={col.key} className="grid grid-cols-[10rem_1fr] items-center gap-2">
                <Typography variant="small">
                  {col.label}
                  {'required' in col && col.required ? ' *' : ''}
                </Typography>
                <Select
                  value={String(mapping[col.key] ?? -1)}
                  options={columnOptions}
                  onValueChange={(value: string) =>
                    setMapping((prev) => ({ ...prev, [col.key]: Number(value) }))
                  }
                />
              </div>
            ))}
          </div>
        ) : null}

        {stage === 'preview' ? (
          <div className="space-y-2">
            <Typography variant="small">
              {rowErrors.filter((r) => r.errors.length === 0).length} valid ·{' '}
              {rowErrors.filter((r) => r.errors.length > 0).length} with errors
            </Typography>
            {rowErrors.some((r) => r.errors.length > 0) ? (
              <Button size="sm" variant="outline" onClick={downloadErrors}>
                Download error rows
              </Button>
            ) : null}
            <ul className="max-h-64 divide-y overflow-auto border border-neutral-200 text-sm">
              {rowErrors.map((row, index) => (
                <li key={index} className="px-3 py-2">
                  <div>{Object.values(row.values).filter(Boolean).join(' · ') || '(empty)'}</div>
                  {row.errors.length > 0 ? (
                    <Typography variant="caption" tone="error">
                      {row.errors.join(' · ')}
                    </Typography>
                  ) : (
                    <Typography variant="caption" tone="muted">
                      Ready
                    </Typography>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
