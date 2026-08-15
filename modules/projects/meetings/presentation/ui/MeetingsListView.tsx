'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, DataTable, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { ROUTES } from '@/constants/routes'
import { MeetingSeriesView } from '@/modules/projects/meeting-series'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectMeetings } from '../hooks/useProjectMeetings'
import { CreateMeetingModal } from './CreateMeetingModal'
import {
  isUpcomingMeeting,
  meetingStatusLabel,
  meetingStatusTone,
} from '../../domain/rules/meeting.rules'

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

export function MeetingsListView() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project } = useProject(workspaceId, projectId)
  const { meetings, loading, forbidden, createMeeting } = useProjectMeetings(projectId)
  const [tab, setTab] = useState<'upcoming' | 'past' | 'series'>('upcoming')
  const [createOpen, setCreateOpen] = useState(false)

  const upcoming = useMemo(
    () =>
      meetings
        .filter((m) => isUpcomingMeeting(m))
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [meetings]
  )
  const past = useMemo(
    () =>
      meetings
        .filter((m) => !isUpcomingMeeting(m))
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [meetings]
  )

  const visibleMeetings = tab === 'upcoming' ? upcoming : past

  const openMeeting = (meetingId: string) => {
    router.push(ROUTES.workspace.projectMeeting(workspaceId, projectId, meetingId))
  }

  if (loading && meetings.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">You don’t have access to meetings</Typography>
      </Card>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Meetings"
      />

      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Meetings
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Schedule and track project meetings
          </Typography>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          Schedule meeting
        </Button>
      </div>

      <div className="mb-4 inline-flex border border-neutral-200">
        <Button
          size="sm"
          variant={tab === 'upcoming' ? 'secondary' : 'ghost'}
          className="rounded-none"
          onClick={() => setTab('upcoming')}
        >
          Upcoming ({upcoming.length})
        </Button>
        <Button
          size="sm"
          variant={tab === 'past' ? 'secondary' : 'ghost'}
          className="rounded-none"
          onClick={() => setTab('past')}
        >
          Past ({past.length})
        </Button>
        <Button
          size="sm"
          variant={tab === 'series' ? 'secondary' : 'ghost'}
          className="rounded-none"
          onClick={() => setTab('series')}
        >
          Series
        </Button>
      </div>

      {tab === 'series' ? (
        <MeetingSeriesView projectId={projectId} />
      ) : (
        <div className="border border-neutral-200 bg-white">
          <DataTable
            ariaLabel={`${tab} project meetings`}
            rows={visibleMeetings}
            rowKey={(meeting) => meeting.id}
            emptyMessage={`No ${tab} meetings`}
            columns={[
              {
                id: 'title',
                header: 'Title',
                cell: (meeting) => (
                  <button
                    type="button"
                    className="text-left font-medium text-neutral-900 hover:underline"
                    onClick={() => openMeeting(meeting.id)}
                  >
                    {meeting.title}
                  </button>
                ),
              },
              {
                id: 'start',
                header: 'Start',
                accessor: (meeting) => formatDateTime(meeting.startAt),
              },
              {
                id: 'location',
                header: 'Location',
                accessor: (meeting) => meeting.location ?? '—',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (meeting) => (
                  <Badge variant="solid" tone={meetingStatusTone(meeting.status)}>
                    {meetingStatusLabel(meeting.status)}
                  </Badge>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (meeting) => (
                  <Stack direction="horizontal" spacing="sm">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => openMeeting(meeting.id)}
                    >
                      Open
                    </button>
                  </Stack>
                ),
              },
            ]}
          />
        </div>
      )}

      <CreateMeetingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createMeeting(body)
            toast.success('Meeting scheduled')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
