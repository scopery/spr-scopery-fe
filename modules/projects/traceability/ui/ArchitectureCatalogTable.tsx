'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DataTable, Input, Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  ARCHITECTURE_NODE_TYPE_LABEL,
  type BrowseCatalogNode,
  type CatalogBrowseNodeType,
} from '../model/architecture-workbench'

type TypeFilter = 'ALL' | CatalogBrowseNodeType

interface ArchitectureCatalogTableProps {
  nodes: BrowseCatalogNode[]
  selectedId: string | null
  /** Prefer `${type}:${id}` when available to avoid cross-type id clashes. */
  selectedKey?: string | null
  onSelect: (node: BrowseCatalogNode) => void
}

const FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'MODULE', label: 'Modules' },
  { id: 'FUNCTION', label: 'Functions' },
  { id: 'SCREEN', label: 'Screens' },
  { id: 'API_ENDPOINT', label: 'APIs' },
  { id: 'COMPONENT', label: 'Components' },
  { id: 'DATA_ENTITY', label: 'Entities' },
  { id: 'COMMUNICATION', label: 'Comms' },
]

export function ArchitectureCatalogTable({
  nodes,
  selectedId,
  selectedKey = null,
  onSelect,
}: ArchitectureCatalogTableProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return nodes.filter((node) => {
      if (typeFilter !== 'ALL' && node.type !== typeFilter) return false
      if (!q) return true
      return [node.code, node.name, node.secondary, node.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [nodes, query, typeFilter])

  return (
    <Stack direction="vertical" spacing="md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full min-w-0 sm:max-w-xs">
          <Input
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search architecture catalog"
            prefix={<Search size={14} />}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Node type">
          {FILTERS.map((f) => {
            const active = typeFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTypeFilter(f.id)}
                className={cn(
                  'px-2.5 py-1 text-sm transition-colors',
                  active
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Typography tone="muted" className="py-8 text-center">
          {nodes.length === 0
            ? 'No architecture nodes yet. Use Add node above.'
            : 'Nothing matches this search.'}
        </Typography>
      ) : (
        <div>
          <DataTable
            ariaLabel="Architecture catalog"
            rows={filtered}
            rowKey={(node) => `${node.type}:${node.id}`}
            selectedRowKey={
              selectedKey ??
              (nodes.find((node) => node.id === selectedId)
                ? `${nodes.find((node) => node.id === selectedId)!.type}:${selectedId}`
                : null)
            }
            onRowClick={onSelect}
            columns={[
              { id: 'code', header: 'Code', accessor: 'code', kind: 'code', width: '22%' },
              { id: 'name', header: 'Name', accessor: 'name', width: '34%' },
              {
                id: 'type',
                header: 'Type',
                accessor: (node) => ARCHITECTURE_NODE_TYPE_LABEL[node.type],
                width: '18%',
                cellClassName: 'text-neutral-500',
              },
              {
                id: 'detail',
                header: 'Detail',
                accessor: (node) => node.secondary ?? '—',
                width: '26%',
                cellClassName: 'text-neutral-500',
              },
            ]}
          />
          <Typography variant="caption" tone="muted" className="mt-3 block">
            {filtered.length} item{filtered.length === 1 ? '' : 's'}
            {typeFilter !== 'ALL' ? ` · ${FILTERS.find((f) => f.id === typeFilter)?.label}` : ''}
          </Typography>
        </div>
      )}
    </Stack>
  )
}
