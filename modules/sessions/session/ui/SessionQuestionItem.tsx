'use client'

import { useRef } from 'react'
import { Typography, Button, Badge, Input, Textarea, Switch, Select, Divider } from '@/shared/ui'
import { FEATURES } from '@/config/features'
import { cn } from '@/utils/cn'
import { ClarityBadge } from '@/modules/sessions/clarity/ui/ClarityBadge'
import type { ClarityAssessment } from '@/modules/sessions/clarity'
import type { ProjectQuestion } from '@/modules/projects'
import type { AnswerItem } from '../model/session'
import { AnswerEvidenceStrip } from '@/modules/documents'
import { Sparkles, ClipboardCheck } from 'lucide-react'
import { getDefaultValueForType, type AnswerStatus } from '../lib/session-answer-utils'

export type SessionQuestionItemProps = {
  q: ProjectQuestion
  answer: AnswerItem | undefined
  onChange: (status: AnswerStatus, value: unknown, skipReason?: string) => void
  readonly: boolean
  onAiImprove?: (q: ProjectQuestion) => void
  showAiButton?: boolean
  questionOrder?: number
  clarityAssessment?: ClarityAssessment | null
  onAssessClarity?: () => void
  assessClarityLoading?: boolean
  onOpenClarityModal?: () => void
  showAssessClarityButton?: boolean
  clarityFeatureDisabled?: boolean
  orgId?: string
  projectId?: string
  sessionId?: string
  linkPermissions?: {
    canView: boolean
    canCreate: boolean
    canRemove: boolean
    canRestoreDocument?: boolean
    canExport?: boolean
  }
}

