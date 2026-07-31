'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, DataTable, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { SeriesStatus } from '../../domain/enums/meeting-series.enum'
import { useProjectMeetingSeries } from '../hooks/useProjectMeetingSeries'
import { CreateMeetingSeriesModal } from './CreateMeetingSeriesModal'

interface MeetingSeriesViewProps {
  projectId: string
}

function formatDate(iso: string | null | undefined) {
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

function seriesStatusTone(status: string): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case SeriesStatus.Active:
      return 'success'
    case SeriesStatus.Paused:
      return 'warning'
    default:
      return 'neutral'
  }
}

function seriesStatusLabel(status: string): string {
  switch (status) {
    case SeriesStatus.Active:
      return 'Active'
    case SeriesStatus.Paused:
      return 'Paused'
    case SeriesStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function MeetingSeriesView({ projectId }: MeetingSeriesViewProps) {
  const { series, loading, forbidden, actingId, createSeries, pause, archive } =
    useProjectMeetingSeries(projectId)
  const [createOpen, setCreateOpen] = useState(false)

  if (loading && series.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to meeting series</Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Typography as="h2" size="lg" weight="semibold">
          Meeting Series
        </Typography>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New series
        </Button>
      </div>

      <div className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Meeting series"
          rows={series}
          rowKey={(item) => item.id}
          emptyMessage="No meeting series yet"
          columns={[
            { id: 'title', header: 'Title', accessor: 'title' },
            { id: 'recurrence', header: 'Recurrence', accessor: 'recurrenceRule', kind: 'code' },
            {
              id: 'status',
              header: 'Status',
              cell: (item) => (
                <Badge tone={seriesStatusTone(item.status)}>{seriesStatusLabel(item.status)}</Badge>
              ),
            },
            {
              id: 'next',
              header: 'Next occurrence',
              accessor: (item) => formatDate(item.nextOccurrenceAt),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (item) => (
                <Stack direction="horizontal" spacing="sm">
                  {item.status === SeriesStatus.Active ? (
                    <button
                      type="button"
                      className="text-warning-600 text-sm hover:underline disabled:opacity-50"
                      disabled={actingId === item.id}
                      onClick={async () => {
                        try {
                          await pause(item.id)
                          toast.success('Series paused')
                        } catch (err) {
                          toast.error(getProblemToastMessage(err))
                        }
                      }}
                    >
                      Pause
                    </button>
                  ) : null}
                  {item.status !== SeriesStatus.Archived ? (
                    <button
                      type="button"
                      className="text-sm text-neutral-500 hover:underline disabled:opacity-50"
                      disabled={actingId === item.id}
                      onClick={async () => {
                        try {
                          await archive(item.id)
                          toast.success('Series archived')
                        } catch (err) {
                          toast.error(getProblemToastMessage(err))
                        }
                      }}
                    >
                      Archive
                    </button>
                  ) : null}
                </Stack>
              ),
            },
          ]}
        />
      </div>

      <CreateMeetingSeriesModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createSeries(body)
            toast.success('Meeting series created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
