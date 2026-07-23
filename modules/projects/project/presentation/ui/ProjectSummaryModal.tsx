'use client'

import { RefreshCw, Save, Sparkles } from 'lucide-react'
import { Button, Modal, Typography } from '@/shared/ui'
import type { AIStructuredPreview } from '@/modules/ai-document-intelligence/document-ai'

interface ProjectSummaryModalProps {
  open: boolean
  onClose: () => void
  preview: AIStructuredPreview | null
  warnings?: string[]
  loading: boolean
  onRegenerate: () => void
  onSave?: () => void
  saving?: boolean
}

export function ProjectSummaryModal({
  open,
  onClose,
  preview,
  warnings,
  loading,
  onRegenerate,
  onSave,
  saving,
}: ProjectSummaryModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={preview?.title ?? 'Project summary'}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
        </div>
      ) : preview ? (
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {warnings?.map((w) => (
            <Typography
              key={w}
              variant="small"
              tone="muted"
              className="border-l-2 border-amber-400 pl-3"
            >
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
                <Typography key={j} as="p" variant="small" className="text-neutral-700">
                  • {b}
                </Typography>
              ))}
            </div>
          ))}
          {preview.assumptions?.length ? (
            <div className="space-y-1 border-t border-neutral-100 pt-4">
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
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          icon={<RefreshCw size={14} />}
          onClick={onRegenerate}
          disabled={loading || saving}
        >
          Regenerate
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Close
          </Button>
          {onSave && (
            <Button
              variant="primary"
              icon={<Save size={14} />}
              onClick={onSave}
              loading={saving}
              disabled={loading || !preview}
            >
              Save as document
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
