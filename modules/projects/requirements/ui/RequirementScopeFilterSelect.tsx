'use client'

import { useEffect, useState } from 'react'
import { Select } from '@/shared/ui'
import { scopeApi, type ScopePackage } from '@/modules/projects/scope'
import { cn } from '@/utils/cn'
import type { RequirementScopeFilter } from '../model/requirement-scope.rules'

interface RequirementScopeFilterSelectProps {
  projectId: string
  value: RequirementScopeFilter
  onChange: (value: RequirementScopeFilter) => void
  className?: string
  /** Preloaded packages — skips internal fetch when provided. */
  packages?: ScopePackage[]
}

/**
 * All scopes · Unscoped · each package — used on Requirements catalog & Spec Pack pickers.
 */
export function RequirementScopeFilterSelect({
  projectId,
  value,
  onChange,
  className,
  packages: packagesProp,
}: RequirementScopeFilterSelectProps) {
  const [loaded, setLoaded] = useState<ScopePackage[]>([])
  const packages = packagesProp ?? loaded

  useEffect(() => {
    if (packagesProp || !projectId) return
    let cancelled = false
    void scopeApi
      .listScopePackages(projectId)
      .then((list) => {
        if (!cancelled) setLoaded(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setLoaded([])
      })
    return () => {
      cancelled = true
    }
  }, [projectId, packagesProp])

  const options = [
    { value: 'all', label: 'All scopes' },
    { value: 'unscoped', label: 'Unscoped' },
    ...packages.map((p) => ({
      value: p.id,
      label: p.currentFlag ? `${p.code} · ${p.name} (current)` : `${p.code} · ${p.name}`,
    })),
  ]

  return (
    <div className={cn('w-[200px] shrink-0', className)}>
      <Select
        size="md"
        value={value}
        onValueChange={(v: string) => onChange(v as RequirementScopeFilter)}
        options={options}
        placeholder="Scope"
        aria-label="Filter by scope"
      />
    </div>
  )
}
