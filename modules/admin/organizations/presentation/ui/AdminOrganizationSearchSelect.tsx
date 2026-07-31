'use client'

import { useMemo } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { useOrganizations } from '../hooks/useOrganizations'

interface AdminOrganizationSearchSelectProps {
  value: string
  onChange: (organizationId: string) => void
  optional?: boolean
  label?: string
}

export function AdminOrganizationSearchSelect({
  value,
  onChange,
  optional = false,
  label = 'Organization',
}: AdminOrganizationSearchSelectProps) {
  const { items, loading, error } = useOrganizations({ page: 0, size: 200 })
  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'No organization' }] : []),
      ...items.map((organization) => ({
        value: organization.id,
        label: `${organization.code} · ${organization.name}`,
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
        disabled={loading}
        placeholder={loading ? 'Loading organizations…' : 'Select organization'}
        searchPlaceholder="Search organization…"
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
