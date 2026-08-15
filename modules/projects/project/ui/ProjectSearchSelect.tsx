'use client'

import { useEffect, useMemo } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { useProjects } from '../hooks/useProjects'

interface ProjectSearchSelectProps {
  workspaceId: string
  value: string
  onChange: (projectId: string) => void
  label?: string
  helperText?: string
  optional?: boolean
  disabled?: boolean
  /** When the workspace has exactly one project, select it automatically. */
  autoSelectSingle?: boolean
}

export function ProjectSearchSelect({
  workspaceId,
  value,
  onChange,
  label = 'Project',
  helperText,
  optional = false,
  disabled = false,
  autoSelectSingle = false,
}: ProjectSearchSelectProps) {
  const { projects, loading, error } = useProjects(workspaceId)
  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'No project' }] : []),
      ...projects.map((project) => ({
        value: project.id,
        label: `${project.code} · ${project.name}`,
      })),
    ],
    [optional, projects]
  )

  useEffect(() => {
    if (!autoSelectSingle || value || projects.length !== 1) return
    onChange(projects[0].id)
  }, [autoSelectSingle, onChange, projects, value])

  return (
    <div className="space-y-1">
      <Typography variant="small" weight="medium">
        {label}
        {optional ? ' (optional)' : ''}
      </Typography>
      <SearchableSelect
        value={value}
        options={options}
        disabled={disabled || loading}
        placeholder={loading ? 'Loading projects…' : 'Select project'}
        searchPlaceholder="Search project by code or name…"
        onValueChange={onChange}
      />
      {helperText ? (
        <Typography variant="caption" tone="muted" className="block">
          {helperText}
        </Typography>
      ) : null}
      {error ? (
        <Typography variant="caption" tone="error" className="block">
          {error}
        </Typography>
      ) : null}
    </div>
  )
}
