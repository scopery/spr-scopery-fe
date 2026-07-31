'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Checkbox, Radio, Stack, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import {
  ProjectAccessMode,
  replaceWorkspaceMemberProjectAccess,
  type MemberProjectAccessItem,
  type WorkspaceMemberAccessResponse,
} from '../api/workspace-members.api'

function modeLabel(mode: string): string {
  return mode === ProjectAccessMode.All ? 'Full workspace' : 'Custom projects'
}

function modeTone(mode: string): 'success' | 'warning' | 'neutral' {
  return mode === ProjectAccessMode.All ? 'success' : 'warning'
}

export function MemberProjectAccessEditor({
  workspaceId,
  userId,
  initial,
  onSaved,
  compact = false,
}: {
  workspaceId: string
  userId: string
  initial: Pick<
    WorkspaceMemberAccessResponse,
    'accessMode' | 'totalProjects' | 'projects' | 'availableProjects'
  >
  onSaved?: (next: WorkspaceMemberAccessResponse) => void
  compact?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<ProjectAccessMode>(
    initial.accessMode === ProjectAccessMode.Custom
      ? ProjectAccessMode.Custom
      : ProjectAccessMode.All
  )
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial.projects.map((p) => p.projectId))
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) return
    setMode(
      initial.accessMode === ProjectAccessMode.Custom
        ? ProjectAccessMode.Custom
        : ProjectAccessMode.All
    )
    setSelected(new Set(initial.projects.map((p) => p.projectId)))
  }, [initial, editing])

  const available = useMemo(() => initial.availableProjects ?? [], [initial.availableProjects])

  const toggleProject = (projectId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(projectId)
      else next.delete(projectId)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const next = await replaceWorkspaceMemberProjectAccess(workspaceId, userId, {
        mode,
        projectIds: mode === ProjectAccessMode.Custom ? Array.from(selected) : undefined,
      })
      toast.success('Project access updated')
      setEditing(false)
      onSaved?.(next)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.problem.detail : 'Failed to update access')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <Stack direction="vertical" spacing="sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="solid" tone={modeTone(initial.accessMode)}>
              {modeLabel(initial.accessMode)}
            </Badge>
            <Typography variant="small" tone="muted">
              {initial.accessMode === ProjectAccessMode.All
                ? 'Sees all projects; new projects are granted automatically.'
                : `Sees ${initial.projects.length} of ${initial.totalProjects} projects; new projects are not auto-granted.`}
            </Typography>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="bg-neutral-100 hover:bg-neutral-200"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        </div>
        {initial.projects.length === 0 ? (
          <Typography variant="small" tone="muted">
            No project access.
          </Typography>
        ) : (
          <ul className={compact ? 'space-y-1' : 'space-y-1.5'}>
            {initial.projects.map((p) => (
              <ProjectRow key={p.projectId} project={p} />
            ))}
          </ul>
        )}
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="md">
      <div className="space-y-2">
        <Radio
          name={`access-mode-${workspaceId}-${userId}`}
          value={ProjectAccessMode.All}
          checked={mode === ProjectAccessMode.All}
          onChange={() => setMode(ProjectAccessMode.All)}
          label="Full workspace"
          helperText="Access every project. New projects are granted automatically."
        />
        <Radio
          name={`access-mode-${workspaceId}-${userId}`}
          value={ProjectAccessMode.Custom}
          checked={mode === ProjectAccessMode.Custom}
          onChange={() => setMode(ProjectAccessMode.Custom)}
          label="Custom projects"
          helperText="Only selected projects. New projects are not granted unless you add them."
        />
      </div>

      {mode === ProjectAccessMode.Custom ? (
        available.length === 0 ? (
          <Typography variant="small" tone="muted">
            This workspace has no projects yet.
          </Typography>
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto border border-neutral-200 p-3">
            {available.map((p) => (
              <Checkbox
                key={p.projectId}
                checked={selected.has(p.projectId)}
                onChange={(e) => toggleProject(p.projectId, e.target.checked)}
                label={`${p.projectName} (${p.projectCode})`}
              />
            ))}
          </div>
        )
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={saving}
          onClick={() => {
            setEditing(false)
            setMode(
              initial.accessMode === ProjectAccessMode.Custom
                ? ProjectAccessMode.Custom
                : ProjectAccessMode.All
            )
            setSelected(new Set(initial.projects.map((p) => p.projectId)))
          }}
        >
          Cancel
        </Button>
        <Button size="sm" variant="primary" loading={saving} onClick={() => void handleSave()}>
          Save
        </Button>
      </div>
    </Stack>
  )
}

function ProjectRow({ project }: { project: MemberProjectAccessItem }) {
  return (
    <li className="text-sm text-neutral-700">
      {project.projectName}
      <span className="ml-2 font-mono text-xs text-neutral-500">{project.projectCode}</span>
    </li>
  )
}
