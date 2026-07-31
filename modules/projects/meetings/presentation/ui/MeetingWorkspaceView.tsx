'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, PageSkeleton, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { ROUTES } from '@/constants/routes'
import { useProject } from '../../../project/hooks/useProject'
import { useMeetingDetail } from '../hooks/useMeetingDetail'
import {
  defaultMeetingWorkspaceMode,
  type MeetingLifecycleAction,
  type MeetingWorkspaceMode,
} from '../../domain/rules/meeting.rules'
import { MeetingLifecycleStepper } from './MeetingLifecycleStepper'
import { MeetingHeader, type AutosaveState } from './MeetingHeader'
import { MeetingContextRail } from './MeetingContextRail'
import { MeetingCanvasEditor, type SlashCapture } from './MeetingCanvasEditor'
import { MeetingActionItemList } from './MeetingActionItemList'
import { MeetingRecap } from './MeetingRecap'
import { CreateActionItemModal } from './CreateActionItemModal'
import { AddAgendaItemModal } from './AddAgendaItemModal'
import { AddParticipantModal } from './AddParticipantModal'
import { LinkProjectItemDrawer } from './LinkProjectItemDrawer'
import { createDecision } from '@/modules/projects/decisions/infrastructure/api/decisions.api'
import { createRaidItem } from '@/modules/projects/raid/infrastructure/api/raid.api'
import { DecisionCategory } from '@/modules/projects/decisions/domain/enums/decision.enum'

const AUTOSAVE_MS = 30_000

