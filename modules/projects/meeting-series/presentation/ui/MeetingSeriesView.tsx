'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
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

function seriesStatusTone(
  status: string
): 'success' | 'warning' | 'neutral' {
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
        <Typography weight="medium">You don't have access to meeting series</Typography>
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

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Recurrence</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next Occurrence</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {series.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No meeting series yet
                </td>
              </tr>
            ) : (
              series.map((s) => (
                <tr key={s.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{s.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                    {s.recurrenceRule}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={seriesStatusTone(s.status)}>
                      {seriesStatusLabel(s.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(s.nextOccurrenceAt)}</td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="sm">
                      {s.status === SeriesStatus.Active ? (
                        <button
                          type="button"
                          className="text-sm text-warning-600 hover:underline disabled:opacity-50"
                          disabled={actingId === s.id}
                          onClick={async () => {
                            try {
                              await pause(s.id)
                              toast.success('Series paused')
                            } catch (err) {
                              toast.error(getProblemToastMessage(err))
                            }
                          }}
                        >
                          Pause
                        </button>
                      ) : null}
                      {s.status !== SeriesStatus.Archived ? (
                        <button
                          type="button"
                          className="text-sm text-neutral-500 hover:underline disabled:opacity-50"
                          disabled={actingId === s.id}
                          onClick={async () => {
                            try {
                              await archive(s.id)
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
