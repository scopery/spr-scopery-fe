'use client'

import { useState } from 'react'
import { Modal, Typography, Button, Badge } from '@/shared/ui'
import type { ClarityAssessment as ClarityAssessmentType } from '../model/clarity'
import { Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

function formatScore(score: number): string {
  return Number.isFinite(score) ? score.toFixed(2) : '—'
}

const PRIORITY_TONE: Record<'must' | 'should' | 'could', 'error' | 'warning' | 'info'> = {
  must: 'error',
  should: 'warning',
  could: 'info',
}

interface ClarityDetailsModalProps {
  open: boolean
  onClose: () => void
  assessment: ClarityAssessmentType | null
  questionPrompt?: string
  onReAssess?: () => void
  reAssessLoading?: boolean
}

export function ClarityDetailsModal({
  open,
  onClose,
  assessment,
  questionPrompt,
  onReAssess,
  reAssessLoading = false,
}: ClarityDetailsModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyTemplate = () => {
    if (!assessment?.suggested_answer_template) return
    navigator.clipboard.writeText(assessment.suggested_answer_template).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!assessment) return null

  const a = assessment
  const labelDisplay = a.clarity_label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <Modal open={open} onClose={onClose} title="Clarity assessment" size="md">
      <div className="space-y-4">
        {questionPrompt && (
          <div>
            <Typography variant="small" className="mb-1 text-neutral-500">
              Question
            </Typography>
            <Typography className="text-neutral-900">{questionPrompt}</Typography>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Typography variant="small" className="text-neutral-600">
            Score:
          </Typography>
          <Badge
            variant="soft"
            tone={
              a.clarity_label === 'very_clear'
                ? 'success'
                : a.clarity_label === 'clear'
                  ? 'info'
                  : a.clarity_label === 'partially_clear'
                    ? 'warning'
                    : 'error'
            }
            size="sm"
          >
            {labelDisplay} {formatScore(a.clarity_score)}
          </Badge>
        </div>

        {(a.answer_guidance.length > 0 ||
          a.ambiguity_tags.length > 0 ||
          (a.suggested_answer_template != null && a.suggested_answer_template !== '')) && (
          <div>
            <Typography variant="small" className="mb-2 block text-neutral-600">
              Suggestion
            </Typography>
            <div className="bg-neutral-50/50 space-y-3 border border-neutral-200 p-3">
              {a.answer_guidance.length > 0 && (
                <ul className="list-inside list-disc space-y-1 text-sm text-neutral-700">
                  {a.answer_guidance.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              )}
              {a.ambiguity_tags.length > 0 && (
                <ul className="list-inside list-disc space-y-1 text-sm text-neutral-700">
                  {a.ambiguity_tags.map((tag, i) => (
                    <li key={i}>{tag}</li>
                  ))}
                </ul>
              )}
              {a.suggested_answer_template != null && a.suggested_answer_template !== '' && (
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Typography variant="small" tone="muted">
                      Mẫu gợi ý
                    </Typography>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTemplate}
                      className="min-h-0 gap-1 py-1"
                    >
                      {copied ? (
                        'Đã copy'
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-neutral-200 bg-white p-2 text-sm text-neutral-800">
                    {a.suggested_answer_template}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {a.missing_fields.length > 0 && (
          <div>
            <Typography variant="small" weight="medium" className="mb-2 block text-neutral-600">
              Missing fields
            </Typography>
            <ul className="list-inside list-disc space-y-1 text-sm text-neutral-700">
              {a.missing_fields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {a.follow_up_questions.length > 0 && (
          <div>
            <Typography variant="small" weight="medium" className="mb-2 block text-neutral-600">
              Follow-up questions
            </Typography>
            <ul className="space-y-2">
              {a.follow_up_questions.map((fq, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge
                    variant="soft"
                    tone={PRIORITY_TONE[fq.priority]}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  >
                    {fq.priority}
                  </Badge>
                  <Typography className="text-neutral-800">{fq.prompt}</Typography>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onReAssess && (
          <div className="border-t border-neutral-200 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReAssess}
              loading={reAssessLoading}
              className="gap-2"
            >
              <RefreshCw size={14} />
              Re-assess clarity
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
