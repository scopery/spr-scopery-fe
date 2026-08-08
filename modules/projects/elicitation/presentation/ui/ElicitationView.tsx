'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Select, Typography, type BadgeTone } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useScopeRegister } from '@/modules/projects/scope/presentation/hooks/useScopeRegister'
import { useElicitationSession } from '../hooks/useElicitationSession'
import { StartSessionModal } from './StartSessionModal'
import { QuestionsPanel } from './QuestionsPanel'
import { SuggestionsPanel } from './SuggestionsPanel'

const SESSION_STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
  CANCELLED: 'neutral',
}

type ActiveTab = 'questions' | 'rounds'

export function ElicitationView() {
  const params = useParams()
  const projectId = params.projectId as string

  const { packages: scopePackages, loading: loadingScopePackages } = useScopeRegister(projectId)

  const {
    sessions,
    activeSession,
    questions,
    rounds,
    suggestion,
    loading,
    generating,
    evaluating,
    error,
    startSession,
    generateQuestions,
    answerQuestion,
    skipQuestion,
    evaluateAnswers,
    closeSession,
    submitRound,
    generateSuggestions,
    approveSuggestionItem,
    rejectSuggestionItem,
    loadSuggestion,
  } = useElicitationSession(projectId)

  const [startOpen, setStartOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('questions')

  useEffect(() => {
    if (activeSession) {
      setSelectedSessionId(activeSession.id)
    } else if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [activeSession, sessions, selectedSessionId])

  const displaySession =
    sessions.find((s) => s.id === selectedSessionId) ?? sessions[0] ?? null

  const handleStartSession = async (payload: { scopePackageId: string; title?: string }) => {
    try {
      await startSession(payload)
      toast.success('Elicitation session started')
      setActiveTab('questions')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    }
  }

  const handleCloseSession = async () => {
    const round = await closeSession()
    if (round) {
      setActiveTab('rounds')
    }
  }

  if (loading && sessions.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-semibold">
            Elicitation
          </Typography>
          <Typography variant="body" className="text-neutral-500">
            AI-assisted requirements clarification sessions
          </Typography>
        </div>
        {!activeSession && (
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setStartOpen(true)}
            disabled={loadingScopePackages || scopePackages.length === 0}
          >
            New session
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && !loading && (
        <div className="py-16 text-center">
          <Typography variant="body" className="text-neutral-400 mb-4">
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
            <Typography variant="caption" className="block mt-2 text-neutral-400">
              You need at least one scope package to start elicitation.
            </Typography>
          )}
        </div>
      )}

      {/* Session selector + active session */}
      {sessions.length > 0 && (
        <>
          {/* Session selector */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedSessionId ?? ''}
              onValueChange={setSelectedSessionId}
              options={sessions.map((s) => ({
                value: s.id,
                label: `${s.title ?? 'Session'} — ${s.status}`,
              }))}
              className="w-72"
            />
            {displaySession && (
              <Badge tone={SESSION_STATUS_TONE[displaySession.status] ?? 'neutral'} size="sm">
                {displaySession.status}
              </Badge>
            )}
            {!activeSession && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Plus size={14} />}
                onClick={() => setStartOpen(true)}
                disabled={loadingScopePackages || scopePackages.length === 0}
              >
                New session
              </Button>
            )}
          </div>

          {/* Active session notice */}
          {activeSession && displaySession?.id === activeSession.id && (
            <div className="bg-green-50 border border-green-200px-4 py-2 text-sm text-green-800">
              Active session — answer the questions below, then close the session to generate AI suggestions.
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-neutral-200 flex gap-4">
            <button
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
              onClick={() => setActiveTab('questions')}
            >
              Questions ({questions.length})
            </button>
            <button
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rounds'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
              onClick={() => setActiveTab('rounds')}
            >
              Rounds & Suggestions ({rounds.length})
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'questions' && displaySession && (
            <QuestionsPanel
              session={displaySession}
              questions={questions}
              generating={generating}
              evaluating={evaluating}
              onGenerate={generateQuestions}
              onAnswer={answerQuestion}
              onSkip={skipQuestion}
              onEvaluate={evaluateAnswers}
              onCloseSession={handleCloseSession}
            />
          )}

          {activeTab === 'rounds' && (
            <SuggestionsPanel
              rounds={rounds}
              suggestion={suggestion}
              onSubmitRound={submitRound}
              onGenerateSuggestions={generateSuggestions}
              onApproveItem={approveSuggestionItem}
              onRejectItem={rejectSuggestionItem}
              onLoadSuggestion={loadSuggestion}
            />
          )}
        </>
      )}

      {/* Modals */}
      <StartSessionModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onSubmit={handleStartSession}
        scopePackages={scopePackages}
      />
    </div>
  )
}
