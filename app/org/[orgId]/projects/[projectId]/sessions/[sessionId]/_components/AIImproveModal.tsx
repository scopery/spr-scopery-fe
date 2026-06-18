'use client'

import { useState, useCallback } from 'react'
import { Modal, Typography, Button, Input, Textarea } from '@/shared/ui'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { getProblemCode } from '@/types/api'
import { toast } from 'sonner'
import { useImproveAnswer, useImproveCommit } from '@/features/ai'
import type { ProjectQuestion } from '@/services/project.service'
import type { AnswerItem } from '@/services/session.service'

function formatValuePreview(value: unknown, qType: string): string {
  if (value == null) return '—'
  if (qType === 'boolean') return (value as { boolean?: boolean })?.boolean ?? value ? 'Yes' : 'No'
  if (typeof value === 'object' && value !== null && 'text' in value) return String((value as { text?: string }).text ?? '')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function proposedToEditable(proposed: unknown, qType: string): string {
  if (proposed == null) return ''
  if (qType === 'boolean') return (proposed as { boolean?: boolean })?.boolean ?? proposed ? 'true' : 'false'
  if (typeof proposed === 'object' && proposed !== null && 'text' in proposed) return String((proposed as { text?: string }).text ?? '')
  if (typeof proposed === 'object') return JSON.stringify(proposed, null, 2)
  return String(proposed)
}

function editableToValue(editable: string, qType: string): unknown {
  if (qType === 'text' || qType === 'textarea') return { text: editable }
  if (qType === 'number') return { number: Number(editable) || undefined }
  if (qType === 'boolean') return { boolean: editable === 'true' }
  if (qType === 'date') return { date: editable }
  try {
    return editable.trim() ? JSON.parse(editable) : null
  } catch {
    return { text: editable }
  }
}

/** Serialize current answer for AI improve API. For text/textarea backend expects string; other types as-is. */
function currentValueForImproveApi(value: unknown, qType: string): string | Record<string, unknown> | null {
  if (value == null) return null
  if (qType === 'text' || qType === 'textarea') {
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null && 'text' in value) return String((value as { text?: string }).text ?? '')
    return ''
  }
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>
  return { text: String(value) }
}

/** Serialize final_value for AI improve/commit API. Backend expects string for text/textarea (same as PUT answers). */
function finalValueForCommitApi(value: unknown, qType: string): unknown {
  if (qType === 'text' || qType === 'textarea') {
    if (typeof value === 'string') return value
    if (value !== null && typeof value === 'object' && 'text' in value) return (value as { text?: string }).text ?? ''
    return ''
  }
  return value
}

interface AIImproveModalProps {
  open: boolean
  onClose: () => void
  orgId: string
  projectId: string
  sessionId: string
  question: ProjectQuestion
  currentAnswer: AnswerItem | undefined
  onSessionLocked: () => void
  onSuccess: () => void
}

