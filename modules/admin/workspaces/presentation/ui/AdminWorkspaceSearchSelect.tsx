'use client'

import { useEffect, useMemo, useState } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import * as workspacesApi from '../../infrastructure/api/workspaces.api'
import type { Workspace } from '../../domain/model/workspace'

interface AdminWorkspaceSearchSelectProps {
  value: string
  onChange: (workspaceId: string) => void
  optional?: boolean
  disabled?: boolean
  label?: string
}

export function AdminWorkspaceSearchSelect({
  value,
  onChange,
  optional = false,
  disabled = false,
  label = 'Workspace',
}: AdminWorkspaceSearchSelectProps) {
  const [items, setItems] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void workspacesApi
      .searchWorkspaces({ page: 0, size: 200 })
      .then((response) => {
        if (!cancelled) setItems(response.items ?? [])
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load workspaces')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'No workspace' }] : []),
      ...items.map((workspace) => ({
        value: workspace.id,
        label: `${workspace.code} · ${workspace.name}`,
      })),
    ],
    [items, optional]
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
        placeholder={loading ? 'Loading workspaces…' : 'Select workspace'}
        searchPlaceholder="Search workspace…"
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
