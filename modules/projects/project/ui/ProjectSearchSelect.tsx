'use client'

import { useMemo } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { useProjects } from '../hooks/useProjects'

interface ProjectSearchSelectProps {
  workspaceId: string
  value: string
  onChange: (projectId: string) => void
  label?: string
  optional?: boolean
  disabled?: boolean
}

export function ProjectSearchSelect({
  workspaceId,
  value,
  onChange,
  label = 'Project',
  optional = false,
  disabled = false,
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
      {error ? (
        <Typography variant="caption" tone="error" className="block">
          {error}
        </Typography>
      ) : null}
    </div>
  )
}
