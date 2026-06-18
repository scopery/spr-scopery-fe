'use client'

import { useState } from 'react'
import { Modal, Typography, Button, Badge } from '@/shared/ui'
import type { ClarityAssessment as ClarityAssessmentType } from '@/types/aiClarity'
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
            <Typography variant="small" className="text-neutral-500 mb-1">
              Question
            </Typography>
            <Typography className="text-neutral-900">{questionPrompt}</Typography>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Typography variant="small" className="text-neutral-600">
            Score:
          </Typography>
          <Badge variant="soft" tone={a.clarity_label === 'very_clear' ? 'success' : a.clarity_label === 'clear' ? 'info' : a.clarity_label === 'partially_clear' ? 'warning' : 'error'} size="sm">
            {labelDisplay} {formatScore(a.clarity_score)}
          </Badge>
        </div>

        {(a.answer_guidance.length > 0 || a.ambiguity_tags.length > 0 || (a.suggested_answer_template != null && a.suggested_answer_template !== '')) && (
          <div>
            <Typography variant="small" className="text-neutral-600 mb-2 block">
              Suggestion
            </Typography>
            <div className="space-y-3 border border-neutral-200 bg-neutral-50/50 p-3">
              {a.answer_guidance.length > 0 && (
                <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                  {a.answer_guidance.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              )}
              {a.ambiguity_tags.length > 0 && (
                <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                  {a.ambiguity_tags.map((tag, i) => (
                    <li key={i}>{tag}</li>
                  ))}
                </ul>
              )}
              {a.suggested_answer_template != null && a.suggested_answer_template !== '' && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Typography variant="small" tone="muted">
                      Mẫu gợi ý
                    </Typography>
                    <Button variant="ghost" size="sm" onClick={handleCopyTemplate} className="gap-1 min-h-0 py-1">
                      {copied ? 'Đã copy' : <><Copy size={14} /> Copy</>}
                    </Button>
                  </div>
                  <pre className="p-2 bg-white border border-neutral-200 rounded text-sm text-neutral-800 overflow-x-auto whitespace-pre-wrap">
                    {a.suggested_answer_template}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {a.missing_fields.length > 0 && (
          <div>
            <Typography variant="small" weight="medium" className="text-neutral-600 mb-2 block">
              Missing fields
            </Typography>
            <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
              {a.missing_fields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {a.follow_up_questions.length > 0 && (
          <div>
            <Typography variant="small" weight="medium" className="text-neutral-600 mb-2 block">
              Follow-up questions
            </Typography>
            <ul className="space-y-2">
              {a.follow_up_questions.map((fq, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="soft" tone={PRIORITY_TONE[fq.priority]} size="sm" className="shrink-0 mt-0.5">
                    {fq.priority}
                  </Badge>
                  <Typography className="text-neutral-800">{fq.prompt}</Typography>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onReAssess && (
          <div className="pt-2 border-t border-neutral-200">
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
