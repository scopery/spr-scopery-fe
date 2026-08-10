'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, MoreHorizontal, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  AnchoredMenu,
  anchoredMenuItemClassName,
  Badge,
  Button,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useScopeRegister } from '@/modules/projects/scope/presentation/hooks/useScopeRegister'
import { useElicitationSession } from '../hooks/useElicitationSession'
import { StartSessionModal } from './StartSessionModal'
import { RoundCard } from './RoundCard'
import { SessionClarityPanel } from './SessionClarityPanel'
import { SuggestionsPanel } from './SuggestionsPanel'
import { RoundStatus, SessionStatus } from '../../domain/enums/elicitation.enum'

function sessionStatusLabel(status: string): string {
  if (status === SessionStatus.Active) return 'Active'
  if (status === SessionStatus.Closed) return 'Closed'
  if (status === SessionStatus.Cancelled) return 'Cancelled'
  return status
}

export function ElicitationView() {
  const params = useParams()
  const projectId = params.projectId as string

  const { packages: scopePackages, loading: loadingScopePackages } = useScopeRegister(projectId)

  const {
    sessions,
    activeSession,
    questions,
    rounds,
    activeRound,
    shouldContinue,
    suggestion,
    loading,
    isGenerating,
    isSubmitting,
    error,
    startSession,
    generateNextRound,
    answerQuestion,
    skipQuestion,
    submitRound,
    closeSession,
    generateSuggestions,
    approveSuggestionItem,
    rejectSuggestionItem,
    updateSuggestionItem,
    loadSuggestion,
    loadQuestions,
    loadRounds,
    clearSuggestion,
  } = useElicitationSession(projectId)

  const [startOpen, setStartOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeSession) {
      setSelectedSessionId(activeSession.id)
    } else if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [activeSession, sessions, selectedSessionId])

  useEffect(() => {
    if (!selectedSessionId) return
    clearSuggestion()
    void loadQuestions(selectedSessionId)
    void loadRounds(selectedSessionId)
  }, [selectedSessionId, loadQuestions, loadRounds, clearSuggestion])

  const displaySession =
    sessions.find((s) => s.id === selectedSessionId) ?? sessions[0] ?? null

  const canGenerateNextRound =
    !!activeSession && !activeRound && !isGenerating && shouldContinue !== false

  const generateLabel =
    rounds.length === 0
      ? 'Generate first round'
      : `Generate Round ${rounds.length + 1}`

  const handleStartSession = async (payload: { scopePackageId: string; title?: string; language: string }) => {
    try {
      await startSession(payload)
      toast.success('Elicitation session started')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    }
  }

  const handleGenerateNextRound = async () => {
    try {
      await generateNextRound()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleCloseSession = async () => {
    setMenuOpen(false)
    try {
      await closeSession()
      toast.success('Session closed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && sessions.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6">
      {/* Title left · session controls right */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-2">
        <div className="min-w-0">
          <Typography as="h1" size="md" weight="medium">
            Elicitation
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            AI-assisted requirements clarification
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessions.length > 0 ? (
            <>
              <Select
                value={selectedSessionId ?? ''}
                onValueChange={setSelectedSessionId}
                options={sessions.map((s) => ({
                  value: s.id,
                  label: s.title?.trim() || 'Untitled session',
                }))}
                size="sm"
                className="w-52"
              />
              {displaySession ? (
                <Badge
                  variant="solid"
                  tone={displaySession.status === SessionStatus.Active ? 'success' : 'neutral'}
                  size="sm"
                >
                  {sessionStatusLabel(displaySession.status)}
                </Badge>
              ) : null}
              {activeSession && displaySession?.id === activeSession.id ? (
                <div className="relative inline-flex" ref={menuAnchorRef}>
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly
                    icon={<MoreHorizontal size={16} />}
                    aria-label="Session actions"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    disabled={isGenerating || isSubmitting}
                  />
                  <AnchoredMenu
                    open={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    anchorRef={menuAnchorRef}
                    minWidth={180}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={anchoredMenuItemClassName}
                      onClick={() => void handleCloseSession()}
                    >
                      Close session
                    </button>
                  </AnchoredMenu>
                </div>
              ) : null}
            </>
          ) : null}
          {!activeSession ? (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => setStartOpen(true)}
              disabled={loadingScopePackages || scopePackages.length === 0}
            >
              New session
            </Button>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="shrink-0 border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {sessions.length === 0 && !loading && (
        <div className="py-16 text-center">
          <Typography variant="body" className="mb-4 text-neutral-400">
            No elicitation sessions yet for this project.
          </Typography>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setStartOpen(true)}
            disabled={loadingScopePackages || scopePackages.length === 0}
          >
            Start first session
          </Button>
          {scopePackages.length === 0 && !loadingScopePackages && (
            <Typography variant="caption" className="mt-2 block text-neutral-400">
              You need at least one scope package to start elicitation.
            </Typography>
          )}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto">
              {[...rounds].reverse().map((round) => (
                <RoundCard
                  key={round.id}
                  round={round}
                  questions={questions.filter((q) => q.roundId === round.id)}
                  isStreaming={isGenerating && round.status === RoundStatus.Active}
                  isSubmitting={isSubmitting}
                  onAnswer={answerQuestion}
                  onSkip={skipQuestion}
                  onSubmit={submitRound}
                />
              ))}

              {isGenerating && !activeRound && (
                <div className="flex items-center gap-3 border border-neutral-200 bg-neutral-50 p-4 text-neutral-600">
                  <Loader2 size={16} className="shrink-0 animate-spin" />
                  <Typography variant="body">Generating round…</Typography>
                </div>
              )}

              {rounds.length === 0 && !isGenerating && activeSession && (
                <div className="border border-dashed border-neutral-200 py-12 text-center text-neutral-400">
                  <Typography variant="body">
                    No rounds yet. Generate the first round from Session Progress.
                  </Typography>
                </div>
              )}
            </div>

            <aside className="min-h-0 lg:sticky lg:top-0 lg:self-start">
              <SessionClarityPanel
                rounds={rounds}
                questions={questions}
                shouldContinue={shouldContinue}
                canGenerateNextRound={canGenerateNextRound}
                generateLabel={generateLabel}
                isGenerating={isGenerating}
                isSubmitting={isSubmitting}
                onGenerateNextRound={() => void handleGenerateNextRound()}
              />
            </aside>
          </div>

          <SuggestionsPanel
            projectId={projectId}
            sessionId={activeSession?.id ?? displaySession?.id ?? null}
            rounds={rounds}
            suggestion={suggestion}
            onGenerateSuggestions={generateSuggestions}
            onApproveItem={approveSuggestionItem}
            onRejectItem={rejectSuggestionItem}
            onLoadSuggestion={loadSuggestion}
            onItemUpdated={updateSuggestionItem}
          />
        </div>
      )}

      <StartSessionModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onSubmit={handleStartSession}
        scopePackages={scopePackages}
      />
    </div>
  )
}
