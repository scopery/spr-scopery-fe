'use client'

import { useEffect, useMemo, useState } from 'react'
import { Select, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useProjects } from '@/modules/projects/project'
import { useOverallStructure } from '../hooks/useOverallStructure'
import {
  collapseAllExpandMap,
  defaultExpandMap,
  expandOneLevel,
  type StructureExpandMap,
  type StructureSearchHit,
} from '../model/structure-tree-search'
import { ContextualAssignmentDock } from './ContextualAssignmentDock'
import { OverallStructureCanvas } from './OverallStructureCanvas'
import { OverallStructureTree } from './OverallStructureTree'
import { StructureGapsPanel } from './StructureGapsPanel'
import { StructureToolbar } from './StructureToolbar'

export type StructureViewMode = 'structure' | 'canvas' | 'gaps'

interface OverallStructurePanelProps {
  workspaceId: string
  applicationId: string
  lockedProjectId?: string | null
  showProjectSelector?: boolean
  /** When true, show Structure / Canvas / Gaps switcher */
  showModeSwitcher?: boolean
  initialMode?: StructureViewMode
}

const MODES: { id: StructureViewMode; label: string }[] = [
  { id: 'structure', label: 'Structure' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'gaps', label: 'Gaps' },
]

export function OverallStructurePanel({
  workspaceId,
  applicationId,
  lockedProjectId = null,
  showProjectSelector = true,
  showModeSwitcher = false,
  initialMode = 'structure',
}: OverallStructurePanelProps) {
  const { projects, loading: projectsLoading } = useProjects(
    showProjectSelector && !lockedProjectId ? workspaceId : null
  )
  const [projectId, setProjectId] = useState<string | null>(lockedProjectId)
  const [mode, setMode] = useState<StructureViewMode>(initialMode)
  const [expandMap, setExpandMap] = useState<StructureExpandMap>({})
  const [scrollToFocusId, setScrollToFocusId] = useState<string | null>(null)

  useEffect(() => {
    if (lockedProjectId) setProjectId(lockedProjectId)
  }, [lockedProjectId])

  useEffect(() => {
    // Auto-pick first project so Function/NFR catalog loads (BE candidates omit them).
    if (!lockedProjectId && !projectId && projects[0]?.id) {
      setProjectId(projects[0].id)
    }
  }, [projects, projectId, lockedProjectId])

  const {
    tree,
    candidates,
    focus,
    setFocus,
    loading,
    candidatesLoading,
    assigning,
    error,
    assignError,
    setAssignError,
    refetch,
    assignFromDrag,
    assignMany,
    unlinkScreenFromFunction,
    unlinkApiFromFunction,
    unlinkCommunicationFromFunction,
    unlinkComponentFromScreen,
    unlinkEntityFromModule,
  } = useOverallStructure(workspaceId, applicationId, projectId)

  // Switching project remaps Functions — drop stale Function focus from another project.
  useEffect(() => {
    setFocus(null)
    setAssignError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when project changes
  }, [projectId])

  useEffect(() => {
    if (tree) setExpandMap(defaultExpandMap(tree))
  }, [tree?.applicationId, tree?.workspaceId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocus(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setFocus])

  const projectOptions = useMemo(
    () => [
      { value: '', label: projectsLoading ? 'Loading projects…' : 'Select project…' },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects, projectsLoading]
  )

  const handleSearchSelect = (hit: StructureSearchHit) => {
    setExpandMap((prev) => {
      const next = { ...prev }
      for (const key of hit.expandKeys) next[key] = true
      return next
    })
    setFocus(hit.focus)
    setScrollToFocusId(hit.focus.id)
    setMode('structure')
  }

  const dock = (
    <ContextualAssignmentDock
      tree={tree}
      focus={focus}
      candidates={candidates}
      candidatesLoading={candidatesLoading}
      assigning={assigning}
      projectId={projectId}
      onClose={() => setFocus(null)}
      onAssign={(payload) => void assignFromDrag(payload)}
      onAssignMany={(payloads) => void assignMany(payloads)}
      onFocusLinked={setFocus}
      onUnlinkScreen={(fnId, screenId, pid) =>
        void unlinkScreenFromFunction(fnId, screenId, pid)
      }
      onUnlinkApi={(fnId, apiId, pid) => void unlinkApiFromFunction(fnId, apiId, pid)}
      onUnlinkCommunication={(fnId, communicationId, pid) =>
        void unlinkCommunicationFromFunction(fnId, communicationId, pid)
      }
      onUnlinkComponent={(screenId, componentId) =>
        void unlinkComponentFromScreen(screenId, componentId)
      }
      onUnlinkEntity={(entityId, moduleId) =>
        void unlinkEntityFromModule(entityId, moduleId)
      }
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography weight="medium">Overall structure</Typography>
            <Typography variant="small" tone="muted" className="mt-0.5">
              Select a node to open the assignment dock. Available items sit next to drop
              zones.
            </Typography>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showModeSwitcher ? (
              <div className="flex border border-neutral-200">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      'px-3 py-1.5 text-sm',
                      mode === m.id
                        ? 'bg-secondary text-white'
                        : 'bg-white text-neutral-700 hover:bg-neutral-50'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ) : null}
            {showProjectSelector && !lockedProjectId ? (
              <div className="min-w-[12rem]">
                <Select
                  value={projectId ?? ''}
                  onValueChange={(v: string) => setProjectId(v || null)}
                  options={projectOptions}
                  placeholder="Project for Function / NFR mapping"
                  aria-label="Project context"
                />
              </div>
            ) : null}
          </div>
        </div>
        {error ? (
          <Typography tone="error" variant="small" className="mt-1">
            {error}
          </Typography>
        ) : null}
        {assignError ? (
          <Typography tone="error" variant="small" className="mt-1">
            {assignError}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => setAssignError(null)}
            >
              dismiss
            </button>
          </Typography>
        ) : null}
        {!projectId && showProjectSelector ? (
          <Typography variant="small" tone="muted" className="mt-1">
            Select a project to load Functions / NFRs for mapping.
          </Typography>
        ) : null}
        {loading && !tree ? (
          <Typography variant="small" tone="muted" className="mt-1">
            Loading structure…
          </Typography>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,0.42fr)_minmax(360px,0.58fr)]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white">
          {mode === 'structure' ? (
            <>
              <StructureToolbar
                tree={tree}
                onSearchSelect={handleSearchSelect}
                onCollapseAll={() => tree && setExpandMap(collapseAllExpandMap(tree))}
                onExpandOneLevel={() =>
                  tree && setExpandMap((prev) => expandOneLevel(tree, prev))
                }
                onExpandAll={() => tree && setExpandMap(defaultExpandMap(tree))}
                onRefresh={() => void refetch()}
              />
              {tree ? (
                <OverallStructureTree
                  tree={tree}
                  focus={focus}
                  onFocus={setFocus}
                  expandMap={expandMap}
                  onToggleExpand={(key) =>
                    setExpandMap((prev) => ({
                      ...prev,
                      [key]: prev[key] === false,
                    }))
                  }
                  scrollToFocusId={scrollToFocusId}
                />
              ) : !loading ? (
                <div className="flex h-full items-center justify-center px-4 text-center">
                  <Typography variant="small" tone="muted">
                    Structure could not be loaded.
                  </Typography>
                </div>
              ) : null}
            </>
          ) : null}

          {mode === 'canvas' ? (
            tree ? (
              <OverallStructureCanvas tree={tree} focus={focus} onFocus={setFocus} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Typography variant="small" tone="muted">
                  {loading ? 'Loading…' : 'No structure loaded'}
                </Typography>
              </div>
            )
          ) : null}

          {mode === 'gaps' ? (
            <StructureGapsPanel
              tree={tree}
              focus={focus}
              onFocus={setFocus}
              projectId={projectId}
            />
          ) : null}
        </div>

        {dock}
      </div>
    </div>
  )
}
