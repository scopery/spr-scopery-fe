'use client'

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { BulkImportFormatHelp, Button, Textarea, Typography } from '@/shared/ui'
import { formatJsonImportIssues, type JsonImportIssue } from '@/shared/lib/jsonImportValidation'
import { USE_CASE_NESTED_IMPORT_GUIDE } from '../model/use-case-nested-import.guide'
import type { UseCaseNestedImportPayload } from '../model/use-case-nested-import'
import { validateUseCaseNestedImportText } from '../model/use-case-nested-json-import.validation'

interface Props {
  /** One POST …/nested-import — BE applies all nested parts. */
  onImport: (payload: UseCaseNestedImportPayload) => Promise<{ createdParts: number }>
  onApplied?: () => Promise<void> | void
}

export function UseCaseNestedImportPanel({ onImport, onApplied }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<JsonImportIssue[]>([])
  const [importing, setImporting] = useState(false)
  const [copiedErrors, setCopiedErrors] = useState(false)

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
      setError('Paste nested JSON before importing.')
      toast.error('Paste nested JSON before importing.')
      return
    }

    const validated = validateUseCaseNestedImportText(text)
    if (!validated.ok) {
      setIssues(validated.issues)
      setError('Validation failed — nothing was sent to the server.')
      toast.error('Validation failed — nothing was sent to the server.')
      return
    }

    const payload = validated.items[0]
    if (!payload) {
      setError('No nested payload to apply.')
      toast.error('No nested payload to apply.')
      return
    }

    setImporting(true)
    try {
      const { createdParts } = await onImport(payload)
      await onApplied?.()
      toast.success(`Imported ${createdParts} nested part${createdParts === 1 ? '' : 's'}`)
      setText('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import nested parts'
      setError(message)
      toast.error(message)
    } finally {
      setImporting(false)
    }
  }

  const hasErrorPanel = Boolean(error) || issues.length > 0

  return (
    <div className="space-y-4">
      <div>
        <Typography weight="medium" size="sm">
          Import flows, steps, and related parts
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Sends one request to the backend. Nested flows, steps, conditions, business rules,
          acceptance criteria, and supporting functions are applied server-side.
        </Typography>
      </div>

      <BulkImportFormatHelp guide={USE_CASE_NESTED_IMPORT_GUIDE} />

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Paste nested JSON…"
        disabled={importing}
      />

      {hasErrorPanel ? (
        <div className="space-y-2 rounded border border-error/30 bg-error/5 p-3">
          {error ? (
            <Typography variant="small" tone="error">
              {error}
            </Typography>
          ) : null}
          {issues.length > 0 ? (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-error">
              {formatJsonImportIssues(issues)}
            </pre>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            leftIcon={copiedErrors ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            onClick={() => void copyErrors()}
          >
            {copiedErrors ? 'Copied' : 'Copy errors'}
          </Button>
        </div>
      ) : null}

      <Button
        variant="primary"
        loading={importing}
        disabled={importing || !text.trim()}
        onClick={() => void runImport()}
      >
        Import nested parts
      </Button>
    </div>
  )
}
