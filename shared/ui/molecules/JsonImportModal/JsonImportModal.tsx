'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import {
  formatJsonImportIssues,
  parseJsonImportText,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import { Modal } from '../Modal'
import { Button } from '../../atoms/Button'
import { Textarea } from '../../atoms/Textarea'
import { Typography } from '../../atoms/Typography'
import { BulkImportFormatHelp } from '../BulkImportFormatHelp'

/** Return `'keep-open'` to leave the modal open after import (partial/failed review). */
export type JsonImportResult = void | 'keep-open'

/** Call `markSubmitted` right after POST …/bulk returns 202 so the UI stops blocking. */
export type JsonImportSubmitContext = {
  markSubmitted: () => void
}

export interface JsonImportModalProps<T> {
  open: boolean
  onClose: () => void
  title: string
  guide: BulkImportFormatGuide
  /** Short helper under the title (before the guide). */
  description?: string
  /** Optional content under the description (e.g. id reference lists). */
  extra?: React.ReactNode
  /**
   * Domain validator — runs after JSON parse, before any BE call.
   * Must return typed items or a full issues list.
   */
  validate: (rawItems: Record<string, unknown>[]) => JsonImportValidationResult<T>
  /**
   * Called only with validated items.
   * After `POST …/bulk` accepts the job, call `ctx.markSubmitted()` immediately,
   * then poll — progress UI owns the wait, not the primary button spinner.
   * Return `'keep-open'` for PARTIAL/FAILED so the user can review + retry.
   */
  onImport: (items: T[], ctx: JsonImportSubmitContext) => Promise<JsonImportResult>
  /** Optional max items (defaults to guide.maxItems). */
  maxItems?: number
  size?: 'md' | 'lg' | 'xl' | '2xl'
  /**
   * Live bulk-job progress (e.g. BulkJobProgressPanel). Shown while the job runs
   * and after PARTIAL/FAILED when the modal stays open.
   */
  progress?: React.ReactNode
  /** True while polling the async job (disables re-submit; no button spinner). */
  jobRunning?: boolean
}

/**
 * Dedicated JSON import dialog: guide + textarea + client validation before BE.
 */
export function JsonImportModal<T>({
  open,
  onClose,
  title,
  guide,
  description,
  extra,
  validate,
  onImport,
  maxItems,
  size = 'xl',
  progress,
  jobRunning = false,
}: JsonImportModalProps<T>) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<JsonImportIssue[]>([])
  /** Only true during validation + POST submit — cleared when job is accepted. */
  const [submitting, setSubmitting] = useState(false)
  const [copiedErrors, setCopiedErrors] = useState(false)
  const limit = maxItems ?? guide.maxItems
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setText('')
    setError(null)
    setIssues([])
    setSubmitting(false)
    setCopiedErrors(false)
  }, [open])

  const showValidationFailure = (nextError: string, nextIssues: JsonImportIssue[]) => {
    setIssues(nextIssues)
    setError(nextError)
    setCopiedErrors(false)
    toast.error(nextError)
    window.requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  const copyErrors = useCallback(async () => {
    const body = [
      error?.trim() || null,
      issues.length > 0 ? formatJsonImportIssues(issues) : null,
    ]
      .filter(Boolean)
      .join('\n\n')
    if (!body) return
    try {
      await navigator.clipboard.writeText(body)
      setCopiedErrors(true)
      toast.success('Errors copied')
      window.setTimeout(() => setCopiedErrors(false), 2000)
    } catch {
      toast.error('Could not copy errors')
    }
  }, [error, issues])

  const runImport = async () => {
    setError(null)
    setIssues([])
    setCopiedErrors(false)

    if (!text.trim()) {
      showValidationFailure('Paste a JSON payload before importing.', [
        { path: '', message: 'JSON payload is empty.' },
      ])
      return
    }

    const parsed = parseJsonImportText(text)
    if (!parsed.ok) {
      showValidationFailure('Fix JSON structure before importing.', parsed.issues)
      return
    }
    if (limit != null && parsed.items.length > limit) {
      const over: JsonImportIssue[] = [
        {
          path: 'items',
          message: `Too many items (${parsed.items.length}). Maximum is ${limit} per import.`,
        },
      ]
      showValidationFailure('Validation failed — nothing was sent to the server.', over)
      return
    }

    const validated = validate(parsed.items)
    if (!validated.ok) {
      showValidationFailure('Validation failed — nothing was sent to the server.', validated.issues)
      return
    }

    setSubmitting(true)
    try {
      const result = await onImport(validated.items, {
        markSubmitted: () => setSubmitting(false),
      })
      if (result === 'keep-open') return
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setError(message)
      setIssues([])
      setCopiedErrors(false)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const hasErrorPanel = Boolean(error) || issues.length > 0
  const blocked = submitting || jobRunning

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting
            ? 'Submitting…'
            : jobRunning
              ? 'Running…'
              : 'Import JSON',
          onClick: () => void runImport(),
          variant: 'primary',
          disabled: blocked,
          // Spinner only for the short POST — polling uses BulkJobProgressPanel.
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        {description ? (
          <Typography variant="small" tone="muted">
            {description}
          </Typography>
        ) : (
          <Typography variant="small" tone="muted">
            Paste a JSON payload below. Client validation runs before any API call. Use Copy guide
            for field rules. Spreadsheet rows belong in Bulk add — not here.
          </Typography>
        )}

        {extra}

        {progress}

        {hasErrorPanel ? (
          <div
            ref={errorRef}
            className="border border-red-200 bg-red-50 px-3 py-2"
            role="alert"
          >
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <Typography variant="caption" weight="medium" className="text-red-800">
                {issues.length > 0
                  ? `${issues.length} validation issue${issues.length === 1 ? '' : 's'}`
                  : 'Import error'}
              </Typography>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copyErrors()}
                icon={copiedErrors ? <Check size={14} /> : <Copy size={14} />}
              >
                {copiedErrors ? 'Copied' : 'Copy errors'}
              </Button>
            </div>
            {error ? (
              <Typography variant="small" className="mb-1 whitespace-pre-wrap text-red-700">
                {error}
              </Typography>
            ) : null}
            {issues.length > 0 ? (
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-red-700">
                {formatJsonImportIssues(issues)}
              </pre>
            ) : null}
          </div>
        ) : null}

        <div>
          <Typography variant="small" className="mb-1.5">
            JSON payload
          </Typography>
          <Textarea
            rows={14}
            fullWidth
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
              setIssues([])
              setCopiedErrors(false)
            }}
            placeholder={`{\n  "items": [\n    { ... }\n  ]\n}`}
            disabled={blocked}
            className="font-mono text-xs"
          />
        </div>

        <BulkImportFormatHelp guide={guide} />
      </div>
    </Modal>
  )
}
