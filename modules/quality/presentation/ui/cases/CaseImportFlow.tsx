'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  BulkImportFormatHelp,
  Modal,
  Textarea,
  Typography,
} from '@/shared/ui'
import { stringField, tryParseBulkImportJson } from '@/shared/lib/bulkImportFormat'
import {
  BULK_MAX_ITEMS,
  BulkJobStatus,
} from '@/shared/lib/bulkJobs'
import { useBulkJobPoller } from '@/shared/lib/useBulkJobPoller'
import * as qualityApi from '../../../infrastructure/api/quality.api'
import type {
  CaseKind,
  CreateTestCasePayload,
  CreateVerificationCasePayload,
} from '../../../domain/model/quality'
import { TEST_CASE_BULK_IMPORT_GUIDE } from '../../model/quality-bulk-import.guide'
import {
  validateTestCaseJsonImport,
  type ValidatedTestCaseImportItem,
} from '../../model/test-case-json-import.validation'

/** Fixed TSV column order for NFR — no column-mapping UI. */
const NFR_TSV_KEYS = [
  'code',
  'title',
  'requirementId',
  'verificationMethod',
  'environment',
] as const

function splitRows(text: string): string[][] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t').map((cell) => cell.trim()))
}

function toFunctionalBulkItems(items: ValidatedTestCaseImportItem[]): CreateTestCasePayload[] {
  return items.map((item) => ({
    ...item.payload,
    ...(item.steps.length > 0 ? { steps: item.steps } : {}),
  }))
}

