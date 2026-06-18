'use client'

import { useState, useCallback } from 'react'
import { Modal, Typography, Button, Input, Textarea, Spinner } from '@/shared/ui'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { toast } from 'sonner'
import * as aiApi from '@/features/ai/api'
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

function finalValueForCommitApi(value: unknown, qType: string): unknown {
  if (qType === 'text' || qType === 'textarea') {
    if (typeof value === 'string') return value
    if (value !== null && typeof value === 'object' && 'text' in value) return (value as { text?: string }).text ?? ''
    return ''
  }
  return value
}

type ItemStatus = 'idle' | 'generating' | 'generated' | 'accepted' | 'rejected'

interface ImproveItem {
  question: ProjectQuestion
  currentAnswer: AnswerItem
  batchToken: string | null
  proposedValue: unknown
  editableValue: string
  status: ItemStatus
}

interface AIImproveAllModalProps {
  open: boolean
  onClose: () => void
  orgId: string
  projectId: string
  sessionId: string
  questions: ProjectQuestion[]
  answers: Record<string, AnswerItem>
  onSessionLocked: () => void
  onSuccess: () => void
}

/** Questions that have an answered text/textarea value we can improve */
function getImprovableItems(questions: ProjectQuestion[], answers: Record<string, AnswerItem>): ImproveItem[] {
  const items: ImproveItem[] = []
  for (const q of questions) {
    if (q.q_type !== 'text' && q.q_type !== 'textarea') continue
    const answer = answers[q.id]
    if (!answer || answer.answer_status !== 'answered') continue
    const currentValue = currentValueForImproveApi(answer.value, q.q_type)
    if (currentValue == null || (typeof currentValue === 'string' && !currentValue.trim())) continue
    items.push({
      question: q,
      currentAnswer: answer,
      batchToken: null,
      proposedValue: null,
      editableValue: '',
      status: 'idle',
    })
  }
  return items
}

