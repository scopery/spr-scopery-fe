'use client'

import { useMemo } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { useIamRoles } from '../hooks/useIamRoles'

interface IamRoleSearchSelectProps {
  value: string
  onChange: (roleId: string) => void
  label?: string
  optional?: boolean
  disabled?: boolean
}

export function IamRoleSearchSelect({
  value,
  onChange,
  label = 'Role',
  optional = false,
  disabled = false,
}: IamRoleSearchSelectProps) {
  const { items, loading, error } = useIamRoles()
  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'No role' }] : []),
      ...items.map((role) => ({
        value: role.id,
        label: `${role.code} · ${role.name}`,
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
        placeholder={loading ? 'Loading roles…' : 'Select role'}
        searchPlaceholder="Search role by code or name…"
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
