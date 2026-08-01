'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, PageSkeleton, SearchableSelect, Select, Typography } from '@/shared/ui'
import { requirementsApi } from '@/modules/projects/requirements'
import { qualityApi } from '@/modules/quality'
import { useTraceExplorer } from '../hooks/useTraceExplorer'
import * as functionalCatalogApi from '../api/functional-catalog.api'
import * as useCaseApi from '../api/use-case.api'
import type { TraceExplorerNode } from '../model/requirement-traceability'

const ROOT_TYPES = [
  { value: 'REQUIREMENT', label: 'Requirement' },
  { value: 'FUNCTION', label: 'Function' },
  { value: 'USE_CASE', label: 'Use Case' },
  { value: 'TEST_CASE', label: 'Test Case' },
]

function ExplorerTree({ node, depth = 0 }: { node: TraceExplorerNode; depth?: number }) {
  return (
    <li className="text-sm">
      <div className="flex items-baseline gap-2 py-0.5" style={{ paddingLeft: depth * 16 }}>
        <span className="text-[10px] uppercase tracking-wide text-neutral-400">
          {node.objectType}
        </span>
        <span className="font-medium text-neutral-900">
          {[node.code, node.name].filter(Boolean).join(' · ')}
        </span>
        {node.latestResult ? (
          <span className="text-xs text-neutral-500">{node.latestResult}</span>
        ) : null}
      </div>
      {node.children?.length ? (
        <ul>
          {node.children.map((child) => (
            <ExplorerTree key={`${child.objectType}-${child.id}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

interface TraceExplorerTabProps {
  projectId: string
}

export function TraceExplorerTab({ projectId }: TraceExplorerTabProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [rootType, setRootType] = useState('REQUIREMENT')
  const [rootId, setRootId] = useState('')
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const { data, loading, error, refetch } = useTraceExplorer(
    projectId,
    submittedId ? rootType : null,
    submittedId
  )

  useEffect(() => {
    setRootId('')
    setSubmittedId(null)
  }, [rootType])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setOptionsLoading(true)
      setOptionsError(null)
      try {
        let next: Array<{ value: string; label: string }> = []
        if (rootType === 'REQUIREMENT') {
          const res = await requirementsApi.listRequirements(workspaceId ?? '', projectId, {
            limit: 500,
          })
          next = res.items.map((item) => ({
            value: item.id,
            label: `${item.code} · ${item.title}`,
          }))
        } else if (rootType === 'FUNCTION') {
          const res = await functionalCatalogApi.listFunctionalItems(projectId)
          next = res.items.map((item) => ({
            value: item.id,
            label: `${item.code ?? 'FN'} · ${item.title}`,
          }))
        } else if (rootType === 'USE_CASE') {
          const res = await useCaseApi.listUseCases(projectId)
          next = res.map((item) => ({
            value: item.id,
            label: `${item.key} · ${item.name}`,
          }))
        } else if (rootType === 'TEST_CASE') {
          const res = await qualityApi.listTestCases(projectId, { page: 0, size: 200 })
          next = res.items.map((item) => ({
            value: item.id,
            label: `${item.code ?? 'TC'} · ${item.title}`,
          }))
        }
        if (!cancelled) setOptions(next)
      } catch (err) {
        if (!cancelled) {
          setOptions([])
          setOptionsError(err instanceof Error ? err.message : 'Failed to load objects')
        }
      } finally {
        if (!cancelled) setOptionsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [projectId, rootType, workspaceId])

  const selectedLabel = options.find((o) => o.value === rootId)?.label

  return (
    <div className="space-y-3">
      <Typography variant="small" tone="muted">
        Inspect the coverage tree from any root object. Search by code / key / name.
      </Typography>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-44">
          <Select
            size="sm"
            value={rootType}
            onValueChange={setRootType}
            options={ROOT_TYPES}
            aria-label="Root type"
          />
        </div>
        <div className="min-w-[280px] flex-1">
          <SearchableSelect
            size="sm"
            value={rootId}
            options={options}
            disabled={optionsLoading}
            placeholder={
              optionsLoading
                ? 'Loading…'
                : `Search ${ROOT_TYPES.find((t) => t.value === rootType)?.label ?? 'object'}…`
            }
            searchPlaceholder="Type code or name…"
            onValueChange={setRootId}
          />
          {optionsError ? (
            <Typography variant="caption" tone="error" className="mt-1 block">
              {optionsError}
            </Typography>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={!rootId}
          onClick={() => setSubmittedId(rootId)}
        >
          Explore
        </Button>
      </div>
      {selectedLabel ? (
        <Typography variant="caption" tone="muted">
          Selected: {selectedLabel}
        </Typography>
      ) : null}

      {loading ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <div>
          <Typography tone="error">{error}</Typography>
          <Button className="mt-2" size="sm" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {data?.root ? (
        <div className="border border-neutral-200 bg-white px-3 py-3">
          <ul>
            <ExplorerTree node={data.root} />
          </ul>
        </div>
      ) : null}
    </div>
  )
}