export function AIImproveAllModal({
  open,
  onClose,
  orgId,
  projectId,
  sessionId,
  questions,
  answers,
  onSessionLocked,
  onSuccess,
}: AIImproveAllModalProps) {
  const [userInstruction, setUserInstruction] = useState('')
  const [items, setItems] = useState<ImproveItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [committing, setCommitting] = useState<string | 'all' | null>(null)

  const openItems = open ? getImprovableItems(questions, answers) : []
  const hasGenerated = items.length > 0 && items.some((i) => i.batchToken != null)
  const pendingCount = items.filter((i) => i.status === 'generated').length
  const canAcceptAll = pendingCount > 0

  const handleGenerateAll = useCallback(async () => {
    if (openItems.length === 0) {
      toast.info('No text answers to improve')
      return
    }
    setGenerating(true)
    const initial = openItems.map((i) => ({ ...i, status: 'idle' as ItemStatus }))
    setItems(initial)
    const instruction = userInstruction.trim() || undefined
    let generatedCount = 0

    for (let idx = 0; idx < openItems.length; idx++) {
      const item = openItems[idx]
      setItems((prev) => {
        const next = [...prev]
        if (next[idx]) next[idx] = { ...next[idx], status: 'generating' }
        return next
      })
      try {
        const currentValue = currentValueForImproveApi(item.currentAnswer.value, item.question.q_type)
        const res = await aiApi.improveAnswer(orgId, projectId, sessionId, {
          question_id: item.question.id,
          current_value: currentValue ?? undefined,
          user_instruction: instruction,
        })
        const rawProposed = res.proposal?.proposed_value ?? res.proposed_value
        const editable = proposedToEditable(rawProposed, item.question.q_type)
        generatedCount++
        setItems((prev) => {
          const next = [...prev]
          if (next[idx]) {
            next[idx] = {
              ...next[idx],
              batchToken: res.batch_token,
              proposedValue: rawProposed,
              editableValue: editable,
              status: 'generated',
            }
          }
          return next
        })
      } catch (err) {
        if (isConflictCode(err, 'SESSION_LOCKED')) {
          onSessionLocked()
          toast.error(getProblemToastMessage(err))
          setGenerating(false)
          return
        }
        toast.error(getProblemToastMessage(err))
        setItems((prev) => {
          const next = [...prev]
          if (next[idx]) next[idx] = { ...next[idx], status: 'idle' }
          return next
        })
      }
    }

    setGenerating(false)
    if (generatedCount > 0) {
      toast.success(`Generated proposals for ${generatedCount} answer(s)`)
    }
  }, [openItems, userInstruction, orgId, projectId, sessionId, onSessionLocked])

  const updateItemEditable = useCallback((index: number, value: string) => {
    setItems((prev) => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], editableValue: value }
      return next
    })
  }, [])

  const handleAcceptOne = useCallback(
    async (index: number) => {
      const item = items[index]
      if (!item?.batchToken || item.status !== 'generated') return
      setCommitting(item.question.id)
      try {
        const finalValue = editableToValue(item.editableValue, item.question.q_type)
        const finalForApi = finalValueForCommitApi(finalValue, item.question.q_type)
        await aiApi.improveCommit(orgId, projectId, sessionId, {
          batch_token: item.batchToken,
          question_id: item.question.id,
          action: 'accept',
          final_value: finalForApi,
        })
        setItems((prev) => {
          const next = [...prev]
          if (next[index]) next[index] = { ...next[index], status: 'accepted' }
          return next
        })
        onSuccess()
        toast.success('Answer updated')
      } catch (err) {
        if (isConflictCode(err, 'SESSION_LOCKED')) {
          onSessionLocked()
          toast.error(getProblemToastMessage(err))
        } else {
          toast.error(getProblemToastMessage(err))
        }
        throw err
      } finally {
        setCommitting(null)
      }
    },
    [items, orgId, projectId, sessionId, onSuccess, onSessionLocked]
  )

  const handleRejectOne = useCallback(
    async (index: number) => {
      const item = items[index]
      if (!item?.batchToken || item.status !== 'generated') return
      setCommitting(item.question.id)
      try {
        await aiApi.improveCommit(orgId, projectId, sessionId, {
          batch_token: item.batchToken,
          question_id: item.question.id,
          action: 'reject',
        })
        setItems((prev) => {
          const next = [...prev]
          if (next[index]) next[index] = { ...next[index], status: 'rejected' }
          return next
        })
      } catch (err) {
        if (isConflictCode(err, 'SESSION_LOCKED')) onSessionLocked()
        else toast.error(getProblemToastMessage(err))
      } finally {
        setCommitting(null)
      }
    },
    [items, orgId, projectId, sessionId, onSessionLocked]
  )

  const handleAcceptAll = useCallback(async () => {
    const toAccept = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.batchToken && item.status === 'generated')
    if (toAccept.length === 0) return
    setCommitting('all')
    let done = 0
    for (const { item, index } of toAccept) {
      try {
        const finalValue = editableToValue(item.editableValue, item.question.q_type)
        const finalForApi = finalValueForCommitApi(finalValue, item.question.q_type)
        await aiApi.improveCommit(orgId, projectId, sessionId, {
          batch_token: item.batchToken!,
          question_id: item.question.id,
          action: 'accept',
          final_value: finalForApi,
        })
        setItems((prev) => {
          const next = [...prev]
          if (next[index]) next[index] = { ...next[index], status: 'accepted' }
          return next
        })
        done++
      } catch (err) {
        if (isConflictCode(err, 'SESSION_LOCKED')) {
          onSessionLocked()
          toast.error(getProblemToastMessage(err))
          break
        }
        toast.error(getProblemToastMessage(err))
      }
    }
    setCommitting(null)
    if (done > 0) {
      onSuccess()
      toast.success(`Updated ${done} answer(s)`)
    }
  }, [items, orgId, projectId, sessionId, onSuccess, onSessionLocked])

  const handleRejectAll = useCallback(async () => {
    const toReject = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.batchToken && item.status === 'generated')
    if (toReject.length === 0) return
    setCommitting('all')
    for (const { item, index } of toReject) {
      try {
        await aiApi.improveCommit(orgId, projectId, sessionId, {
          batch_token: item.batchToken!,
          question_id: item.question.id,
          action: 'reject',
        })
        setItems((prev) => {
          const next = [...prev]
          if (next[index]) next[index] = { ...next[index], status: 'rejected' }
          return next
        })
      } catch {
        // continue
      }
    }
    setCommitting(null)
    toast.info('Rejected all proposals')
  }, [items, orgId, projectId, sessionId])

  const handleClose = useCallback(() => {
    setUserInstruction('')
    setItems([])
    setGenerating(false)
    setCommitting(null)
    onClose()
  }, [onClose])

  if (!open) return null

  const isBusy = generating || committing !== null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI Improve all answers"
      size="lg"
      showCloseButton
      closeOnOverlayClick={!isBusy}
      actions={[]}
    >
      <div className="space-y-4">
        {!hasGenerated ? (
          <>
            <Typography variant="small" className="text-neutral-600">
              Generate AI improvements for all text/textarea answers in this session. One instruction will apply to every answer.
            </Typography>
            {openItems.length === 0 ? (
              <Typography variant="small" tone="muted">
                No text answers to improve. Answer some questions first.
              </Typography>
            ) : (
              <>
                <Input
                  label="Instruction (optional)"
                  value={userInstruction}
                  onChange={(e) => setUserInstruction(e.target.value)}
                  placeholder="e.g. Make more concise, or translate to English"
                  fullWidth
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleGenerateAll}
                    loading={generating}
                    disabled={openItems.length === 0}
                  >
                    {generating ? `Generating… (${items.filter((i) => i.status === 'generated' || i.status === 'generating').length}/${openItems.length})` : `Generate for all (${openItems.length})`}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200">
              <Typography variant="small" weight="medium" className="text-neutral-600">
                Review and accept or reject each proposal
              </Typography>
              {canAcceptAll && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRejectAll} disabled={!!committing}>
                    Reject all
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAcceptAll} loading={committing === 'all'}>
                    Accept all
                  </Button>
                </div>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-6">
              {items.map((item, index) => {
                if (!item) return null
                const { question, currentAnswer, status, editableValue, batchToken } = item
                const isGenerated = status === 'generated' && batchToken
                const isDone = status === 'accepted' || status === 'rejected'
                const oneCommitting = committing === question.id

                return (
                  <div key={question.id} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                    <Typography weight="medium" className="mb-1">
                      {question.prompt}
                    </Typography>
                    <Typography variant="small" tone="muted" className="mb-2">
                      Current: {formatValuePreview(currentAnswer?.value, question.q_type).slice(0, 80)}
                      {(formatValuePreview(currentAnswer?.value, question.q_type).length > 80) ? '…' : ''}
                    </Typography>
                    {status === 'generating' && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Spinner size="sm" />
                        Generating…
                      </div>
                    )}
                    {isGenerated && (
                      <>
                        <Textarea
                          label="Proposed (editable)"
                          value={editableValue}
                          onChange={(e) => updateItemEditable(index, e.target.value)}
                          fullWidth
                          className="min-h-[80px] mb-3"
                        />
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" tone="error" onClick={() => handleRejectOne(index)} loading={oneCommitting} disabled={!!committing}>
                            Reject
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => handleAcceptOne(index)} loading={oneCommitting} disabled={!!committing}>
                            Accept
                          </Button>
                        </div>
                      </>
                    )}
                    {isDone && (
                      <Typography variant="small" tone={status === 'accepted' ? 'success' : 'muted'}>
                        {status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </Typography>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
