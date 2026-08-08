'use client'

import { useState } from 'react'
import { Badge, Button, Spinner, Typography, type BadgeTone } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type {
  ElicitationRound,
  ElicitationSuggestion,
  ElicitationSuggestionItem,
} from '../../domain/model/elicitation'
import { RoundStatus, SuggestionItemStatus } from '../../domain/enums/elicitation.enum'

const IMPACT_TONE: Record<string, BadgeTone> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
}

const ITEM_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'neutral',
  APPROVED: 'info',
  EXECUTING: 'info',
  SUCCEEDED: 'success',
  FAILED: 'error',
  SKIPPED: 'neutral',
  REJECTED: 'neutral',
}

interface SuggestionsPanelProps {
  rounds: ElicitationRound[]
  suggestion: ElicitationSuggestion | null
  onSubmitRound: (roundId: string) => Promise<unknown>
  onGenerateSuggestions: (roundId: string) => Promise<unknown>
  onApproveItem: (itemId: string) => Promise<unknown>
  onRejectItem: (itemId: string) => Promise<unknown>
  onLoadSuggestion: (roundId: string) => Promise<unknown>
}

function SuggestionItemRow({
  item,
  onApprove,
  onReject,
}: {
  item: ElicitationSuggestionItem
  onApprove: () => Promise<unknown>
  onReject: () => Promise<unknown>
}) {
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    setActing('approve')
    try {
      await onApprove()
      toast.success('Action approved and executed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActing(null)
    }
  }

  const handleReject = async () => {
    setActing('reject')
    try {
      await onReject()
      toast.success('Action rejected')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActing(null)
    }
  }

  const isPending = item.status === SuggestionItemStatus.Pending

  return (
    <div className="py-3 flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <span className="text-xs text-neutral-400 min-w-[2rem] pt-0.5">#{item.sequence}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Typography variant="body" className="font-semibold text-neutral-800">
              {item.action.replace(/_/g, ' ')}
            </Typography>
            {item.targetEntityName && (
              <Badge tone="neutral" size="sm">{item.targetEntityName}</Badge>
            )}
            <Badge tone={IMPACT_TONE[item.estimatedImpact] ?? 'neutral'} size="sm">
              {item.estimatedImpact}
            </Badge>
            <Badge tone={ITEM_STATUS_TONE[item.status] ?? 'neutral'} size="sm">
              {item.status}
            </Badge>
          </div>
          <Typography variant="caption" className="mt-1 text-neutral-600">
            {item.rationale}
          </Typography>
          {item.errorMessage && (
            <Typography variant="caption" className="mt-1 text-red-600">
              Error: {item.errorMessage}
            </Typography>
          )}
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 ml-8">
          <Button
            size="sm"
            variant="primary"
            onClick={() => void handleApprove()}
            loading={acting === 'approve'}
            disabled={!!acting}
          >
            Approve & Execute
          </Button>
          <Button
            size="sm"
            variant="ghost"
            tone="error"
            onClick={() => void handleReject()}
            loading={acting === 'reject'}
            disabled={!!acting}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}

export function SuggestionsPanel({
  rounds,
  suggestion,
  onSubmitRound,
  onGenerateSuggestions,
  onApproveItem,
  onRejectItem,
  onLoadSuggestion,
}: SuggestionsPanelProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [generatingForId, setGeneratingForId] = useState<string | null>(null)
  const [loadingForId, setLoadingForId] = useState<string | null>(null)

  const latestRound = rounds[rounds.length - 1] ?? null

  const handleSubmit = async (roundId: string) => {
    setSubmittingId(roundId)
    try {
      await onSubmitRound(roundId)
      toast.success('Round submitted')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSubmittingId(null)
    }
  }

  const handleGenerate = async (roundId: string) => {
    setGeneratingForId(roundId)
    try {
      await onGenerateSuggestions(roundId)
      toast.success('Suggestions generated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setGeneratingForId(null)
    }
  }

  const handleLoad = async (roundId: string) => {
    setLoadingForId(roundId)
    try {
      await onLoadSuggestion(roundId)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoadingForId(null)
    }
  }

  if (rounds.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Typography variant="body">
          No rounds yet. Close an active session to create an elicitation round.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {rounds.map((round) => (
        <div key={round.id} className="border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Typography variant="body" className="font-semibold">
                Round #{round.roundNumber}
              </Typography>
              <Badge tone={round.status === RoundStatus.Completed ? 'success' : 'neutral'} size="sm">
                {round.status}
              </Badge>
              {round.overallClarity && (
                <Badge
                  tone={
                    round.overallClarity === 'CLEARED'
                      ? 'success'
                      : round.overallClarity === 'BLOCKED' || round.overallClarity === 'CRITICAL'
                        ? 'error'
                        : 'warning'
                  }
                  size="sm"
                >
                  {round.overallClarity}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {round.status === RoundStatus.Draft && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleSubmit(round.id)}
                  loading={submittingId === round.id}
                >
                  Submit round
                </Button>
              )}
              {round.status === RoundStatus.Submitted && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => void handleGenerate(round.id)}
                  loading={generatingForId === round.id}
                >
                  Generate suggestions (AI)
                </Button>
              )}
              {round.status === RoundStatus.Completed && !suggestion && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleLoad(round.id)}
                  loading={loadingForId === round.id}
                >
                  Load suggestions
                </Button>
              )}
            </div>
          </div>

          {/* Show suggestion for this round */}
          {latestRound?.id === round.id && (
            <>
              {(generatingForId === round.id || round.status === RoundStatus.Processing) && (
                <div className="flex items-center gap-2 py-2 text-neutral-500">
                  <Spinner size="sm" />
                  <Typography variant="body">AI is generating suggestions…</Typography>
                </div>
              )}

              {suggestion && (
                <div className="mt-2">
                  {suggestion.overallSummary && (
                    <div className="bg-blue-50 border border-blue-100 p-3 mb-3">
                      <Typography variant="caption" className="text-blue-800">
                        {suggestion.overallSummary}
                      </Typography>
                    </div>
                  )}

                  <div className="flex flex-col divide-y divide-neutral-100">
                    {(suggestion.items ?? []).map((item) => (
                      <SuggestionItemRow
                        key={item.id}
                        item={item}
                        onApprove={() => onApproveItem(item.id)}
                        onReject={() => onRejectItem(item.id)}
                      />
                    ))}
                  </div>

                  {(suggestion.items ?? []).length === 0 && (
                    <Typography variant="body" className="text-neutral-400 py-2">
                      No suggestion items
                    </Typography>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
