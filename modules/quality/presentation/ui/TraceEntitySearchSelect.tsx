'use client'

import { useEffect, useMemo, useState } from 'react'
import { SearchableSelect, Select, Typography } from '@/shared/ui'
import { requirementsApi } from '@/modules/projects/requirements'
import {
  functionalCatalogApi,
  useArchitectureNodeCatalog,
  useCaseApi,
} from '@/modules/projects/traceability'
import * as qualityApi from '../../infrastructure/api/quality.api'

export type TraceEntityType =
  | 'REQUIREMENT'
  | 'FUNCTION'
  | 'USE_CASE'
  | 'TEST_CASE'
  | 'MODULE'
  | 'SCREEN'
  | 'API'
  | 'API_ENDPOINT'
  | 'COMPONENT'
  | 'ENTITY'
  | 'DATA_ENTITY'

interface TraceEntitySearchSelectProps {
  workspaceId: string
  projectId: string
  entityType: TraceEntityType | string
  value: string
  onChange: (id: string, label?: string) => void
  label: string
  required?: boolean
  disabled?: boolean
  allowClear?: boolean
  requirementTypes?: string[]
}

interface EntityOption {
  value: string
  label: string
}

export const TRACE_ENTITY_TYPE_OPTIONS = [
  { value: 'REQUIREMENT', label: 'Requirement' },
  { value: 'FUNCTIONAL_ITEM', label: 'Function' },
  { value: 'USE_CASE', label: 'Use Case' },
  { value: 'TEST_CASE', label: 'Test Case' },
  { value: 'APP_MODULE', label: 'Application Module' },
  { value: 'SCREEN', label: 'Screen' },
  { value: 'API_ENDPOINT', label: 'API Endpoint' },
  { value: 'APP_COMPONENT', label: 'Application Component' },
  { value: 'DATA_ENTITY', label: 'Data Entity' },
] as const

const ARCHITECTURE_TYPE_MAP: Record<string, string> = {
  MODULE: 'MODULE',
  APP_MODULE: 'MODULE',
  SCREEN: 'SCREEN',
  API: 'API_ENDPOINT',
  API_ENDPOINT: 'API_ENDPOINT',
  COMPONENT: 'COMPONENT',
  APP_COMPONENT: 'COMPONENT',
  ENTITY: 'DATA_ENTITY',
  DATA_ENTITY: 'DATA_ENTITY',
}

export function TraceEntitySearchSelect({
  workspaceId,
  projectId,
  entityType,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  allowClear = false,
  requirementTypes,
}: TraceEntitySearchSelectProps) {
  const architectureType = ARCHITECTURE_TYPE_MAP[entityType]
  const isArchitecture = Boolean(architectureType)
  const [applicationId, setApplicationId] = useState('')
  const [options, setOptions] = useState<EntityOption[]>([])
  const [loadingProjectEntities, setLoadingProjectEntities] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const architecture = useArchitectureNodeCatalog(
    isArchitecture ? workspaceId : null,
    isArchitecture && applicationId ? applicationId : null
  )

  useEffect(() => {
    setApplicationId('')
    setOptions([])
    setError(null)
  }, [entityType])

  useEffect(() => {
    if (isArchitecture || !projectId) return
    let cancelled = false
    const load = async () => {
      setLoadingProjectEntities(true)
      setError(null)
      try {
        let next: EntityOption[] = []
        if (entityType === 'REQUIREMENT') {
          const response = await requirementsApi.listRequirements('', projectId, { limit: 500 })
          next = response.items
            .filter(
              (item) =>
                !requirementTypes?.length ||
                requirementTypes.includes(String(item.req_type ?? item.type ?? ''))
            )
            .map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.title}`,
            }))
        } else if (entityType === 'FUNCTION' || entityType === 'FUNCTIONAL_ITEM') {
          const response = await functionalCatalogApi.listFunctionalItems(projectId)
          next = response.items.map((item) => ({
            value: item.id,
            label: `${item.code ?? 'Function'} · ${item.title}`,
          }))
        } else if (entityType === 'USE_CASE') {
          const response = await useCaseApi.listUseCases(projectId)
          next = response.map((item) => ({
            value: item.id,
            label: `${item.key} · ${item.name}`,
          }))
        } else if (entityType === 'TEST_CASE') {
          const response = await qualityApi.listTestCases(projectId, {
            page: 0,
            size: 200,
          })
          next = response.items.map((item) => ({
            value: item.id,
            label: `${item.code ?? 'Test Case'} · ${item.title}`,
          }))
        }
        if (!cancelled) setOptions(next)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load options')
        }
      } finally {
        if (!cancelled) setLoadingProjectEntities(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [entityType, isArchitecture, projectId, requirementTypes])

  const architectureOptions = useMemo(
    () =>
      architecture.nodes
        .filter((node) => node.type === architectureType)
        .map((node) => ({
          value: node.id,
          label: `${node.code ?? node.type} · ${node.name}`,
        })),
    [architecture.nodes, architectureType]
  )
  const visibleOptions = [
    ...(allowClear ? [{ value: '', label: `All ${label.toLowerCase()}s` }] : []),
    ...(isArchitecture ? architectureOptions : options),
  ]
  const loading = isArchitecture ? architecture.loading : loadingProjectEntities
  const visibleError = isArchitecture ? architecture.error : error

  return (
    <div className="space-y-1">
      <Typography variant="small" weight="medium">
        {label}
        {required ? ' *' : ''}
      </Typography>
      {isArchitecture ? (
        <Select
          value={applicationId}
          options={architecture.applications.map((application) => ({
            value: application.id,
            label: `${application.code} · ${application.name}`,
          }))}
          placeholder={architecture.loadingApps ? 'Loading applications…' : 'Select application'}
          disabled={disabled || architecture.loadingApps}
          onValueChange={(next: string) => {
            setApplicationId(next)
            onChange('')
          }}
        />
      ) : null}
      <SearchableSelect
        value={value}
        options={visibleOptions}
        disabled={disabled || loading || (isArchitecture && !applicationId)}
        placeholder={
          isArchitecture && !applicationId
            ? 'Select application first'
            : loading
              ? 'Loading…'
              : `Select ${label.toLowerCase()}`
        }
        searchPlaceholder={`Search ${label.toLowerCase()}…`}
        onValueChange={(next) => {
          const selected = visibleOptions.find((option) => option.value === next)
          onChange(next, selected?.label)
        }}
      />
      {visibleError ? (
        <Typography variant="caption" tone="error" className="block">
          {visibleError}
        </Typography>
      ) : null}
    </div>
  )
}
