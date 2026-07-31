'use client'

import { useEffect, useMemo, useState } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { iamResourcesApi, type IamResource } from '@/modules/auth/iam'

interface IamResourceSearchSelectProps {
  value: string
  onChange: (resourceId: string) => void
  label?: string
}

export function IamResourceSearchSelect({
  value,
  onChange,
  label = 'Resource',
}: IamResourceSearchSelectProps) {
  const [items, setItems] = useState<IamResource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void iamResourcesApi
      .searchResources({ page: 0, size: 200 })
      .then((response) => {
        if (!cancelled) setItems(response.items ?? [])
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load resources')
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
    () =>
      items.map((resource) => ({
        value: resource.id,
        label: `${resource.code} · ${resource.name} · ${resource.resourceType}`,
      })),
    [items]
  )

  return (
    <div className="space-y-1">
      <Typography variant="small" weight="medium">
        {label}
      </Typography>
      <SearchableSelect
        value={value}
        options={options}
        disabled={loading}
        placeholder={loading ? 'Loading resources…' : 'Select resource'}
        searchPlaceholder="Search resource…"
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