function normalizeMinutesSummary(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export function MeetingWorkspaceView() {
  const router = useRouter()
  const params = useParams()
  const wsId = params.workspaceId as string
  const projectId = params.projectId as string
  const meetingId = params.meetingId as string

  const { project } = useProject(wsId, projectId)
  const {
    meeting,
    notes,
    artifactLinks,
    agendaItems,
    participants,
    latestMinutes,
    actionItems,
    loading,
    forbidden,
    acting,
    runLifecycle,
    saveMinutes,
    submitMinutesForReview,
    approveMinutes,
    rejectMinutes,
    createActionItem,
    completeActionItem,
    archiveActionItem,
    markParticipantAttended,
    removeParticipant,
    addParticipant,
    createLinkedTaskFromActionItem,
    addArtifactLink,
    removeArtifactLink,
    generateMinutesDocument,
    createAgendaItem,
    deleteAgendaItem,
  } = useMeetingDetail(projectId, meetingId)

  const [summary, setSummary] = useState('')
  const [autosaveState, setAutosaveState] = useState<AutosaveState>('idle')
  const [autosaveSecondsLeft, setAutosaveSecondsLeft] = useState<number | null>(null)
  const [manualMode, setManualMode] = useState<MeetingWorkspaceMode | null>(null)
  const [addActionItemOpen, setAddActionItemOpen] = useState(false)
  const [addAgendaOpen, setAddAgendaOpen] = useState(false)
  const [addParticipantOpen, setAddParticipantOpen] = useState(false)
  const [linkDrawerOpen, setLinkDrawerOpen] = useState(false)
  const [generatingDoc, setGeneratingDoc] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const hydratedRef = useRef(false)
  const saveMinutesRef = useRef(saveMinutes)
  saveMinutesRef.current = saveMinutes
  const saveGenerationRef = useRef(0)

  useEffect(() => {
    if (!latestMinutes) {
      if (!hydratedRef.current) {
        setSummary('')
        hydratedRef.current = true
      }
      return
    }
    setSummary(latestMinutes.summary ?? '')
    hydratedRef.current = true
  }, [latestMinutes?.id, latestMinutes?.summary])

  useEffect(() => {
    setManualMode(null)
  }, [meeting?.status])

  const autoMode = defaultMeetingWorkspaceMode(meeting?.status ?? '')
  const mode = manualMode ?? autoMode

  // Live meeting elapsed timer (client-only)
  useEffect(() => {
    if (mode !== 'during' || meeting?.status !== 'IN_PROGRESS') {
      setElapsed(0)
      return
    }
    const started = meeting.updatedAt ? new Date(meeting.updatedAt).getTime() : Date.now()
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [mode, meeting?.status, meeting?.updatedAt])

  // Autosave minutes summary — debounce 30s after last edit; countdown in header.
  useEffect(() => {
    if (!meeting || !hydratedRef.current) return
    const serverSummary = normalizeMinutesSummary(latestMinutes?.summary)
    const localSummary = normalizeMinutesSummary(summary)
    if (localSummary === serverSummary) {
      setAutosaveSecondsLeft(null)
      setAutosaveState((prev) => (prev === 'pending' ? 'idle' : prev))
      return
    }

    const generation = ++saveGenerationRef.current
    const startedAt = Date.now()
    setAutosaveState('pending')
    setAutosaveSecondsLeft(Math.ceil(AUTOSAVE_MS / 1000))

    const tickId = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((AUTOSAVE_MS - (Date.now() - startedAt)) / 1000))
      setAutosaveSecondsLeft(left)
    }, 250)

    const timer = window.setTimeout(() => {
      window.clearInterval(tickId)
      if (generation !== saveGenerationRef.current) return
      setAutosaveSecondsLeft(null)
      setAutosaveState('saving')
      void (async () => {
        try {
          await saveMinutesRef.current({ summary: localSummary || null }, { quiet: true })
          if (generation !== saveGenerationRef.current) return
          setAutosaveState('saved')
        } catch {
          if (generation !== saveGenerationRef.current) return
          setAutosaveState('error')
        }
      })()
    }, AUTOSAVE_MS)

    return () => {
      window.clearTimeout(timer)
      window.clearInterval(tickId)
    }
  }, [summary, meeting, latestMinutes?.summary])

  // Clear "Saved just now" after a short beat so it doesn't stick forever.
  useEffect(() => {
    if (autosaveState !== 'saved') return
    const id = window.setTimeout(() => setAutosaveState('idle'), 4000)
    return () => window.clearTimeout(id)
  }, [autosaveState])

  const handleLifecycle = async (action: MeetingLifecycleAction) => {
    try {
      await runLifecycle(action)
      toast.success(
        action === 'start'
          ? 'Meeting started'
          : action === 'complete'
            ? 'Meeting ended'
            : action === 'cancel'
              ? 'Meeting cancelled'
              : 'Meeting archived'
      )
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleSlashCapture = useCallback(
    async (capture: SlashCapture) => {
      const title = capture.content.trim()
      if (!title) throw new Error('Title is required')

      const slug = title
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 20)
      const suffix = Date.now().toString(36).toUpperCase().slice(-4)

      try {
        if (capture.kind === 'action') {
          await createActionItem({ title }, { quiet: true })
          toast.success('Action item created')
          return
        }

        if (capture.kind === 'decision') {
          await createDecision(projectId, {
            title,
            code: `DEC_${slug || 'MTG'}_${suffix}`,
            category: DecisionCategory.Other,
            rationale: `Captured from ${meeting?.title || 'meeting'}`,
          })
          toast.success('Decision created')
          return
        }

        if (capture.kind === 'risk' || capture.kind === 'issue') {
          const type = capture.kind === 'risk' ? 'RISK' : 'ISSUE'
          await createRaidItem(projectId, {
            type,
            title,
            code: `${type === 'RISK' ? 'RSK' : 'ISS'}_${slug || 'MTG'}_${suffix}`,
            description: `Captured from ${meeting?.title || 'meeting'}`,
          })
          toast.success(capture.kind === 'risk' ? 'Risk created' : 'Issue created')
          return
        }

        toast.message('Added to notes only', {
          description: 'Requirement / change convert needs BE support.',
        })
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [createActionItem, meeting?.title, projectId]
  )

  const handleCompleteActionItem = async (actionItemId: string) => {
    try {
      await completeActionItem(actionItemId)
      toast.success('Action item completed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleArchiveActionItem = async (actionItemId: string) => {
    try {
      await archiveActionItem(actionItemId)
      toast.success('Action item archived')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleCreateLinkedTask = async (actionItemId: string) => {
    try {
      await createLinkedTaskFromActionItem(actionItemId)
      toast.success('Linked task created')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleGenerateMinutesDoc = async () => {
    if (!latestMinutes) return
    setGeneratingDoc(true)
    try {
      await generateMinutesDocument(latestMinutes.id)
      toast.success('Meeting note published')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setGeneratingDoc(false)
    }
  }

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
  }

  if (loading && !meeting) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">You don’t have access to this meeting</Typography>
      </Card>
    )
  }

  if (!meeting) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">Meeting not found</Typography>
      </Card>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={wsId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Meetings"
      />

      <MeetingHeader
        meeting={meeting}
        participantCount={participants.length}
        autosaveState={autosaveState}
        autosaveSecondsLeft={autosaveSecondsLeft}
        acting={acting}
        onLifecycle={(action) => void handleLifecycle(action)}
        onBack={() => router.push(ROUTES.workspace.projectMeetings(wsId, projectId))}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <MeetingLifecycleStepper mode={mode} autoMode={autoMode} onChange={setManualMode} />
        {mode === 'during' && meeting.status === 'IN_PROGRESS' ? (
          <div className="inline-flex items-center gap-2 bg-warning px-3 py-1.5 text-sm text-white">
            <span className="h-1.5 w-1.5 shrink-0 bg-white" aria-hidden />
            Meeting in progress · {formatElapsed(elapsed)}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {mode === 'pre' && (
            <>
              <MeetingCanvasEditor
                label="Meeting objective & preparation notes"
                helper="What must this meeting achieve? Notes autosave 30s after you stop typing. Select text → AI to rewrite."
                placeholder="Objective, talking points, prep context…"
                value={summary}
                rows={8}
                workspaceId={wsId}
                onChange={setSummary}
              />
            </>
          )}

          {mode === 'during' && (
            <>
              <MeetingCanvasEditor
                label="Live notes"
                helper="Write freely. Notes autosave 30s after you stop typing. Select text → AI to rewrite. Use Quick capture for follow-ups."
                placeholder="Capture discussion…"
                value={summary}
                rows={12}
                workspaceId={wsId}
                onChange={setSummary}
                onSlashCapture={handleSlashCapture}
                showSlashHints
              />
              <MeetingActionItemList
                actionItems={actionItems}
                onAdd={() => setAddActionItemOpen(true)}
                onComplete={(id) => void handleCompleteActionItem(id)}
                onArchive={(id) => void handleArchiveActionItem(id)}
                onCreateLinkedTask={(id) => void handleCreateLinkedTask(id)}
                hint="Or use Quick capture → Action above the notes."
              />
            </>
          )}

          {mode === 'post' && (
            <>
              <MeetingRecap
                latestMinutes={latestMinutes}
                summary={summary}
                actionItems={actionItems}
                participants={participants}
                notes={notes ?? []}
                acting={acting}
                generatingDoc={generatingDoc}
                onSubmitForReview={() => {
                  void (async () => {
                    try {
                      if (summary !== (latestMinutes?.summary ?? '')) {
                        await saveMinutes({ summary: summary.trim() || null })
                      }
                      await submitMinutesForReview()
                      toast.success('Minutes submitted for review')
                    } catch (err) {
                      toast.error(getProblemToastMessage(err))
                    }
                  })()
                }}
                onApprove={() => {
                  void (async () => {
                    try {
                      await approveMinutes()
                      toast.success('Minutes approved')
                    } catch (err) {
                      toast.error(getProblemToastMessage(err))
                    }
                  })()
                }}
                onReject={() => {
                  void (async () => {
                    try {
                      await rejectMinutes()
                      toast.success('Changes requested')
                    } catch (err) {
                      toast.error(getProblemToastMessage(err))
                    }
                  })()
                }}
                onGenerateDoc={() => void handleGenerateMinutesDoc()}
                onOpenDoc={() => {
                  if (latestMinutes?.documentId) {
                    router.push(ROUTES.workspace.document(wsId, latestMinutes.documentId))
                  }
                }}
              />
              <MeetingCanvasEditor
                label="Edit summary"
                helper="Autosaves 30s after you stop typing. Select text → AI to rewrite. Changes feed the recap above."
                placeholder="Meeting summary…"
                value={summary}
                rows={6}
                workspaceId={wsId}
                onChange={setSummary}
              />
              <MeetingActionItemList
                actionItems={actionItems}
                onAdd={() => setAddActionItemOpen(true)}
                onComplete={(id) => void handleCompleteActionItem(id)}
                onArchive={(id) => void handleArchiveActionItem(id)}
                onCreateLinkedTask={(id) => void handleCreateLinkedTask(id)}
              />
            </>
          )}
        </div>

        <MeetingContextRail
          mode={mode}
          agendaItems={agendaItems}
          participants={participants}
          artifactLinks={artifactLinks ?? []}
          onAddAgenda={() => setAddAgendaOpen(true)}
          onRemoveAgenda={(id) => {
            void (async () => {
              try {
                await deleteAgendaItem(id)
                toast.success('Agenda item removed')
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            })()
          }}
          onAddParticipant={() => setAddParticipantOpen(true)}
          onRemoveParticipant={(id) => {
            void (async () => {
              try {
                await removeParticipant(id)
                toast.success('Participant removed')
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            })()
          }}
          onMarkAttended={(id) => {
            void (async () => {
              try {
                await markParticipantAttended(id)
                toast.success('Marked present')
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            })()
          }}
          onLinkItem={() => setLinkDrawerOpen(true)}
          onRemoveLink={(id) => {
            void (async () => {
              try {
                await removeArtifactLink(id)
                toast.success('Link removed')
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            })()
          }}
        />
      </div>

      <CreateActionItemModal
        open={addActionItemOpen}
        onClose={() => setAddActionItemOpen(false)}
        onSubmit={async (body) => {
          try {
            await createActionItem(body)
            toast.success('Action item added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <AddAgendaItemModal
        open={addAgendaOpen}
        onClose={() => setAddAgendaOpen(false)}
        onSubmit={async (body) => {
          try {
            await createAgendaItem({
              ...body,
              sortOrder: agendaItems.length + 1,
            })
            toast.success('Agenda item added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <AddParticipantModal
        open={addParticipantOpen}
        onClose={() => setAddParticipantOpen(false)}
        onSubmit={async (body) => {
          try {
            await addParticipant(body)
            toast.success('Participant added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <LinkProjectItemDrawer
        open={linkDrawerOpen}
        onClose={() => setLinkDrawerOpen(false)}
        projectId={projectId}
        onLink={async (body) => {
          try {
            await addArtifactLink(body)
            toast.success('Item linked')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
