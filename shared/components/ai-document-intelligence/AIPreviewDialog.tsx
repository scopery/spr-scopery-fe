'use client'

import { Modal, Button, Typography } from '@/shared/ui'
import type { AIStructuredPreview } from '@/services/ai-document-intelligence.service'
import { Sparkles } from 'lucide-react'

interface AIPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: AIStructuredPreview | null
  warnings?: string[]
  loading?: boolean
  onSave?: () => void
  saveLabel?: string
}

export function AIPreviewDialog({
  open,
  onOpenChange,
  preview,
  warnings,
  loading,
  onSave,
  saveLabel = 'Save as document',
}: AIPreviewDialogProps) {
  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={preview?.title ?? 'AI Preview'} size="lg">
      {loading && (
        <Typography tone="muted" className="py-8 text-center">
          Generating preview…
        </Typography>
      )}
      {!loading && preview && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {warnings?.map((w) => (
            <Typography key={w} variant="small" tone="muted" className="border-l-2 border-amber-400 pl-3">
              {w}
            </Typography>
          ))}
          {preview.sections.map((section, i) => (
            <div key={i} className="space-y-2">
              {section.heading && (
                <Typography as="h3" weight="semibold">
                  {section.heading}
                </Typography>
              )}
              {section.body && (
                <Typography as="p" className="whitespace-pre-wrap text-neutral-700">
                  {section.body}
                </Typography>
              )}
              {section.bullets?.map((b, j) => (
                <Typography key={j} as="p" variant="small" className="text-neutral-700 whitespace-pre-wrap">
                  • {b}
                </Typography>
              ))}
            </div>
          ))}
          {preview.assumptions?.length ? (
            <div>
              <Typography as="h3" weight="semibold">
                Assumptions / Missing information
              </Typography>
              {preview.assumptions.map((a) => (
                <Typography key={a} variant="small" className="text-neutral-600">
                  • {a}
                </Typography>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        {onSave && (
          <Button variant="primary" loading={loading} onClick={onSave} icon={<Sparkles size={16} />}>
            {saveLabel}
          </Button>
        )}
      </div>
    </Modal>
  )
}