export function SessionQuestionItem({
  q,
  answer,
  onChange,
  readonly,
  onAiImprove,
  showAiButton,
  questionOrder: _questionOrder,
  clarityAssessment,
  onAssessClarity,
  assessClarityLoading,
  onOpenClarityModal,
  showAssessClarityButton,
  clarityFeatureDisabled,
  orgId,
  projectId,
  sessionId,
  linkPermissions,
}: SessionQuestionItemProps) {
  const status = (answer?.answer_status ?? 'answered') as AnswerStatus
  const value = answer?.value
  const skipReason = answer?.skip_reason ?? ''
  const isAnswered = status === 'answered'
  // Preserve last typed value when user toggles Skipped/N/A then back to Answered (otherwise we'd send value: null → empty)
  const lastAnsweredValueRef = useRef<unknown>(null)

  const handleStatusChange = (s: AnswerStatus) => {
    if (readonly) return
    if (s === 'skipped' || s === 'na') {
      onChange(s, null, '')
    } else {
      // When switching back to "Answered", use current value or last typed value so we don't send empty
      const valueToUse = value ?? lastAnsweredValueRef.current ?? getDefaultValueForType(q.q_type)
      onChange('answered', valueToUse, undefined)
    }
  }

  const handleValueChange = (v: unknown) => {
    if (readonly) return
    lastAnsweredValueRef.current = v
    onChange('answered', v, undefined)
  }

  const renderInput = () => {
    if (status === 'skipped' || status === 'na') return null
    const disabled = readonly
    switch (q.q_type) {
      case 'text':
        return (
          <Input
            value={(value as { text?: string })?.text ?? (typeof value === 'string' ? value : '')}
            onChange={(e) => handleValueChange({ text: e.target.value })}
            placeholder="Your answer"
            fullWidth
            disabled={disabled}
          />
        )
      case 'textarea':
        return (
          <Textarea
            value={(value as { text?: string })?.text ?? (typeof value === 'string' ? value : '')}
            onChange={(e) => handleValueChange({ text: e.target.value })}
            placeholder="Your answer"
            fullWidth
            disabled={disabled}
            className="border-none"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={
              (value as { number?: number })?.number ?? (typeof value === 'number' ? value : '')
            }
            onChange={(e) => handleValueChange({ number: e.target.valueAsNumber || undefined })}
            placeholder="Number"
            fullWidth
            disabled={disabled}
          />
        )
      case 'boolean':
        return (
          <Switch
            checked={!!(value as { boolean?: boolean })?.boolean || value === true}
            onChange={(e) => handleValueChange({ boolean: e.target.checked })}
            disabled={disabled}
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={(value as { date?: string })?.date ?? (typeof value === 'string' ? value : '')}
            onChange={(e) => handleValueChange({ date: e.target.value })}
            fullWidth
            disabled={disabled}
          />
        )
      case 'select':
      case 'single_select': {
        const schema = (q.answer_schema || {}) as {
          enum?: string[]
          options?: Array<{ value: string; label?: string }>
        }
        const options =
          schema.options?.map((o) => ({ value: o.value, label: o.label ?? o.value })) ??
          schema.enum?.map((v) => ({ value: v, label: v })) ??
          []
        const selectValue =
          typeof value === 'string' ? value : ((value as { select?: string })?.select ?? '')
        return (
          <Select
            options={options}
            value={selectValue || undefined}
            placeholder="Select an option"
            disabled={disabled}
            onValueChange={(v: string) => handleValueChange(v)}
            className="w-full"
          />
        )
      }
      default:
        return (
          <Textarea
            value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : null
                handleValueChange(parsed)
              } catch {
                // invalid json, keep as-is
              }
            }}
            placeholder="JSON"
            fullWidth
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div className="bg-white">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {q.required && (
            <Badge variant="solid" tone="warning" size="sm" className="shrink-0">
              Required
            </Badge>
          )}
          <Typography weight="semibold">{q.prompt}</Typography>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {FEATURES.aiClarityAssessment &&
            showAssessClarityButton &&
            onAssessClarity != null &&
            !clarityFeatureDisabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAssessClarity}
                loading={assessClarityLoading}
                disabled={!isAnswered}
                className="gap-1"
                title={!isAnswered ? 'Answer required to assess' : undefined}
                aria-label={!isAnswered ? 'Answer required to assess' : 'Assess clarity'}
              >
                <ClipboardCheck size={14} />
                Assess clarity
              </Button>
            )}
          {FEATURES.aiClarityAssessment && clarityAssessment && (
            <ClarityBadge
              label={clarityAssessment.clarity_label}
              score={clarityAssessment.clarity_score}
              onClick={onOpenClarityModal}
            />
          )}
          {FEATURES.aiImproveAnswer && showAiButton && onAiImprove && (
            <Button variant="ghost" size="sm" onClick={() => onAiImprove(q)} className="gap-1">
              <Sparkles size={14} />
              AI Improve
            </Button>
          )}
        </div>
      </div>
      {q.help_text && (
        <Typography variant="small" tone="muted" className="mb-1">
          {q.help_text}
        </Typography>
      )}
      {clarityAssessment && clarityAssessment.ambiguity_tags.length > 0 && (
        <Typography variant="small" tone="muted" className="mb-3">
          {clarityAssessment.ambiguity_tags[0]}
        </Typography>
      )}
      <div className="mb-3 flex gap-2">
        {(['answered', 'skipped', 'na'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            disabled={readonly}
            className={cn(
              'px-3 py-1.5 text-sm',
              status === s
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {{ answered: 'Answered', skipped: 'Skipped', na: 'N/A' }[s]}
          </button>
        ))}
      </div>
      {(status === 'skipped' || status === 'na') && (
        <Input
          label="Reason (optional)"
          value={skipReason}
          onChange={(e) => onChange(status, null, e.target.value)}
          placeholder="Why skipped?"
          fullWidth
          disabled={readonly}
        />
      )}
      <Divider />
      {renderInput()}
      {orgId && projectId && sessionId && linkPermissions && (
        <AnswerEvidenceStrip
          orgId={orgId}
          projectId={projectId}
          sessionId={sessionId}
          questionId={q.id}
          canView={linkPermissions.canView}
          canCreateLink={linkPermissions.canCreate}
          canRemoveLink={linkPermissions.canRemove}
          canRestoreDocument={linkPermissions.canRestoreDocument}
        />
      )}
    </div>
  )
}
