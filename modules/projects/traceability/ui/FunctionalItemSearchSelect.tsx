'use client'

import { useMemo } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { useFunctionalCatalog } from '../hooks/useFunctionalCatalog'

interface FunctionalItemSearchSelectProps {
  projectId: string
  value: string
  onChange: (functionalItemId: string) => void
  label?: string
  optional?: boolean
}

export function FunctionalItemSearchSelect({
  projectId,
  value,
  onChange,
  label = 'Function',
  optional = false,
}: FunctionalItemSearchSelectProps) {
  const { functionalItems, loading, error } = useFunctionalCatalog(projectId)
  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'No Function' }] : []),
      ...functionalItems.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.title}`,
      })),
    ],
    [functionalItems, optional]
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
        disabled={loading}
        placeholder={loading ? 'Loading Functions…' : 'Select Function'}
        searchPlaceholder="Search Function…"
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
