'use client'

import { Eye, Plus } from 'lucide-react'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Box,
  Button,
  Card,
  DataTable,
  Input,
  Typography,
  Stack,
  Select,
  Badge,
  Modal,
  Textarea,
  PageSkeleton,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useProjects } from '@/modules/projects/project/hooks/useProjects'
import { useControlledLists } from '@/modules/controlled-lists'
import type { ControlledList } from '@/modules/controlled-lists'
import type { Project } from '@/modules/projects/project/model/project'

// const PAGE_SIZE = 50  // reserved for pagination

function formatUpdatedAt(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function normalizeListKey(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

export function OrgControlledListsView() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = (params?.workspaceId as string) ?? ''
  const projectFromQuery = searchParams.get('projectId')

  const { projects, loading: projectsLoading, error: projectsError, listProjects } = useProjects()

  const {
    lists,
    loading: listsLoading,
    error: listsError,
    listControlledLists,
    createControlledList,
  } = useControlledLists()

  const [projectId, setProjectId] = useState<string | null>(projectFromQuery)
  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createListKey, setCreateListKey] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createLocked, setCreateLocked] = useState(false)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!orgId) return
    listProjects(orgId)
  }, [orgId, listProjects])

  useEffect(() => {
    if (projectFromQuery) {
      setProjectId(projectFromQuery)
      return
    }
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id)
    }
  }, [projectFromQuery, projectId, projects])

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [projects]
  )

  const selectedProject: Project | undefined = useMemo(
    () => (projectId ? projects.find((p) => p.id === projectId) : undefined),
    [projects, projectId]
  )

  useEffect(() => {
    if (!orgId || !projectId) return
    listControlledLists(orgId, projectId)
  }, [orgId, projectId, listControlledLists])

  const filteredLists: ControlledList[] = useMemo(() => {
    if (!searchQuery.trim()) return lists
    const q = searchQuery.trim().toLowerCase()
    return lists.filter((l) => {
      const key = l.list_key?.toLowerCase() ?? ''
      const name = l.name?.toLowerCase() ?? ''
      return key.includes(q) || name.includes(q)
    })
  }, [lists, searchQuery])

  const hasProjectContext = !!selectedProject

  const validateCreate = useCallback((): boolean => {
    const next: Record<string, string> = {}
    if (!createListKey.trim()) {
      next.list_key = 'List key is required'
    }
    if (!createName.trim()) {
      next.name = 'Name is required'
    }
    setCreateErrors(next)
    return Object.keys(next).length === 0
  }, [createListKey, createName])

  const handleCreateSubmit = useCallback(async () => {
    if (!validateCreate() || !orgId || !projectId) return
    try {
      const payload = {
        list_key: normalizeListKey(createListKey),
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        locked: createLocked,
      }
      const created = await createControlledList(orgId, projectId, payload)
      toast.success('Controlled list created')
      setCreateModalOpen(false)
      setCreateListKey('')
      setCreateName('')
      setCreateDescription('')
      setCreateLocked(false)
      if (!created) return
      const detailHref = ROUTES.workspace.settingsControlledListDetail(orgId, created.id, projectId)
      // Navigate using location to avoid importing router hook.
      if (typeof window !== 'undefined') {
        window.location.href = detailHref
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create controlled list'
      toast.error(msg)
      setCreateErrors((prev) => ({ ...prev, form: msg }))
    }
  }, [
    validateCreate,
    orgId,
    projectId,
    createListKey,
    createName,
    createDescription,
    createLocked,
    createControlledList,
  ])

  const createDisabled = !hasProjectContext

  return (
    <main className="min-h-screen p-8">
      <Card className="mx-auto max-w-5xl p-xl">
        <Stack direction="vertical" spacing="lg">
          <Stack
            direction="horizontal"
            justify="between"
            align="center"
            className="flex-wrap gap-md"
          >
            <Stack direction="vertical" spacing="xs">
              <Typography as="h1" size="2xl" weight="bold">
                Controlled lists
              </Typography>
              <Typography tone="muted" variant="small">
                Admin-only configuration.{' '}
                <span className="font-medium">
                  TODO: Restrict this page to admin users when RBAC is wired.
                </span>
              </Typography>
            </Stack>
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              disabled={createDisabled}
              aria-label="Create controlled list"
              icon={<Plus size={16} />}
            >
              Create list
            </Button>
          </Stack>

          <Stack direction="vertical" spacing="md">
            <Stack direction="horizontal" spacing="md" className="flex-wrap">
              <div className="min-w-[220px]">
                <Select
                  options={projectOptions}
                  value={projectId ?? ''}
                  onValueChange={(v: string) => setProjectId(v || null)}
                  placeholder="Select project"
                />
              </div>
              <Input
                placeholder="Search by list key or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-[200px] max-w-xs"
                aria-label="Search controlled lists"
                disabled={!hasProjectContext}
              />
            </Stack>

            {(projectsError || listsError) && (
              <Typography tone="error" role="alert">
                {projectsError ?? listsError}
              </Typography>
            )}
            {(projectsLoading || listsLoading) && projects.length === 0 && (
              <Box display="flex" className="justify-center py-lg">
                <PageSkeleton variant="list" />
              </Box>
            )}

            {!hasProjectContext && !projectsLoading && (
              <Card className="border border-neutral-200 bg-neutral-50 p-lg text-center">
                <Typography tone="muted" className="mb-sm">
                  Select a project to manage controlled lists.
                </Typography>
                <Typography variant="small" tone="muted">
                  Once backend endpoints are available, lists for the selected project will appear
                  here.
                </Typography>
              </Card>
            )}

            {hasProjectContext && (
              <>
                <DataTable
                  ariaLabel="Controlled lists"
                  rows={filteredLists}
                  rowKey={(list) => list.id}
                  emptyMessage="No controlled lists to display yet. Create the first controlled list for this project."
                  columns={[
                    {
                      id: 'key',
                      header: 'Key',
                      accessor: (list) => list.list_key || '—',
                      kind: 'code',
                    },
                    {
                      id: 'name',
                      header: 'Name',
                      cell: (list) => (
                        <>
                          <Typography>{list.name ?? '—'}</Typography>
                          {list.description ? (
                            <Typography variant="small" tone="muted" className="mt-0.5">
                              {list.description}
                            </Typography>
                          ) : null}
                        </>
                      ),
                    },
                    {
                      id: 'locked',
                      header: 'Locked',
                      cell: (list) => {
                        const locked =
                          (typeof list.locked === 'boolean' && list.locked) ||
                          (typeof list.is_locked === 'boolean' && list.is_locked)
                        return (
                          <Badge tone={locked ? 'warning' : 'success'} variant="soft">
                            {locked ? 'Locked' : 'Unlocked'}
                          </Badge>
                        )
                      },
                    },
                    {
                      id: 'updated',
                      header: 'Updated',
                      accessor: (list) => formatUpdatedAt(list.updated_at),
                    },
                    {
                      id: 'actions',
                      header: 'Actions',
                      cell: (list) => (
                        <Link
                          href={ROUTES.workspace.settingsControlledListDetail(
                            orgId,
                            list.id,
                            projectId ?? undefined
                          )}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </Stack>
        </Stack>
      </Card>

      <Modal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setCreateErrors({})
        }}
        title="Create controlled list"
        size="md"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setCreateModalOpen(false),
            variant: 'ghost',
          },
          {
            label: 'Create',
            onClick: handleCreateSubmit,
            variant: 'primary',
            disabled: createDisabled,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <Input
            label="List key"
            type="text"
            required
            value={createListKey}
            onChange={(e) => setCreateListKey(e.target.value)}
            error={createErrors.list_key}
            placeholder="E.g. STATUS_CODES"
            fullWidth
          />
          {createListKey.trim() && (
            <Typography variant="small" tone="muted">
              Normalized key:&nbsp;
              <span className="font-mono">{normalizeListKey(createListKey)}</span>
            </Typography>
          )}
          <Input
            label="Name"
            type="text"
            required
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            error={createErrors.name}
            placeholder="Human-friendly name"
            fullWidth
          />
          <Textarea
            label="Description (optional)"
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            placeholder="Explain how this list is used"
            fullWidth
          />
          <Stack direction="horizontal" spacing="sm" align="center">
            <Badge tone={createLocked ? 'warning' : 'success'} variant="soft">
              {createLocked ? 'Locked' : 'Unlocked'}
            </Badge>
            <Button
              variant="outline"
              onClick={() => setCreateLocked((v) => !v)}
              aria-pressed={createLocked}
              icon={<Eye size={16} />}
            >
              Toggle locked
            </Button>
          </Stack>
          {createErrors.form && (
            <Typography variant="small" tone="error" role="alert">
              {createErrors.form}
            </Typography>
          )}
        </Stack>
      </Modal>
    </main>
  )
}
