'use client'

import { useMemo } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, ArrowRight, ListTodo, Settings } from 'lucide-react'
import { Typography, Button, PageSkeleton, Stack, Badge } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { ROUTES } from '@/constants/routes'
import { useProject } from '../hooks/useProject'
import { useProjectLifecycle } from '../hooks/useProjectLifecycle'
import { useProjectPhases } from '../../phase/presentation/hooks/useProjectPhases'
import { useProjectTasks } from '../../task/presentation/hooks/useProjectTasks'
import { ProjectStatusBadge } from '../presentation/ui/ProjectStatusBadge'
import { ProjectLifecycleMenu } from '../presentation/ui/ProjectLifecycleMenu'
import { TaskStatus } from '../domain/enums/project.enum'
import {
  isTaskOverdue,
  taskStatusLabel,
} from '../../task/domain/rules/task.rules'
import { phaseStatusLabel } from '../../phase/domain/rules/phase.rules'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ProjectOverviewView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project, loading, error, refetch } = useProject(workspaceId, projectId)
  const { peopleById } = useResolveUsers([project?.ownerUserId])
  const { actingId, runLifecycle } = useProjectLifecycle(() => {
    void refetch()
  })
  const { phases, loading: phasesLoading } = useProjectPhases(projectId)
  const { tasks, loading: tasksLoading, forbidden } = useProjectTasks(projectId)

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {
      [TaskStatus.Todo]: 0,
      [TaskStatus.InProgress]: 0,
      [TaskStatus.Blocked]: 0,
      [TaskStatus.Completed]: 0,
    }
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    }
    return counts
  }, [tasks])

  const attention = useMemo(() => {
    return tasks.filter(
      (t) => t.status === TaskStatus.Blocked || isTaskOverdue(t)
    )
  }, [tasks])

  if (loading || phasesLoading || tasksLoading) {
    return <PageSkeleton variant="detail" />
  }

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this project</Typography>
        <Typography tone="muted" className="mt-2">
          Ask a workspace admin to grant access.
        </Typography>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div>
        <Typography tone="error">{error ?? 'Project not found'}</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={{ id: projectId, name: project.name }}
        className="mb-4"
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Stack direction="horizontal" spacing="sm" className="mb-2 items-center">
            <Typography variant="small" className="font-mono text-neutral-600">
              {project.code}
            </Typography>
            <ProjectStatusBadge status={project.status} />
          </Stack>
          <Typography as="h1" size="lg" weight="semibold">
            {project.name}
          </Typography>
          {project.description ? (
            <Typography tone="muted" className="mt-2 max-w-2xl">
              {project.description}
            </Typography>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Typography variant="small" tone="muted">
              Owner
            </Typography>
            <UserIdentity
              userId={project.ownerUserId}
              person={project.ownerUserId ? peopleById[project.ownerUserId] : null}
              size="xs"
              compact
            />
            <Typography variant="small" tone="muted">
              · {formatDate(project.plannedStartDate)} → {formatDate(project.plannedEndDate)} ·{' '}
              {project.defaultCurrency ?? '—'}
            </Typography>
          </div>
        </div>
        <Stack direction="horizontal" spacing="sm" className="items-center">
          <NextLink href={ROUTES.workspace.projectWork(workspaceId, projectId)}>
            <Button variant="secondary" icon={<ListTodo size={16} />}>
              Work items
            </Button>
          </NextLink>
          <NextLink href={ROUTES.workspace.projectSettings(workspaceId, projectId)}>
            <Button variant="ghost" icon={<Settings size={16} />}>
              Settings
            </Button>
          </NextLink>
          <ProjectLifecycleMenu
            status={project.status}
            loading={actingId === project.id}
            onAction={async (action) => {
              await runLifecycle(project.id, action)
            }}
          />
        </Stack>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            TaskStatus.Todo,
            TaskStatus.InProgress,
            TaskStatus.Blocked,
            TaskStatus.Completed,
          ] as const
        ).map((status) => (
          <div key={status} className="border border-neutral-200 bg-white p-4">
            <Typography variant="small" tone="muted">
              {taskStatusLabel(status)}
            </Typography>
            <Typography as="p" size="xl" weight="bold" className="mt-1">
              {taskCounts[status] ?? 0}
            </Typography>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-neutral-200 bg-white p-5">
          <Stack direction="horizontal" spacing="sm" className="mb-4 items-center">
            <AlertTriangle size={16} className="text-warning" />
            <Typography as="h2" weight="semibold">
              Attention required
            </Typography>
          </Stack>
          {attention.length === 0 ? (
            <Typography tone="muted" variant="small">
              No overdue or blocked tasks.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {attention.slice(0, 8).map((t) => (
                <li key={t.id}>
                  <NextLink
                    href={ROUTES.workspace.projectWorkTask(workspaceId, projectId, t.id)}
                    className="flex items-center justify-between gap-2 text-sm hover:underline"
                  >
                    <span className="min-w-0 truncate">
                      <Typography as="span" variant="small" tone="muted" className="font-mono">
                        {t.code}
                      </Typography>{' '}
                      {t.title}
                    </span>
                    <Badge
                      variant="solid"
                      tone={t.status === TaskStatus.Blocked ? 'warning' : 'error'}
                    >
                      {t.status === TaskStatus.Blocked ? 'Blocked' : 'Overdue'}
                    </Badge>
                  </NextLink>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-neutral-200 bg-white p-5">
          <Typography as="h2" weight="semibold" className="mb-4">
            Phases
          </Typography>
          {phases.length === 0 ? (
            <Typography tone="muted" variant="small">
              No phases yet. Add them in project settings.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {phases
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((ph) => (
                  <li
                    key={ph.id}
                    className="flex items-center justify-between gap-2 border-b border-neutral-100 py-2 last:border-0"
                  >
                    <div>
                      <Typography weight="medium">{ph.name}</Typography>
                      <Typography variant="small" tone="muted" className="font-mono">
                        {ph.code}
                      </Typography>
                    </div>
                    <Badge tone="neutral">{phaseStatusLabel(ph.status)}</Badge>
                  </li>
                ))}
            </ul>
          )}
          <NextLink
            href={ROUTES.workspace.projectSettings(workspaceId, projectId)}
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Manage phases <ArrowRight size={14} />
          </NextLink>
        </section>
      </div>

      <section className="border border-neutral-200 bg-white p-5">
        <Typography as="h2" weight="semibold" className="mb-2">
          Quick links
        </Typography>
        <Stack direction="horizontal" spacing="md" className="flex-wrap">
          <NextLink
            href={ROUTES.workspace.projectWork(workspaceId, projectId)}
            className="text-sm text-primary hover:underline"
          >
            Work items
          </NextLink>
          <NextLink
            href={ROUTES.workspace.projectWork(workspaceId, projectId, 'board')}
            className="text-sm text-primary hover:underline"
          >
            Board
          </NextLink>
          <NextLink
            href={ROUTES.workspace.projectSettings(workspaceId, projectId)}
            className="text-sm text-primary hover:underline"
          >
            Settings
          </NextLink>
          <NextLink
            href={ROUTES.workspace.sessions(workspaceId, projectId)}
            className="text-sm text-neutral-600 hover:underline"
          >
            Elicitation sessions
          </NextLink>
        </Stack>
      </section>
    </div>
  )
}
