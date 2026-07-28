'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Plus } from 'lucide-react'
import {
  Typography,
  Button,
  Input,
  Select,
  PageSkeleton,
  Stack,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { useProjects } from '../hooks/useProjects'
import { useProjectLifecycle } from '../hooks/useProjectLifecycle'
import { useAppShellAuthorization } from '@/modules/auth/iam'
import { CreateProjectModal } from './CreateProjectModal'
import { ProjectStatusBadge } from '../presentation/ui/ProjectStatusBadge'
import { ProjectLifecycleMenu } from '../presentation/ui/ProjectLifecycleMenu'
import { ProjectStatus } from '../domain/enums/project.enum'
import { allowedProjectLifecycleActions } from '../domain/rules/project.rules'
import type { Project } from '../model/project'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: ProjectStatus.Draft, label: 'Draft' },
  { value: ProjectStatus.Active, label: 'Active' },
  { value: ProjectStatus.OnHold, label: 'On hold' },
  { value: ProjectStatus.Completed, label: 'Completed' },
  { value: ProjectStatus.Archived, label: 'Archived' },
]

const SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Updated (newest)' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'planned_start_asc', label: 'Planned start' },
]

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function sortProjects(items: Project[], sort: string): Project[] {
  const copy = [...items]
  if (sort === 'name_asc') {
    copy.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'planned_start_asc') {
    copy.sort((a, b) => (a.plannedStartDate ?? '').localeCompare(b.plannedStartDate ?? ''))
  } else {
    copy.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
  }
  return copy
}

function ProjectsContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('updated_desc')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { projects, loading, error, listProjects } = useProjects(workspaceId)
  const { canCreateProjects } = useAppShellAuthorization(workspaceId)
  const ownerIds = useMemo(() => projects.map((p) => p.ownerUserId), [projects])
  const { peopleById } = useResolveUsers(ownerIds)
  const { actingId, runLifecycle } = useProjectLifecycle(() => {
    void listProjects(workspaceId)
  })

  useEffect(() => {
    if (canCreateProjects && searchParams.get('create') === '1') setCreateModalOpen(true)
  }, [searchParams, canCreateProjects])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    let items = projects
    if (statusFilter) items = items.filter((p) => p.status === statusFilter)
    if (q) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
      )
    }
    return sortProjects(items, sort)
  }, [projects, keyword, statusFilter, sort])

  const handleProjectCreated = (projectId: string) => {
    setCreateModalOpen(false)
    window.location.href = ROUTES.workspace.projectOverview(workspaceId, projectId)
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} className="mb-4" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Projects
        </Typography>
        {canCreateProjects ? (
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-neutral-900"
            icon={<Plus size={18} />}
          >
            New project
          </Button>
        ) : null}
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-4 flex-wrap items-center">
        <div className="w-56 shrink-0">
          <Input
            fullWidth
            placeholder="Search name or code…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={STATUS_OPTIONS}
          className="w-40"
          placeholder="Status"
        />
        <Select
          value={sort}
          onValueChange={setSort}
          options={SORT_OPTIONS}
          className="w-48"
          placeholder="Sort"
        />
        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            iconOnly
            aria-label="Table view"
            onClick={() => setViewMode('table')}
            icon={<List size={16} />}
          />
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            iconOnly
            aria-label="Card view"
            onClick={() => setViewMode('cards')}
            icon={<LayoutGrid size={16} />}
          />
        </div>
      </Stack>

      {loading ? (
        <PageSkeleton variant="list" />
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center">
          <Typography as="h2" weight="medium" className="mb-2">
            No projects yet
          </Typography>
          <Typography tone="muted" className="mb-6">
            {canCreateProjects
              ? 'Create your first project to get started.'
              : 'No projects in this workspace yet.'}
          </Typography>
          {canCreateProjects ? (
            <Button variant="primary" onClick={() => setCreateModalOpen(true)} icon={<Plus size={16} />}>
              Create project
            </Button>
          ) : null}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <NextLink
              key={p.id}
              href={ROUTES.workspace.projectOverview(workspaceId, p.id)}
              className="block border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <Typography variant="small" className="font-mono text-neutral-600">
                  {p.code}
                </Typography>
                <ProjectStatusBadge status={p.status} />
              </div>
              <Typography weight="semibold" className="mb-1">
                {p.name}
              </Typography>
              <Typography variant="small" tone="muted">
                Updated {formatDate(p.updatedAt)}
              </Typography>
            </NextLink>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Planned start</th>
                <th className="px-4 py-3 font-medium">Planned end</th>
                <th className="px-4 py-3 font-medium">Currency</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="min-w-[14rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <NextLink
                      href={ROUTES.workspace.projectOverview(workspaceId, p.id)}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {p.name}
                    </NextLink>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{p.code}</td>
                  <td className="px-4 py-3">
                    <UserIdentity
                      userId={p.ownerUserId}
                      person={p.ownerUserId ? peopleById[p.ownerUserId] : null}
                      size="xs"
                      compact
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(p.plannedStartDate)}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(p.plannedEndDate)}</td>
                  <td className="px-4 py-3 text-neutral-600">{p.defaultCurrency ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(p.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="sm" className="items-center">
                      <NextLink
                        href={ROUTES.workspace.projectOverview(workspaceId, p.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        Open
                      </NextLink>
                      {allowedProjectLifecycleActions(p.status).length > 0 && (
                        <ProjectLifecycleMenu
                          status={p.status}
                          loading={actingId === p.id}
                          onAction={async (action) => {
                            await runLifecycle(p.id, action)
                          }}
                        />
                      )}
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canCreateProjects ? (
        <CreateProjectModal
          workspaceId={workspaceId}
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleProjectCreated}
        />
      ) : null}
    </div>
  )
}

export function ProjectsListView() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" />}>
      <ProjectsContent />
    </Suspense>
  )
}
