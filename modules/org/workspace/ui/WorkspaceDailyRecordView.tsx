'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge, Card, ContentLoader, Typography } from '@/shared/ui'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import { useWorkspaceDailySummary } from '../hooks/useWorkspaceDailySummary'
import type { DailySummaryTask, MemberDailySummary } from '../model/workspace-daily-summary'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function WorkspaceDailyRecordView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const [date, setDate] = useState(todayIso())
  const { data, loading, error } = useWorkspaceDailySummary(workspaceId, date)

  const userIds = data?.members.map((m) => m.userId) ?? []
  const { labelFor } = useResolveUsers(userIds)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Daily Record
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Tasks done and in progress per member
          </Typography>
        </div>
        <input
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          className="h-8 border border-neutral-300 bg-white px-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <ContentLoader />
      ) : error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : !data || data.members.length === 0 ? (
        <div className="py-16 text-center">
          <Typography tone="muted" variant="small">
            No member activity recorded for {formatDate(date)}.
          </Typography>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.members.map((member) => (
            <MemberCard
              key={member.userId}
              member={member}
              name={labelFor(member.userId)}
              workspaceId={workspaceId}
              onNavigate={(projectId) =>
                router.push(WORKSPACE_ROUTES.projectDashboard(workspaceId, projectId))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MemberCard({
  member,
  name,
  onNavigate,
}: {
  member: MemberDailySummary
  name: string
  workspaceId: string
  onNavigate: (projectId: string) => void
}) {
  const totalDone = member.done.length
  const totalInProgress = member.inProgress.length

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <Typography weight="semibold" className="truncate text-neutral-900">
          {name}
        </Typography>
        <div className="flex shrink-0 items-center gap-1.5">
          {totalDone > 0 && (
            <Badge variant="solid" tone="success" size="sm">
              {totalDone} done
            </Badge>
          )}
          {totalInProgress > 0 && (
            <Badge variant="solid" tone="info" size="sm">
              {totalInProgress} active
            </Badge>
          )}
        </div>
      </div>

      {totalDone === 0 && totalInProgress === 0 ? (
        <div className="px-4 py-6 text-center">
          <Typography variant="small" tone="muted">
            No tasks
          </Typography>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {member.done.length > 0 && (
            <TaskGroup label="Done" tasks={member.done} tone="success" onNavigate={onNavigate} />
          )}
          {member.inProgress.length > 0 && (
            <TaskGroup
              label="In Progress"
              tasks={member.inProgress}
              tone="info"
              onNavigate={onNavigate}
            />
          )}
        </div>
      )}
    </Card>
  )
}

function TaskGroup({
  label,
  tasks,
  tone,
  onNavigate,
}: {
  label: string
  tasks: DailySummaryTask[]
  tone: 'success' | 'info'
  onNavigate: (projectId: string) => void
}) {
  return (
    <div className="px-4 py-2">
      <Typography variant="small" tone="muted" className="mb-1.5 text-xs uppercase tracking-wide">
        {label}
      </Typography>
      <ul className="space-y-1.5">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => onNavigate(task.projectId)}
            >
              <div className="flex items-start gap-1.5">
                <span
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'success' ? 'bg-success' : 'bg-info'}`}
                />
                <div className="min-w-0">
                  <Typography
                    variant="small"
                    weight="medium"
                    className="truncate text-neutral-900 hover:text-primary"
                  >
                    {task.title}
                  </Typography>
                  <Typography variant="small" tone="muted" className="truncate text-xs">
                    {task.code} · {task.projectName}
                    {task.phaseName ? ` · ${task.phaseName}` : ''}
                    {task.estimateHours != null ? ` · ${task.estimateHours}h` : ''}
                  </Typography>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
