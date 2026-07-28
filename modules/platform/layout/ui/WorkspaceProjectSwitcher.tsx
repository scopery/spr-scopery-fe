'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useRouter } from 'next/navigation'
import { Input, Link as DesignLink, Typography } from '@/shared/ui'

import { createPortal } from 'react-dom'
import NextLink from 'next/link'
import { Check, Plus, Search } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import type { WorkspaceListItem } from '@/modules/auth/workspace-context/model/interfaces/workspace-context'
import { CreateWorkspaceModal } from '@/modules/org/workspace'
import * as projectsApi from '@/modules/projects/project/api/projects.api'
import { cn } from '@/utils/cn'

interface ProjectOption {
  id: string
  name: string
  code: string
}

export interface WorkspaceProjectSwitcherProps {
  open: boolean
  onClose: () => void
  workspaces: WorkspaceListItem[]
  currentWorkspaceId: string
  currentProjectId: string | null
  switching?: boolean
  onSwitchWorkspace: (workspaceId: string) => Promise<void>
  /** Anchor element — panel opens to the right of this */
  anchorRef: RefObject<HTMLElement | null>
  className?: string
}

function groupByOrg(workspaces: WorkspaceListItem[]) {
  const groups = new Map<string, { label: string; items: WorkspaceListItem[] }>()
  for (const workspace of workspaces) {
    const key = workspace.organizationId
    const label = workspace.organizationName ?? workspace.organizationId
    const existing = groups.get(key)
    if (existing) existing.items.push(workspace)
    else groups.set(key, { label, items: [workspace] })
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function WorkspaceProjectSwitcher({
  open,
  onClose,
  workspaces,
  currentWorkspaceId,
  currentProjectId,
  switching,
  onSwitchWorkspace,
  anchorRef,
  className,
}: WorkspaceProjectSwitcherProps) {
  const router = useRouter()
  const { refreshBootstrap, switchWorkspace } = useAuth()
  const [query, setQuery] = useState('')
  const [projectsByWorkspace, setProjectsByWorkspace] = useState<Record<string, ProjectOption[]>>(
    {}
  )
  const [loadingWorkspaceId, setLoadingWorkspaceId] = useState<string | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const loadingRef = useRef(new Set<string>())

  const groups = useMemo(() => groupByOrg(workspaces), [workspaces])

  const organizationOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const workspace of workspaces) {
      if (!map.has(workspace.organizationId)) {
        map.set(
          workspace.organizationId,
          workspace.organizationName ?? workspace.organizationId
        )
      }
    }
    return [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [workspaces])

  const defaultOrganizationId = useMemo(() => {
    const current = workspaces.find((w) => w.id === currentWorkspaceId)
    return current?.organizationId ?? organizationOptions[0]?.id ?? null
  }, [workspaces, currentWorkspaceId, organizationOptions])

  const handleCreated = useCallback(
    async (workspaceId: string) => {
      await switchWorkspace(workspaceId)
      await refreshBootstrap()
      router.push(ROUTES.workspace.projects(workspaceId))
    },
    [refreshBootstrap, switchWorkspace, router]
  )

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const panelWidth = Math.min(320, window.innerWidth - 16)
    let left = rect.right + 8
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, rect.left - panelWidth - 8)
    }
    let top = rect.top
    const maxHeight = Math.min(420, window.innerHeight - 16)
    if (top + maxHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - maxHeight - 8)
    }
    setPosition({ top, left })
  }, [anchorRef])

  const loadProjects = useCallback(async (targetWorkspaceId: string) => {
    if (loadingRef.current.has(targetWorkspaceId)) return
    loadingRef.current.add(targetWorkspaceId)
    setLoadingWorkspaceId(targetWorkspaceId)
    try {
      const res = await projectsApi.listProjects(targetWorkspaceId, { page: 0, size: 8 })
      setProjectsByWorkspace((prev) => ({
        ...prev,
        [targetWorkspaceId]: res.items.map((p) => ({ id: p.id, name: p.name, code: p.code })),
      }))
    } catch {
      setProjectsByWorkspace((prev) => ({ ...prev, [targetWorkspaceId]: [] }))
    } finally {
      setLoadingWorkspaceId(null)
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    setQuery('')
    void loadProjects(currentWorkspaceId)
  }, [open, currentWorkspaceId, loadProjects])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (anchorRef.current?.contains(target)) return
      const panel = document.querySelector('[data-workspace-project-switcher]')
      if (panel?.contains(target)) return
      onClose()
    }
    const onReposition = () => updatePosition()
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, onClose, updatePosition, anchorRef])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((w) => {
          const projects = projectsByWorkspace[w.id] ?? []
          const hitWorkspace = `${w.name} ${w.code} ${group.label}`.toLowerCase().includes(q)
          const hitProject = projects.some((p) =>
            `${p.name} ${p.code}`.toLowerCase().includes(q)
          )
          return hitWorkspace || hitProject
        }),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, query, projectsByWorkspace])

  const createModal = (
    <CreateWorkspaceModal
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      organizations={organizationOptions}
      defaultOrganizationId={defaultOrganizationId}
      onSuccess={handleCreated}
    />
  )

  if ((!open || !position) && !createOpen) return null
  if (typeof document === 'undefined') return null

  if (!open || !position) {
    return createPortal(createModal, document.body)
  }

  return createPortal(
    <>
    <div
      role="menu"
      data-workspace-project-switcher
      className={cn(
        'fixed z-[100] w-[min(20rem,calc(100vw-2rem))] border border-neutral-200 bg-white shadow-xl motion-switcher-pop',
        className
      )}
      style={{ top: position.top, left: position.left }}
    >
        <div className="border-b border-neutral-100 p-2">
          <label className="relative block">
            <Search
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <Input
              fullWidth
              size="sm"
              placeholder="Search workspace or project…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </label>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredGroups.length === 0 ? (
            <Typography variant="small" tone="muted" className="px-2 py-3">
              No matches
            </Typography>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.label} className="mb-3">
                <Typography
                  as="p"
                  variant="small"
                  tone="muted"
                  weight="medium"
                  className="px-2 pb-1 text-[11px] uppercase tracking-wide"
                >
                  {group.label}
                </Typography>
                {group.items.map((workspace) => {
                  const isCurrentWs = workspace.id === currentWorkspaceId
                  const projects = projectsByWorkspace[workspace.id] ?? []
                  const q = query.trim().toLowerCase()
                  const visibleProjects = q
                    ? projects.filter((p) =>
                        `${p.name} ${p.code}`.toLowerCase().includes(q)
                      )
                    : projects

                  return (
                    <div key={workspace.id} className="mb-1">
                      <button
                        type="button"
                        role="menuitem"
                        disabled={switching}
                        onClick={() => {
                          onClose()
                          if (isCurrentWs) {
                            router.push(ROUTES.workspace.projects(workspace.id))
                            return
                          }
                          void onSwitchWorkspace(workspace.id)
                        }}
                        onMouseEnter={() => void loadProjects(workspace.id)}
                        onFocus={() => void loadProjects(workspace.id)}
                        className={cn(
                          'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm motion-colors hover:bg-neutral-50',
                          isCurrentWs && 'bg-neutral-50'
                        )}
                      >
                        <Typography as="span" weight="medium" className="min-w-0 flex-1 truncate">
                          {workspace.name}
                        </Typography>
                        {isCurrentWs ? (
                          <Check size={14} className="shrink-0 text-primary" />
                        ) : null}
                      </button>

                      <div className="ml-3 border-l border-neutral-100 pl-2">
                        {loadingWorkspaceId === workspace.id && projects.length === 0 ? (
                          <Typography variant="small" tone="muted" className="px-2 py-1">
                            Loading…
                          </Typography>
                        ) : null}
                        {visibleProjects.map((project) => {
                          const selected =
                            isCurrentWs && currentProjectId === project.id
                          return (
                            <button
                              key={project.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onClose()
                                if (!isCurrentWs) {
                                  void onSwitchWorkspace(workspace.id).then(() => {
                                    router.push(
                                      ROUTES.workspace.projectOverview(workspace.id, project.id)
                                    )
                                  })
                                } else {
                                  router.push(
                                    ROUTES.workspace.projectOverview(workspace.id, project.id)
                                  )
                                }
                              }}
                              className={cn(
                                'flex w-full items-center gap-2 px-2 py-1 text-left text-sm motion-colors hover:bg-neutral-50',
                                selected && 'bg-neutral-50 text-neutral-900'
                              )}
                            >
                              <Typography
                                as="span"
                                variant="small"
                                className="min-w-0 flex-1 truncate"
                              >
                                {project.name}
                              </Typography>
                              {selected ? (
                                <Check size={14} className="shrink-0 text-primary" />
                              ) : null}
                            </button>
                          )
                        })}
                        <DesignLink
                          as={NextLink}
                          href={ROUTES.workspace.projects(workspace.id)}
                          onClick={onClose}
                          className="block px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                          View all projects
                        </DesignLink>
                        <DesignLink
                          as={NextLink}
                          href={`${ROUTES.workspace.projects(workspace.id)}?create=1`}
                          onClick={onClose}
                          className="flex items-center gap-1 px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                          <Plus size={12} /> Create project
                        </DesignLink>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-neutral-100 p-2">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose()
              setCreateOpen(true)
            }}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          >
            <Plus size={14} /> Create workspace
          </button>
        </div>
      </div>
      {createModal}
    </>,
    document.body
  )
}