function parseNfrPayloads(text: string): {
  payloads: CreateVerificationCasePayload[]
  error: string | null
} {
  const jsonItems = tryParseBulkImportJson(text)
  if (jsonItems?.length) {
    const payloads: CreateVerificationCasePayload[] = []
    for (let i = 0; i < jsonItems.length; i++) {
      const item = jsonItems[i]
      const title = stringField(item, 'title')
      const requirementId = stringField(item, 'requirementId')
      const verificationMethod = stringField(item, 'verificationMethod')
      if (!title || !requirementId || !verificationMethod) {
        return {
          payloads: [],
          error: `items[${i}]: title, requirementId, and verificationMethod are required`,
        }
      }
      payloads.push({
        title,
        code: stringField(item, 'code') || null,
        requirementId,
        verificationMethod,
        environment: stringField(item, 'environment') || null,
      })
    }
    return { payloads, error: null }
  }

  const rows = splitRows(text)
  if (rows.length < 2) {
    return { payloads: [], error: 'Paste a header row plus at least one data row (TSV).' }
  }

  const header = rows[0].map((cell) => cell.toLowerCase())
  const hasNamedHeader = NFR_TSV_KEYS.some((key) =>
    header.some((cell) => cell.includes(key.toLowerCase()))
  )

  const indexOf = (key: string, fallback: number) => {
    if (!hasNamedHeader) return fallback
    const idx = header.findIndex((cell) => cell.includes(key.toLowerCase()))
    return idx >= 0 ? idx : fallback
  }

  const payloads: CreateVerificationCasePayload[] = []
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]
    const title = cells[indexOf('title', 1)] ?? ''
    const requirementId = cells[indexOf('requirementid', 2)] ?? ''
    const verificationMethod = cells[indexOf('verificationmethod', 3)] ?? ''
    if (!title || !requirementId || !verificationMethod) {
      return {
        payloads: [],
        error: `Row ${i + 1}: title, requirementId, and verificationMethod are required`,
      }
    }
    payloads.push({
      title,
      code: cells[indexOf('code', 0)] || null,
      requirementId,
      verificationMethod,
      environment: cells[indexOf('environment', 4)] || null,
    })
  }
  return { payloads, error: null }
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
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const poller = useBulkJobPoller()

  const canImport = useMemo(() => {
    if (tryParseBulkImportJson(raw)?.length) return true
    return splitRows(raw).length >= 2
  }, [raw])

  const reset = () => {
    setRaw('')
    setSaving(false)
    setImportError(null)
    poller.reset()
  }

  const submitFunctionalJson = async (jsonItems: Record<string, unknown>[]) => {
    const validated = validateTestCaseJsonImport(jsonItems)
    if (!validated.ok) {
      setImportError(
        validated.issues
          .slice(0, 5)
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join(' · ')
      )
      return
    }
    if (validated.items.length > BULK_MAX_ITEMS) {
      setImportError(`Maximum ${BULK_MAX_ITEMS} items per bulk request.`)
      return
    }
    setImportError(null)
    setSaving(true)
    poller.reset()
    try {
      const job = await qualityApi.submitTestCasesBulk(
        projectId,
        toFunctionalBulkItems(validated.items)
      )
      setSaving(false)
      toast.message('Job accepted', { description: 'Processing in the background…' })
      reset()
      onClose()
      const done = await poller.start(job.id, job)
      if (done.succeededItems > 0) await onComplete()
      if (done.status === BulkJobStatus.Succeeded) {
        toast.success(
          done.resultSummary ??
            `Created ${done.succeededItems} test case${done.succeededItems === 1 ? '' : 's'}`
        )
      } else if (done.status === BulkJobStatus.Partial) {
        toast.warning(
          done.resultSummary ??
            `${done.succeededItems} created, ${done.failedItems} failed. Successful items are already saved.`
        )
      } else {
        toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk import failed')
      }
    } catch (err) {
      setSaving(false)
      setImportError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const submit = async () => {
    if (caseKind === 'FUNCTIONAL') {
      const jsonItems = tryParseBulkImportJson(raw)
      if (!jsonItems?.length) {
        setImportError('Paste JSON { "items": [...] } including optional steps[].')
        return
      }
      await submitFunctionalJson(jsonItems)
      return
    }

    const { payloads, error } = parseNfrPayloads(raw)
    if (error) {
      setImportError(error)
      return
    }
    if (payloads.length === 0) {
      setImportError('No valid rows to import.')
      return
    }

    setImportError(null)
    setSaving(true)
    try {
      const created = await qualityApi.batchCreateVerificationCases(projectId, payloads)
      setSaving(false)
      toast.success(`Created ${created?.length ?? payloads.length} verification cases`)
      reset()
      onClose()
      await onComplete()
    } catch (err) {
      setSaving(false)
      setImportError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const busy = saving || poller.isPolling

  return (
    <Modal
      open={open}
      onClose={() => {
        if (busy) return
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
          disabled: busy,
        },
        {
          label: saving ? 'Submitting…' : 'Import',
          onClick: () => void submit(),
          disabled: !canImport || busy,
          loading: saving,
        },
      ]}
    >
      <div className="space-y-3">
        <Typography variant="caption" tone="muted">
          {caseKind === 'FUNCTIONAL'
            ? 'Paste full JSON — shells + optional steps[] go in one bulk request. No column mapping.'
            : 'Paste JSON items or TSV with fixed columns (code, title, requirementId, verificationMethod, environment). No column mapping.'}
        </Typography>

        {caseKind === 'FUNCTIONAL' ? (
          <BulkImportFormatHelp guide={TEST_CASE_BULK_IMPORT_GUIDE} />
        ) : null}

        <Textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            setImportError(null)
          }}
          rows={14}
          disabled={busy}
          placeholder={
            caseKind === 'FUNCTIONAL'
              ? '{\n  "items": [\n    {\n      "title": "Login works",\n      "code": "TC-1",\n      "priority": "HIGH",\n      "steps": [{ "action": "Open login", "expectedResult": "Form visible" }]\n    }\n  ]\n}'
              : 'code\ttitle\trequirementId\tverificationMethod\tenvironment\nVC-1\tp95 latency\t<requirement-uuid>\tMANUAL_REVIEW\tstaging'
          }
        />

        {importError ? (
          <Typography variant="small" tone="error">
            {importError}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
