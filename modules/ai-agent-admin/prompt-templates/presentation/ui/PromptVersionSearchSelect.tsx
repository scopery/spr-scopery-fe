'use client'

import { useMemo } from 'react'
import { SearchableSelect } from '@/shared/ui'
import { usePromptVersions } from '../hooks/usePrompts'

interface PromptVersionSearchSelectProps {
  value: string
  onChange: (promptVersionId: string) => void
  optional?: boolean
}

export function PromptVersionSearchSelect({
  value,
  onChange,
  optional = false,
}: PromptVersionSearchSelectProps) {
  const { items, loading } = usePromptVersions({ page: 0, size: 200 })
  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'No prompt version' }] : []),
      ...items.map((item) => ({
        value: item.id,
        label: `${item.title} · ${item.status}`,
      })),
    ],
    [items, optional]
  )

  return (
    <SearchableSelect
      value={value}
      options={options}
      placeholder={loading ? 'Loading prompt versions…' : 'Select prompt version'}
      searchPlaceholder="Search prompt versions…"
      onValueChange={onChange}
    />
  )
}
