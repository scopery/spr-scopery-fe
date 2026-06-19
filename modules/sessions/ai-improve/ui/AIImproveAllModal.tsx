'use client'

import { Modal, Typography, Button, Input, Textarea, Spinner } from '@/shared/ui'
import type { ProjectQuestion } from '@/modules/projects'
import type { AnswerItem } from '@/modules/sessions/session'
import { useAIImproveAllModal } from '../hooks/useAIImproveAllModal'

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
  const modal = useAIImproveAllModal({
    open,
    orgId,
    projectId,
    sessionId,
    questions,
    answers,
    onSessionLocked,
    onSuccess,
    onClose,
  })

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={modal.handleClose}
      title="AI Improve all answers"
      size="lg"
      showCloseButton
      closeOnOverlayClick={!modal.isBusy}
      actions={[]}
    >
      <div className="space-y-4">
        {!modal.hasGenerated ? (
          <>
            <Typography variant="small" className="text-neutral-600">
              Generate AI improvements for all text/textarea answers in this session. One
              instruction will apply to every answer.
            </Typography>
            {modal.openItems.length === 0 ? (
              <Typography variant="small" tone="muted">
                No text answers to improve. Answer some questions first.
              </Typography>
            ) : (
              <>
                <Input
                  label="Instruction (optional)"
                  value={modal.userInstruction}
                  onChange={(e) => modal.setUserInstruction(e.target.value)}
                  placeholder="e.g. Make more concise, or translate to English"
                  fullWidth
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={modal.handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => void modal.handleGenerateAll()}
                    loading={modal.generating}
                    disabled={modal.openItems.length === 0}
                  >
                    {modal.generating
                      ? `Generating… (${modal.items.filter((i) => i.status === 'generated' || i.status === 'generating').length}/${modal.openItems.length})`
                      : `Generate for all (${modal.openItems.length})`}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
              <Typography variant="small" weight="medium" className="text-neutral-600">
                Review and accept or reject each proposal
              </Typography>
              {modal.canAcceptAll && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void modal.handleRejectAll()}
                    disabled={!!modal.committing}
                  >
                    Reject all
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void modal.handleAcceptAll()}
                    loading={modal.committing === 'all'}
                  >
                    Accept all
                  </Button>
                </div>
              )}
            </div>
            <div className="max-h-[60vh] space-y-6 overflow-y-auto">
              {modal.items.map((item, index) => {
                if (!item) return null
                const { question, currentAnswer, status, editableValue, batchToken } = item
                const isGenerated = status === 'generated' && batchToken
                const isDone = status === 'accepted' || status === 'rejected'
                const oneCommitting = modal.committing === question.id

                return (
                  <div
                    key={question.id}
                    className="bg-neutral-50/50 rounded-lg border border-neutral-200 p-4"
                  >
                    <Typography weight="medium" className="mb-1">
                      {question.prompt}
                    </Typography>
                    <Typography variant="small" tone="muted" className="mb-2">
                      Current:{' '}
                      {modal.formatValuePreview(currentAnswer?.value, question.q_type).slice(0, 80)}
                      {modal.formatValuePreview(currentAnswer?.value, question.q_type).length > 80
                        ? '…'
                        : ''}
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
                          onChange={(e) => modal.updateItemEditable(index, e.target.value)}
                          fullWidth
                          className="mb-3 min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            tone="error"
                            onClick={() => void modal.handleRejectOne(index)}
                            loading={oneCommitting}
                            disabled={!!modal.committing}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => void modal.handleAcceptOne(index)}
                            loading={oneCommitting}
                            disabled={!!modal.committing}
                          >
                            Accept
                          </Button>
                        </div>
                      </>
                    )}
                    {isDone && (
                      <Typography
                        variant="small"
                        tone={status === 'accepted' ? 'success' : 'muted'}
                      >
                        {status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </Typography>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={modal.handleClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
