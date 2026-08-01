'use client'

import { useMemo } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { useUseCaseCatalog } from '../hooks/useUseCaseCatalog'

interface UseCaseSearchSelectProps {
  projectId: string
  value: string
  onChange: (useCaseId: string) => void
  /** When omitted or empty, no label is rendered (toolbar-friendly). */
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function UseCaseSearchSelect({
  projectId,
  value,
  onChange,
  label = 'Use Case',
  placeholder,
  required = false,
  disabled = false,
  className,
}: UseCaseSearchSelectProps) {
  const { useCases, loading, error } = useUseCaseCatalog(projectId)
  const options = useMemo(
    () =>
      useCases
        .filter((useCase) => useCase.status !== 'ARCHIVED')
        .map((useCase) => ({
          value: useCase.id,
          label: `${useCase.key} · ${useCase.name}${
            useCase.primaryFunctionName ? ` · ${useCase.primaryFunctionName}` : ''
          }`,
        })),
    [useCases]
  )

  return (
    <div className={className}>
      {label ? (
        <Typography variant="small" weight="medium" className="mb-1">
          {label}
          {required ? ' *' : ''}
        </Typography>
      ) : null}
      <SearchableSelect
        value={value}
        options={options}
        disabled={disabled || loading}
        placeholder={
          placeholder ?? (loading ? 'Loading Use Cases…' : 'Select a Use Case')
        }
        searchPlaceholder="Search by key, name, or Function…"
        onValueChange={onChange}
      />
      {error ? (
        <Typography variant="caption" tone="error" className="mt-1 block">
          {error}
        </Typography>
      ) : null}
    </div>
  )
}
