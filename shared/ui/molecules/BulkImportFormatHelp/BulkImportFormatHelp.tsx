'use client'

import React, { useCallback, useEffect, useId, useState } from 'react'
import { Check, CircleHelp, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'
import {
  formatBulkImportGuideForAgent,
  formatBulkImportSampleJson,
  type BulkImportFieldGuide,
} from '@/shared/lib/bulkImportFormat'
import { Button } from '../../atoms/Button'
import { Typography } from '../../atoms/Typography'
import type { BulkImportFormatHelpProps } from './BulkImportFormatHelp.types'

function FieldTable({ fields }: { fields: readonly BulkImportFieldGuide[] }) {
  if (fields.length === 0) return null
  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-2 py-1.5 font-medium">Attribute</th>
            <th className="px-2 py-1.5 font-medium">Required</th>
            <th className="px-2 py-1.5 font-medium">Type</th>
            <th className="px-2 py-1.5 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name} className="border-b border-neutral-100 align-top">
              <td className="px-2 py-1.5 font-mono text-neutral-900">{field.name}</td>
              <td className="px-2 py-1.5">
                {field.required ? (
                  <span className="font-medium text-error">Required</span>
                ) : (
                  <span className="text-neutral-500">Optional</span>
                )}
              </td>
              <td className="px-2 py-1.5 text-neutral-700">{field.type}</td>
              <td className="px-2 py-1.5 text-neutral-700">
                <div>{field.description}</div>
                {field.enumValues?.length ? (
                  <div className="mt-1 font-mono text-[11px] text-neutral-500">
                    Enum: {field.enumValues.join(' | ')}
                    {field.enumNotes ? ` — ${field.enumNotes}` : ''}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Collapsed JSON import format guide. Trigger is a Lucide help icon — click to expand.
 * Pass a domain-specific `guide` from the calling module (design-system stays domain-free).
 */
export const BulkImportFormatHelp = React.forwardRef<HTMLDivElement, BulkImportFormatHelpProps>(
  ({ guide, className, defaultOpen = false, label }, ref) => {
    const [open, setOpen] = useState(defaultOpen)
    const [copied, setCopied] = useState(false)
    const panelId = useId()
    const sampleJson = formatBulkImportSampleJson(guide)
    const guideText = formatBulkImportGuideForAgent(guide)

    useEffect(() => {
      setOpen(defaultOpen)
    }, [defaultOpen, guide.entityLabel])

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(guideText)
        setCopied(true)
        toast.success('Import guide copied')
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Could not copy to clipboard')
      }
    }, [guideText])

    return (
      <div ref={ref} className={cn(className)}>
        <div className="flex items-center gap-1">
          {label}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label="JSON format guide"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'inline-flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 transition-colors',
              'hover:text-neutral-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              open && 'text-neutral-700'
            )}
          >
            <CircleHelp size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {open ? (
          <div
            id={panelId}
            className="mt-2 max-h-[min(60vh,36rem)] space-y-3 overflow-y-auto border border-neutral-200 bg-neutral-50 px-3 py-2"
            role="region"
            aria-label={`${guide.entityLabel} JSON import format guide`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <Typography variant="small" weight="medium">
                  {guide.entityLabel} — JSON bulk payload
                </Typography>
                <Typography variant="caption" tone="muted">
                  Copy the full guide (field rules, enums, required notes, and sample JSON). Give it
                  to a third-party agent to fill with your data, then paste the JSON back into this
                  JSON Import dialog.
                </Typography>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleCopy()}
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
              >
                {copied ? 'Copied' : 'Copy guide'}
              </Button>
            </div>

            {guide.notes?.length ? (
              <ul className="list-disc space-y-1 pl-4">
                {guide.notes.map((note) => (
                  <li key={note}>
                    <Typography variant="caption" tone="muted">
                      {note}
                    </Typography>
                  </li>
                ))}
              </ul>
            ) : null}

            {guide.maxItems != null ? (
              <Typography variant="caption" tone="muted">
                Maximum {guide.maxItems} items per request.
              </Typography>
            ) : null}

            {guide.fields.length > 0 ? (
              <div className="space-y-1">
                <Typography variant="small" weight="medium">
                  Item attributes
                </Typography>
                <FieldTable fields={guide.fields} />
              </div>
            ) : null}

            {guide.entities?.map((entity) => (
              <div key={entity.path} className="space-y-1">
                <Typography variant="small" weight="medium">
                  {entity.name}{' '}
                  <span className="font-mono font-normal text-neutral-500">({entity.path})</span>
                  {entity.required ? (
                    <span className="ml-2 font-normal text-error">Required</span>
                  ) : (
                    <span className="ml-2 font-normal text-neutral-500">Optional</span>
                  )}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {entity.description}
                </Typography>
                <FieldTable fields={entity.fields} />
              </div>
            ))}

            <pre className="max-h-56 overflow-auto border border-neutral-200 bg-white p-2 font-mono text-[11px] leading-relaxed text-neutral-800">
              {sampleJson}
            </pre>
          </div>
        ) : null}
      </div>
    )
  }
)

BulkImportFormatHelp.displayName = 'BulkImportFormatHelp'
