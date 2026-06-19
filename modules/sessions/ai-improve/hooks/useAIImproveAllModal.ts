'use client'

import { useCallback, useState } from 'react'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { toast } from 'sonner'
import * as aiImproveApi from '../api/ai-improve.api'
import type { ProjectQuestion } from '@/modules/projects'
import type { AnswerItem } from '@/modules/sessions/session'

function formatValuePreview(value: unknown, qType: string): string {
  if (value == null) return '—'
  if (qType === 'boolean')
    return ((value as { boolean?: boolean })?.boolean ?? value) ? 'Yes' : 'No'
  if (typeof value === 'object' && value !== null && 'text' in value)
    return String((value as { text?: string }).text ?? '')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function proposedToEditable(proposed: unknown, qType: string): string {
  if (proposed == null) return ''
  if (qType === 'boolean')
    return ((proposed as { boolean?: boolean })?.boolean ?? proposed) ? 'true' : 'false'
  if (typeof proposed === 'object' && proposed !== null && 'text' in proposed)
    return String((proposed as { text?: string }).text ?? '')
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

function currentValueForImproveApi(
  value: unknown,
  qType: string
): string | Record<string, unknown> | null {
  if (value == null) return null
  if (qType === 'text' || qType === 'textarea') {
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null && 'text' in value)
      return String((value as { text?: string }).text ?? '')
    return ''
  }
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>
  return { text: String(value) }
}

function finalValueForCommitApi(value: unknown, qType: string): unknown {
  if (qType === 'text' || qType === 'textarea') {
    if (typeof value === 'string') return value
    if (value !== null && typeof value === 'object' && 'text' in value)
      return (value as { text?: string }).text ?? ''
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

function getImprovableItems(
  questions: ProjectQuestion[],
  answers: Record<string, AnswerItem>
): ImproveItem[] {
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

interface UseAIImproveAllModalParams {
  open: boolean
  orgId: string
  projectId: string
  sessionId: string
  questions: ProjectQuestion[]
  answers: Record<string, AnswerItem>
  onSessionLocked: () => void
  onSuccess: () => void
  onClose: () => void
}

export function useAIImproveAllModal({
  open,
  orgId,
  projectId,
  sessionId,
  questions,
  answers,
  onSessionLocked,
  onSuccess,
  onClose,
}: UseAIImproveAllModalParams) {
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
        const currentValue = currentValueForImproveApi(
          item.currentAnswer.value,
          item.question.q_type
        )
        const res = await aiImproveApi.improveAnswer(orgId, projectId, sessionId, {
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
        await aiImproveApi.improveCommit(orgId, projectId, sessionId, {
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
        await aiImproveApi.improveCommit(orgId, projectId, sessionId, {
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
        await aiImproveApi.improveCommit(orgId, projectId, sessionId, {
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
        await aiImproveApi.improveCommit(orgId, projectId, sessionId, {
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

  const isBusy = generating || committing !== null

  return {
    userInstruction,
    items,
    generating,
    committing,
    openItems,
    hasGenerated,
    canAcceptAll,
    isBusy,
    setUserInstruction,
    handleGenerateAll,
    updateItemEditable,
    handleAcceptOne,
    handleRejectOne,
    handleAcceptAll,
    handleRejectAll,
    handleClose,
    formatValuePreview,
  }
}
