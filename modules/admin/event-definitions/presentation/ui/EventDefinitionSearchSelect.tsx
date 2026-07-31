'use client'

import { useMemo } from 'react'
import { SearchableSelect } from '@/shared/ui'
import { useEventDefinitions } from '../hooks/useEventDefinitions'

interface EventDefinitionSearchSelectProps {
  value: string
  onChange: (eventDefinitionId: string) => void
  optional?: boolean
}

export function EventDefinitionSearchSelect({
  value,
  onChange,
  optional = false,
}: EventDefinitionSearchSelectProps) {
  const { items, loading } = useEventDefinitions({ page: 0, size: 200 })
  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'Any event definition' }] : []),
      ...items.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
    ],
    [items, optional]
  )

  return (
    <SearchableSelect
      value={value}
      options={options}
      placeholder={loading ? 'Loading event definitions…' : 'Select event definition'}
      searchPlaceholder="Search event definitions…"
      onValueChange={onChange}
    />
  )
}