export function AIImproveModal({
  open,
  onClose,
  orgId,
  projectId,
  sessionId,
  question,
  currentAnswer,
  onSessionLocked,
  onSuccess,
}: AIImproveModalProps) {
  const [userInstruction, setUserInstruction] = useState('')
  const [batchToken, setBatchToken] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_proposedValue, setProposedValue] = useState<unknown>(null)
  const [editableValue, setEditableValue] = useState('')
  const { mutateAsync: improve, isPending: improvePending } = useImproveAnswer()
  const { mutateAsync: commit, isPending: commitPending } = useImproveCommit()

  const handleGenerate = useCallback(async () => {
    try {
      const currentValue = currentValueForImproveApi(currentAnswer?.value, question.q_type)
      const res = await improve(orgId, projectId, sessionId, {
        question_id: question.id,
        current_value: currentValue ?? undefined,
        user_instruction: userInstruction.trim() || undefined,
      })
      setBatchToken(res.batch_token)
      const rawProposed = res.proposal?.proposed_value ?? res.proposed_value
      setProposedValue(rawProposed)
      setEditableValue(proposedToEditable(rawProposed, question.q_type))
    } catch (err) {
      if (isConflictCode(err, 'SESSION_LOCKED')) {
        onClose()
        onSessionLocked()
        toast.error(getProblemToastMessage(err))
      } else if (isConflictCode(err, 'AI_BATCH_EXPIRED')) {
        toast.error(getProblemToastMessage(err))
      } else if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 502 && getProblemCode(err) === 'AI_BAD_OUTPUT') {
        toast.error(getProblemToastMessage(err))
      } else {
        toast.error(err instanceof Error ? err.message : 'Generate failed')
      }
    }
  }, [orgId, projectId, sessionId, question.id, question.q_type, currentAnswer?.value, userInstruction, improve, onSessionLocked, onClose])

  const handleAccept = useCallback(async () => {
    if (!batchToken) return
    const finalValue = editableToValue(editableValue, question.q_type)
    const finalValueForApi = finalValueForCommitApi(finalValue, question.q_type)
    try {
      await commit(orgId, projectId, sessionId, {
        batch_token: batchToken,
        question_id: question.id,
        action: 'accept',
        final_value: finalValueForApi,
      }, { onSuccess })
      onClose()
      toast.success('Answer updated')
    } catch {
      // toast in hook
    }
  }, [batchToken, question.id, question.q_type, editableValue, orgId, projectId, sessionId, commit, onSuccess, onClose])

  const handleReject = useCallback(async () => {
    if (!batchToken) return
    try {
      await commit(orgId, projectId, sessionId, {
        batch_token: batchToken,
        question_id: question.id,
        action: 'reject',
      }, { onSuccess })
      onClose()
    } catch {
      // toast in hook
    }
  }, [batchToken, question.id, orgId, projectId, sessionId, commit, onSuccess, onClose])

  const handleClose = useCallback(() => {
    setUserInstruction('')
    setBatchToken(null)
    setProposedValue(null)
    setEditableValue('')
    onClose()
  }, [onClose])

  if (!open) return null

  const hasProposal = batchToken != null
  const isBusy = improvePending || commitPending

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI Improve answer"
      size="lg"
      showCloseButton
      closeOnOverlayClick={!isBusy}
      actions={[]}
    >
      <div className="space-y-4">
        <div>
          <Typography variant="small" weight="medium" className="text-neutral-600 mb-1">Question</Typography>
          <Typography>{question.prompt}</Typography>
        </div>
        <div>
          <Typography variant="small" weight="medium" className="text-neutral-600 mb-1">Current answer</Typography>
          <Typography variant="small" className="text-neutral-700">
            {formatValuePreview(currentAnswer?.value, question.q_type)}
          </Typography>
        </div>
        {!hasProposal ? (
          <>
            <Input
              label="Instruction (optional)"
              value={userInstruction}
              onChange={(e) => setUserInstruction(e.target.value)}
              placeholder="e.g. Make it more concise"
              fullWidth
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleGenerate} loading={improvePending}>
                Generate
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <Typography variant="small" weight="medium" className="text-neutral-600 mb-1">Proposed answer (editable)</Typography>
              {question.q_type === 'textarea' || question.q_type === 'text' ? (
                <Textarea
                  value={editableValue}
                  onChange={(e) => setEditableValue(e.target.value)}
                  fullWidth
                  className="min-h-[100px]"
                />
              ) : question.q_type === 'boolean' ? (
                <select
                  value={editableValue}
                  onChange={(e) => setEditableValue(e.target.value)}
                  className="border border-neutral-200 rounded px-3 py-2 w-full"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <Textarea
                  value={editableValue}
                  onChange={(e) => setEditableValue(e.target.value)}
                  fullWidth
                  className="font-mono text-sm min-h-[80px]"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setBatchToken(null); setProposedValue(null); setEditableValue('') }}>
                Back
              </Button>
              <Button variant="ghost" tone="error" onClick={handleReject} loading={commitPending}>
                Reject
              </Button>
              <Button variant="primary" onClick={handleAccept} loading={commitPending}>
                Accept
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
