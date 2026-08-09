'use client'

import { useState } from 'react'
import { Button, Spinner, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type {
  ElicitationRound,
  ElicitationSuggestion,
  ElicitationSuggestionItem,
  ScopeTreeResponse,
} from '../../domain/model/elicitation'
import { RoundStatus, SuggestionItemStatus } from '../../domain/enums/elicitation.enum'
import { getScopeTree } from '../../infrastructure/api/elicitation.api'
import { ScopeTreeView } from './ScopeTreeView'

interface SuggestionsPanelProps {
  projectId: string
  sessionId: string | null
  rounds: ElicitationRound[]
  suggestion: ElicitationSuggestion | null
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
    <div className="flex flex-col gap-2 border-b border-neutral-100 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="w-5 shrink-0 pt-0.5 text-xs text-neutral-400">#{item.sequence}</span>
        <div className="min-w-0 flex-1">
          <Typography variant="body" className="text-sm font-medium text-neutral-900">
            {item.action.replace(/_/g, ' ')}
            {item.targetEntityName ? (
              <span className="font-normal text-neutral-500"> · {item.targetEntityName}</span>
            ) : null}
          </Typography>
          <Typography variant="caption" className="mt-1 block text-neutral-500">
            {item.rationale}
          </Typography>
          {item.errorMessage ? (
            <Typography variant="caption" className="mt-1 block text-error">
              {item.errorMessage}
            </Typography>
          ) : null}
          <Typography variant="caption" className="mt-1 block text-neutral-400">
            {item.status.replace(/_/g, ' ').toLowerCase()}
            {item.estimatedImpact ? ` · ${item.estimatedImpact.toLowerCase()} impact` : ''}
          </Typography>
        </div>
      </div>

      {isPending ? (
        <div className="ml-8 flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => void handleApprove()}
            loading={acting === 'approve'}
            disabled={!!acting}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleReject()}
            loading={acting === 'reject'}
            disabled={!!acting}
          >
            Reject
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function SuggestionsPanel({
  projectId,
  sessionId,
  rounds,
  suggestion,
  onGenerateSuggestions,
  onApproveItem,
  onRejectItem,
  onLoadSuggestion,
}: SuggestionsPanelProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [generatingForId, setGeneratingForId] = useState<string | null>(null)
  const [loadingForId, setLoadingForId] = useState<string | null>(null)
  const [scopeTree, setScopeTree] = useState<ScopeTreeResponse | null>(null)
  const [scopeTreeLoading, setScopeTreeLoading] = useState(false)
  const [scopeTreeError, setScopeTreeError] = useState<string | null>(null)

  const evaluatedRounds = rounds.filter((r) => r.status === RoundStatus.Evaluated)
  const latestEvaluated = evaluatedRounds[evaluatedRounds.length - 1] ?? null

  if (evaluatedRounds.length === 0) {
    return null
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

  const handlePreview = async () => {
    setShowPreview(true)
    if (scopeTree || !sessionId) return
    setScopeTreeLoading(true)
    setScopeTreeError(null)
    try {
      const tree = await getScopeTree(projectId, sessionId)
      setScopeTree(tree)
    } catch {
      setScopeTreeError('Failed to load scope tree')
    } finally {
      setScopeTreeLoading(false)
    }
  }

  const itemCount = suggestion?.items?.length ?? 0

  return (
    <section className="shrink-0 border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-4 py-4">
        <div>
          <Typography variant="body" className="text-base font-semibold text-neutral-900">
            Scope suggestions
          </Typography>
          <Typography variant="caption" className="mt-1 block text-neutral-500">
            {suggestion
              ? `AI generated ${itemCount} candidate scope item${itemCount === 1 ? '' : 's'} from the clarification session.`
              : 'Generate scope suggestions after reviewing the clarification results.'}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          {latestEvaluated && !suggestion ? (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => void handleGenerate(latestEvaluated.id)}
                loading={generatingForId === latestEvaluated.id}
              >
                Generate suggestions
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void handleLoad(latestEvaluated.id)}
                loading={loadingForId === latestEvaluated.id}
              >
                Load existing
              </Button>
            </>
          ) : null}
          {suggestion ? (
            <Button size="sm" variant="outline" onClick={() => void handlePreview()}>
              {showPreview ? 'Refresh preview' : 'Review scope'}
            </Button>
          ) : null}
        </div>
      </div>

      {generatingForId ? (
        <div className="flex items-center gap-2 px-4 py-4 text-neutral-500">
          <Spinner size="sm" />
          <Typography variant="body">AI is generating suggestions…</Typography>
        </div>
      ) : null}

      {suggestion ? (
        <div className="px-4 py-2">
          {suggestion.overallSummary ? (
            <Typography variant="caption" className="mb-2 block text-neutral-600">
              {suggestion.overallSummary}
            </Typography>
          ) : null}
          {(suggestion.items ?? []).map((item) => (
            <SuggestionItemRow
              key={item.id}
              item={item}
              onApprove={() => onApproveItem(item.id)}
              onReject={() => onRejectItem(item.id)}
            />
          ))}
          {(suggestion.items ?? []).length === 0 ? (
            <Typography variant="body" className="py-3 text-neutral-400">
              No suggestion items
            </Typography>
          ) : null}
        </div>
      ) : null}

      {showPreview ? (
        <div className="border-t border-neutral-100 px-4 py-4">
          <Typography variant="caption" className="mb-3 block font-medium text-neutral-600">
            Scope preview
          </Typography>
          {scopeTreeLoading ? (
            <div className="flex items-center gap-2 py-4 text-neutral-500">
              <Spinner size="sm" />
              <Typography variant="body">Loading scope tree…</Typography>
            </div>
          ) : null}
          {scopeTreeError ? (
            <Typography variant="body" className="py-2 text-error">
              {scopeTreeError}
            </Typography>
          ) : null}
          {scopeTree && !scopeTreeLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ScopeTreeView mode="before" nodes={scopeTree.before} />
              <ScopeTreeView mode="after" nodes={scopeTree.after} />
            </div>
          ) : null}
          {!scopeTree && !scopeTreeLoading && !scopeTreeError ? (
            <Typography variant="body" className="py-4 text-neutral-400">
              No scope tree available.
            </Typography>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
