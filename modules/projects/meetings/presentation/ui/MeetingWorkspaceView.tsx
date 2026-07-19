'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Stack, Textarea, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { ROUTES } from '@/constants/routes'
import { useProject } from '../../../project/hooks/useProject'
import { useMeetingDetail } from '../hooks/useMeetingDetail'
import { MeetingModeSwitcher } from './MeetingModeSwitcher'
import { CreateActionItemModal } from './CreateActionItemModal'
import {
  actionItemStatusLabel,
  allowedMeetingLifecycleActions,
  defaultMeetingWorkspaceMode,
  meetingStatusLabel,
  meetingStatusTone,
  minutesStatusLabel,
  minutesStatusTone,
  type MeetingLifecycleAction,
  type MeetingWorkspaceMode,
} from '../../domain/rules/meeting.rules'
import type { MeetingAgendaItem, MeetingParticipant } from '../../domain/model/meeting'
import type { MeetingActionItem } from '../../domain/model/meeting-action-item'
import { MeetingNotesPanel } from './MeetingNotesPanel'
import { ArtifactLinksPanel } from './ArtifactLinksPanel'

const LIFECYCLE_LABEL: Record<MeetingLifecycleAction, string> = {
  start: 'Start meeting',
  complete: 'Mark complete',
  cancel: 'Cancel',
  archive: 'Archive',
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function AgendaCard({ agendaItems }: { agendaItems: MeetingAgendaItem[] }) {
  return (
    <div className="border border-neutral-200 bg-white p-4">
      <Typography weight="semibold" className="mb-3">
        Agenda
      </Typography>
      {agendaItems.length === 0 ? (
        <Typography variant="small" tone="muted">
          No agenda items
        </Typography>
      ) : (
        <ul className="space-y-2">
          {agendaItems.map((a) => (
            <li key={a.id} className="border border-neutral-100 px-3 py-2">
              <Typography weight="medium">{a.title}</Typography>
              {a.description && (
                <Typography variant="small" tone="muted">
                  {a.description}
                </Typography>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ParticipantsCard({
  participants,
  onMarkAttended,
  onRemove,
}: {
  participants: MeetingParticipant[]
  onMarkAttended?: (participantId: string) => void
  onRemove?: (participantId: string) => void
}) {
  return (
    <div className="border border-neutral-200 bg-white p-4">
      <Typography weight="semibold" className="mb-3">
        Participants
      </Typography>
      {participants.length === 0 ? (
        <Typography variant="small" tone="muted">
          No participants added
        </Typography>
      ) : (
        <ul className="space-y-2">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between border border-neutral-100 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {onMarkAttended && (
                  <input
                    type="checkbox"
                    aria-label="Attended"
                    checked={p.attendanceStatus === 'ATTENDED'}
                    onChange={() => {
                      if (p.attendanceStatus !== 'ATTENDED') onMarkAttended(p.id)
                    }}
                    className="h-4 w-4 cursor-pointer accent-neutral-800"
                  />
                )}
                <Typography variant="small">{p.displayNameSnapshot ?? p.targetId}</Typography>
              </div>
              <Stack direction="horizontal" spacing="sm" className="items-center">
                <Badge tone="neutral">{p.participantRole}</Badge>
                {onRemove && (
                  <Button size="sm" variant="ghost" tone="error" onClick={() => onRemove(p.id)}>
                    Remove
                  </Button>
                )}
              </Stack>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ActionItemsCard({
  actionItems,
  onAdd,
  onComplete,
  onArchive,
  onCreateLinkedTask,
  compact = false,
}: {
  actionItems: MeetingActionItem[]
  onAdd: () => void
  onComplete?: (id: string) => void
  onArchive?: (id: string) => void
  onCreateLinkedTask?: (id: string) => void
  compact?: boolean
}) {
  return (
    <div className="border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <Typography weight="semibold">Action items</Typography>
        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={onAdd}>
          {compact ? 'Quick add' : 'Add action item'}
        </Button>
      </div>
      {actionItems.length === 0 ? (
        <Typography variant="small" tone="muted">
          No action items
        </Typography>
      ) : (
        <ul className="space-y-2">
          {actionItems.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between border border-neutral-100 px-3 py-2"
            >
              <div>
                <Typography weight="medium">{a.title}</Typography>
                {a.dueDate && (
                  <Typography variant="small" tone="muted">
                    Due {a.dueDate}
                  </Typography>
                )}
              </div>
              <Stack direction="horizontal" spacing="sm" className="items-center">
                <Badge tone={a.status === 'COMPLETED' ? 'success' : 'neutral'}>
                  {actionItemStatusLabel(a.status)}
                </Badge>
                {a.status !== 'COMPLETED' && onComplete && (
                  <Button size="sm" variant="ghost" onClick={() => onComplete(a.id)}>
                    Complete
                  </Button>
                )}
                {a.status !== 'ARCHIVED' && onArchive && (
                  <Button size="sm" variant="ghost" tone="error" onClick={() => onArchive(a.id)}>
                    Archive
                  </Button>
                )}
                {onCreateLinkedTask && (
                  <Button size="sm" variant="ghost" onClick={() => onCreateLinkedTask(a.id)}>
                    Create task
                  </Button>
                )}
              </Stack>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
    createActionItem,
    completeActionItem,
    archiveActionItem,
    markParticipantAttended,
    removeParticipant,
    createLinkedTaskFromActionItem,
    createNote,
    archiveNote,
    convertNoteToDecision,
    convertNoteToRaidItem,
    convertNoteToRequirement,
    convertNoteToChangeRequest,
    addArtifactLink,
    removeArtifactLink,
  } = useMeetingDetail(projectId, meetingId)

  const [summary, setSummary] = useState('')
  const [savingMinutes, setSavingMinutes] = useState(false)
  const [manualMode, setManualMode] = useState<MeetingWorkspaceMode | null>(null)
  const [addActionItemOpen, setAddActionItemOpen] = useState(false)

  useEffect(() => {
    setSummary(latestMinutes?.summary ?? '')
  }, [latestMinutes])

  // Reset any manual override whenever the meeting's lifecycle status changes,
  // so the workspace re-syncs to the new auto-selected mode.
  useEffect(() => {
    setManualMode(null)
  }, [meeting?.status])

  const autoMode = defaultMeetingWorkspaceMode(meeting?.status ?? '')
  const mode = manualMode ?? autoMode

  const handleLifecycle = async (action: MeetingLifecycleAction) => {
    try {
      await runLifecycle(action)
      toast.success('Meeting updated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleSaveMinutes = async () => {
    setSavingMinutes(true)
    try {
      await saveMinutes({ summary: summary.trim() || null })
      toast.success('Minutes saved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSavingMinutes(false)
    }
  }

  const handleSubmitForReview = async () => {
    try {
      await submitMinutesForReview()
      toast.success('Minutes submitted for review')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleApproveMinutes = async () => {
    try {
      await approveMinutes()
      toast.success('Minutes approved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

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

  const handleMarkParticipantAttended = async (participantId: string) => {
    try {
      await markParticipantAttended(participantId)
      toast.success('Attendance marked')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipant(participantId)
      toast.success('Participant removed')
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

  if (loading && !meeting) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this meeting</Typography>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">Meeting not found</Typography>
      </div>
    )
  }

  const lifecycleActions = allowedMeetingLifecycleActions(meeting.status)

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={wsId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Meetings"
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <button
            type="button"
            className="mb-1 text-sm text-neutral-500 hover:underline"
            onClick={() => router.push(ROUTES.workspace.projectMeetings(wsId, projectId))}
          >
            ← Back to meetings
          </button>
          <Typography as="h1" size="lg" weight="semibold">
            {meeting.title}
          </Typography>
          <Stack direction="horizontal" spacing="sm" className="mt-2 items-center">
            <Badge tone={meetingStatusTone(meeting.status)}>{meetingStatusLabel(meeting.status)}</Badge>
            <Typography variant="small" tone="muted">
              {formatDateTime(meeting.startAt)}
              {meeting.location ? ` · ${meeting.location}` : ''}
            </Typography>
          </Stack>
        </div>
        {lifecycleActions.length > 0 && (
          <Stack direction="horizontal" spacing="sm" className="flex-wrap">
            {lifecycleActions.map((action) => (
              <Button
                key={action}
                size="sm"
                variant={action === 'cancel' || action === 'archive' ? 'ghost' : 'secondary'}
                disabled={acting}
                onClick={() => void handleLifecycle(action)}
              >
                {LIFECYCLE_LABEL[action]}
              </Button>
            ))}
          </Stack>
        )}
      </div>

      {meeting.description && (
        <Typography variant="small" tone="muted" className="mb-4">
          {meeting.description}
        </Typography>
      )}

      <div className="mb-6">
        <MeetingModeSwitcher mode={mode} autoMode={autoMode} onChange={setManualMode} />
      </div>

      {mode === 'pre' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AgendaCard agendaItems={agendaItems} />
          <ParticipantsCard
            participants={participants}
            onMarkAttended={(id) => void handleMarkParticipantAttended(id)}
            onRemove={(id) => void handleRemoveParticipant(id)}
          />
          <div className="border border-neutral-200 bg-white p-4 lg:col-span-2">
            <Typography weight="semibold" className="mb-1">
              Prep notes
            </Typography>
            <Typography variant="small" tone="muted" className="mb-3">
              Capture context or talking points ahead of the meeting.
            </Typography>
            <Textarea
              fullWidth
              rows={4}
              placeholder="Preparation notes…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <Stack direction="horizontal" spacing="sm" className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                loading={savingMinutes}
                onClick={() => void handleSaveMinutes()}
              >
                Save prep notes
              </Button>
            </Stack>
          </div>
        </div>
      )}

      {mode === 'during' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border border-neutral-200 bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <Typography weight="semibold">Live notes / minutes</Typography>
              {latestMinutes && (
                <Badge tone={minutesStatusTone(latestMinutes.status)}>
                  {minutesStatusLabel(latestMinutes.status)}
                </Badge>
              )}
            </div>
            <Textarea
              fullWidth
              rows={8}
              placeholder="Capture discussion, decisions and notes as the meeting happens…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <Stack direction="horizontal" spacing="sm" className="mt-3">
              <Button
                size="sm"
                variant="primary"
                loading={savingMinutes}
                onClick={() => void handleSaveMinutes()}
              >
                Save notes
              </Button>
            </Stack>
          </div>
          <div className="lg:col-span-2">
            <ActionItemsCard
              actionItems={actionItems}
              onAdd={() => setAddActionItemOpen(true)}
              onComplete={(id) => void handleCompleteActionItem(id)}
              onArchive={(id) => void handleArchiveActionItem(id)}
              onCreateLinkedTask={(id) => void handleCreateLinkedTask(id)}
              compact
            />
          </div>
          <AgendaCard agendaItems={agendaItems} />
          <ParticipantsCard
            participants={participants}
            onMarkAttended={(id) => void handleMarkParticipantAttended(id)}
            onRemove={(id) => void handleRemoveParticipant(id)}
          />
        </div>
      )}

      {mode === 'post' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border border-neutral-200 bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <Typography weight="semibold">Minutes</Typography>
              {latestMinutes && (
                <Badge tone={minutesStatusTone(latestMinutes.status)}>
                  {minutesStatusLabel(latestMinutes.status)}
                </Badge>
              )}
            </div>
            <Textarea
              fullWidth
              rows={5}
              placeholder="Meeting summary…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <Stack direction="horizontal" spacing="sm" className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                loading={savingMinutes}
                onClick={() => void handleSaveMinutes()}
              >
                Save
              </Button>
              {latestMinutes && latestMinutes.status === 'DRAFT' && (
                <Button size="sm" variant="primary" onClick={() => void handleSubmitForReview()}>
                  Submit for review
                </Button>
              )}
              {latestMinutes && latestMinutes.status === 'IN_REVIEW' && (
                <Button size="sm" variant="primary" onClick={() => void handleApproveMinutes()}>
                  Approve
                </Button>
              )}
            </Stack>
          </div>
          <div className="lg:col-span-2">
            <ActionItemsCard
              actionItems={actionItems}
              onAdd={() => setAddActionItemOpen(true)}
              onComplete={(id) => void handleCompleteActionItem(id)}
              onArchive={(id) => void handleArchiveActionItem(id)}
              onCreateLinkedTask={(id) => void handleCreateLinkedTask(id)}
            />
          </div>
          <AgendaCard agendaItems={agendaItems} />
          <ParticipantsCard
            participants={participants}
            onMarkAttended={(id) => void handleMarkParticipantAttended(id)}
            onRemove={(id) => void handleRemoveParticipant(id)}
          />
        </div>
      )}

      <div className="mt-6 border border-neutral-200 bg-white p-4">
        <Typography weight="semibold" className="mb-3">Notes</Typography>
        <MeetingNotesPanel
          notes={notes ?? []}
          onCreateNote={createNote}
          onArchiveNote={archiveNote}
          onConvertToDecision={convertNoteToDecision}
          onConvertToRaidItem={convertNoteToRaidItem}
          onConvertToRequirement={convertNoteToRequirement}
          onConvertToChangeRequest={convertNoteToChangeRequest}
        />
      </div>

      <div className="mt-6 border border-neutral-200 bg-white p-4">
        <Typography weight="semibold" className="mb-3">Artifacts</Typography>
        <ArtifactLinksPanel
          artifactLinks={artifactLinks ?? []}
          onAdd={addArtifactLink}
          onRemove={removeArtifactLink}
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
    </div>
  )
}
