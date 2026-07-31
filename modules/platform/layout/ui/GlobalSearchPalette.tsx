'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Bug,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  Inbox,
  LayoutDashboard,
  Rocket,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { Input, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import type { WorkspaceListItem } from '@/modules/auth/workspace-context/model/interfaces/workspace-context'
import * as projectsApi from '@/modules/projects/project/api/projects.api'
import { useGlobalSearch } from '@/modules/productivity'
import { cn } from '@/utils/cn'

export interface GlobalSearchPaletteProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  workspaces: WorkspaceListItem[]
  projectId?: string | null
}

type SearchHit = {
  id: string
  label: string
  hint?: string
  href: string
  icon: React.ReactNode
  group: string
}

export function GlobalSearchPalette({
  open,
  onClose,
  workspaceId,
  workspaces,
  projectId,
}: GlobalSearchPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [projectHits, setProjectHits] = useState<{ id: string; name: string; code: string }[]>(
    []
  )
  const { items: apiHits, search: searchApi, loading: searchLoading } = useGlobalSearch(workspaceId)

  useEffect(() => {
    if (!open) return
    setQuery('')
    let cancelled = false
    projectsApi
      .listProjects(workspaceId, { page: 0, size: 40 })
      .then((res) => {
        if (!cancelled) {
          setProjectHits(res.items.map((p) => ({ id: p.id, name: p.name, code: p.code })))
        }
      })
      .catch(() => {
        if (!cancelled) setProjectHits([])
      })
    return () => {
      cancelled = true
    }
  }, [open, workspaceId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !FEATURES.globalSearch) return
    const t = setTimeout(() => {
      void searchApi(query)
    }, 250)
    return () => clearTimeout(t)
  }, [open, query, searchApi])

  const navHits: SearchHit[] = useMemo(() => {
    const items: SearchHit[] = [
      {
        id: 'nav-overview',
        label: 'Workspace overview',
        href: ROUTES.workspace.root(workspaceId),
        icon: <LayoutDashboard size={14} />,
        group: 'Navigate',
      },
      {
        id: 'nav-projects',
        label: 'Projects',
        href: ROUTES.workspace.projects(workspaceId),
        icon: <FolderKanban size={14} />,
        group: 'Navigate',
      },
      {
        id: 'nav-docs',
        label: 'Document Hub',
        href: ROUTES.workspace.documentHub(
          workspaceId,
          projectId ? { projectId } : undefined
        ),
        icon: <FileText size={14} />,
        group: 'Navigate',
      },
      {
        id: 'nav-notifications',
        label: 'Notifications',
        href: ROUTES.workspace.notifications(workspaceId),
        icon: <Bell size={14} />,
        group: 'Navigate',
      },
      {
        id: 'nav-directory',
        label: 'Directory',
        href: ROUTES.workspace.directory(workspaceId),
        icon: <Users size={14} />,
        group: 'Navigate',
      },
      {
        id: 'nav-ai',
        label: 'AI Assistant',
        href: ROUTES.workspace.aiAssistant(workspaceId),
        icon: <Sparkles size={14} />,
        group: 'Navigate',
      },
    ]
    if (FEATURES.myWork) {
      items.push({
        id: 'nav-my-insights',
        label: 'My Insights',
        href: ROUTES.workspace.myInsights(workspaceId),
        icon: <ClipboardList size={14} />,
        group: 'Navigate',
      })
    }
    if (FEATURES.workInbox) {
      items.push({
        id: 'nav-inbox',
        label: 'Work Inbox',
        href: ROUTES.workspace.workInbox(workspaceId),
        icon: <Inbox size={14} />,
        group: 'Navigate',
      })
    }
    if (FEATURES.savedItems) {
      items.push({
        id: 'nav-saved',
        label: 'Saved items',
        href: ROUTES.workspace.savedItems(workspaceId),
        icon: <FileText size={14} />,
        group: 'Navigate',
      })
    }
    return items
  }, [workspaceId, projectId])

  /** Jump targets aligned with AppShell project nav (as-is). */
  const projectNavHits: SearchHit[] = useMemo(() => {
    if (!projectId) return []
    const pid = projectId
    const items: SearchHit[] = [
      {
        id: 'proj-overview',
        label: 'Project overview',
        href: ROUTES.workspace.projectOverview(workspaceId, pid),
        icon: <LayoutDashboard size={14} />,
        group: 'This project',
      },
      {
        id: 'proj-work',
        label: 'Work Items',
        href: ROUTES.workspace.projectWork(workspaceId, pid),
        icon: <ClipboardList size={14} />,
        group: 'This project',
      },
      {
        id: 'proj-requirements',
        label: 'Requirements',
        href: ROUTES.workspace.projectRequirements(workspaceId, pid),
        icon: <FileText size={14} />,
        group: 'This project',
      },
      {
        id: 'proj-traceability',
        label: 'Traceability',
        href: ROUTES.workspace.projectTraceability(workspaceId, pid),
        icon: <ClipboardList size={14} />,
        group: 'This project',
      },
      {
        id: 'proj-baselines',
        label: 'Baselines',
        href: ROUTES.workspace.projectBaselines(workspaceId, pid),
        icon: <FolderKanban size={14} />,
        group: 'This project',
      },
      {
        id: 'proj-change-requests',
        label: 'Change Requests',
        href: ROUTES.workspace.projectChangeRequests(workspaceId, pid),
        icon: <FileText size={14} />,
        group: 'This project',
      },
    ]

    if (FEATURES.quality) {
      if (FEATURES.qualitySimplifiedWorkflow) {
        items.push(
          {
            id: 'proj-quality',
            label: 'Quality overview',
            href: ROUTES.workspace.projectQuality(workspaceId, pid),
            icon: <Gauge size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-quality-cases',
            label: 'Quality · Cases',
            href: ROUTES.workspace.projectQualityCases(workspaceId, pid),
            icon: <ClipboardList size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-quality-runs',
            label: 'Quality · Runs',
            href: ROUTES.workspace.projectQualityRuns(workspaceId, pid),
            icon: <CalendarDays size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-quality-defects',
            label: 'Quality · Defects',
            href: ROUTES.workspace.projectQualityDefects(workspaceId, pid),
            icon: <Bug size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-quality-releases',
            label: 'Quality · Releases',
            href: ROUTES.workspace.projectQualityReleases(workspaceId, pid),
            icon: <Rocket size={14} />,
            group: 'This project',
          }
        )
      } else {
        items.push(
          {
            id: 'proj-quality',
            label: 'Quality',
            href: ROUTES.workspace.projectQuality(workspaceId, pid),
            icon: <Gauge size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-test-cases',
            label: 'Test Cases',
            href: ROUTES.workspace.projectTestCases(workspaceId, pid),
            icon: <ClipboardList size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-test-runs',
            label: 'Test Runs',
            href: ROUTES.workspace.projectTestRuns(workspaceId, pid),
            icon: <CalendarDays size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-defects',
            label: 'Defects',
            href: ROUTES.workspace.projectDefects(workspaceId, pid),
            icon: <Bug size={14} />,
            group: 'This project',
          },
          {
            id: 'proj-releases',
            label: 'Releases',
            href: ROUTES.workspace.projectReleases(workspaceId, pid),
            icon: <Rocket size={14} />,
            group: 'This project',
          }
        )
      }
    }

    return items
  }, [workspaceId, projectId])

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    const workspaceHits: SearchHit[] = workspaces.map((w) => ({
      id: `ws-${w.id}`,
      label: w.name,
      hint: w.organizationName ?? undefined,
      href: ROUTES.workspace.projects(w.id),
      icon: <FolderKanban size={14} />,
      group: 'Workspaces',
    }))
    const projHits: SearchHit[] = projectHits.map((p) => ({
      id: `pr-${p.id}`,
      label: p.name,
      hint: p.code,
      href: ROUTES.workspace.projectOverview(workspaceId, p.id),
      icon: <FolderKanban size={14} />,
      group: 'Projects',
    }))
    const remoteHits: SearchHit[] = apiHits.map((item) => ({
      id: `api-${item.kind}-${item.id}`,
      label: item.title,
      hint: [item.kind, item.subtitle].filter(Boolean).join(' · ') || undefined,
      href:
        item.href ??
        ROUTES.workspace.search(workspaceId) + `?q=${encodeURIComponent(item.title)}`,
      icon: <Search size={14} />,
      group: 'Results',
    }))
    const all = [...projectNavHits, ...navHits, ...workspaceHits, ...projHits, ...remoteHits]
    if (!q) {
      const defaults = [...projectNavHits, ...navHits]
      return defaults.slice(0, 16)
    }
    return all.filter(
      (h) =>
        h.label.toLowerCase().includes(q) ||
        (h.hint?.toLowerCase().includes(q) ?? false) ||
        h.group === 'Results'
    )
  }, [query, workspaces, projectHits, navHits, projectNavHits, workspaceId, apiHits])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchHit[]>()
    for (const hit of hits) {
      const list = map.get(hit.group) ?? []
      list.push(hit)
      map.set(hit.group, list)
    }
    return [...map.entries()]
  }, [hits])

  const go = useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router]
  )

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[110] bg-neutral-900/20" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-label="Search and command palette"
        className="fixed left-1/2 top-[12vh] z-[111] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 border border-neutral-200 bg-white shadow-xl"
      >
        <div className="border-b border-neutral-100 p-3">
          <Input
            fullWidth
            size="sm"
            autoFocus
            placeholder="Search or jump to a page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<Search size={16} className="text-neutral-400" aria-hidden />}
            aria-label="Command palette search"
          />
          <Typography variant="small" tone="muted" className="mt-2 px-1">
            Esc to close · ⌘K / Ctrl+K to open
            {searchLoading ? ' · Searching…' : ''}
          </Typography>
        </div>
        <div className="max-h-[min(24rem,50vh)] overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <Typography variant="small" tone="muted" className="px-2 py-4">
              No matches
            </Typography>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-2">
                <Typography
                  as="p"
                  variant="small"
                  tone="muted"
                  weight="medium"
                  className="px-2 pb-1 text-[11px] uppercase tracking-wide"
                >
                  {group}
                </Typography>
                <ul>
                  {items.map((hit) => (
                    <li key={hit.id}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2 rounded-none px-2 py-2 text-left text-sm motion-colors hover:bg-neutral-50'
                        )}
                        onClick={() => go(hit.href)}
                      >
                        <span className="shrink-0 text-neutral-500">{hit.icon}</span>
                        <span className="min-w-0 flex-1 truncate">{hit.label}</span>
                        {hit.hint ? (
                          <Typography as="span" variant="small" tone="muted" className="truncate">
                            {hit.hint}
                          </Typography>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
