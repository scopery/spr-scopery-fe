'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Select, Stack, Typography } from '@/shared/ui'
import { useArchitectureNodeCatalog } from '../hooks/useArchitectureNodeCatalog'
import {
  ARCHITECTURE_NODE_TYPE_LABEL,
  type ArchitectureCatalogNode,
  type ArchitectureNodeType,
} from '../model/architecture-workbench'
import {
  architectureToAnchorNodeType,
  labelArchitectureNode,
} from '../model/anchor-mapping'
import type { FunctionalItemAnchorNodeType } from '../model/functional-catalog'
import { cn } from '@/utils/cn'

type TypeFilter = 'ALL' | ArchitectureNodeType

export interface AnchorNodePickerSelection {
  nodeType: FunctionalItemAnchorNodeType
  nodeId: string
  node: ArchitectureCatalogNode
  applicationId: string
}

interface AnchorNodePickerProps {
  workspaceId: string
  initialApplicationId?: string | null
  disabled?: boolean
  onAdd: (selection: AnchorNodePickerSelection, note: string | null) => Promise<void> | void
  submitting?: boolean
}

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'MODULE', label: 'Modules' },
  { id: 'SCREEN', label: 'Screens' },
  { id: 'API_ENDPOINT', label: 'APIs' },
  { id: 'COMPONENT', label: 'Components' },
  { id: 'DATA_ENTITY', label: 'Entities' },
]

export function AnchorNodePicker({
  workspaceId,
  initialApplicationId = null,
  disabled,
  onAdd,
  submitting,
}: AnchorNodePickerProps) {
  const [applicationId, setApplicationId] = useState(initialApplicationId ?? '')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [query, setQuery] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (initialApplicationId) setApplicationId(initialApplicationId)
  }, [initialApplicationId])

  const { applications, nodes, loading, error } = useArchitectureNodeCatalog(
    workspaceId,
    applicationId || null
  )

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return nodes.filter((n) => {
      if (n.type === 'COMMUNICATION') return false
      if (typeFilter !== 'ALL' && n.type !== typeFilter) return false
      if (!q) return true
      return [n.code, n.name, n.secondary]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [nodes, query, typeFilter])

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  return (
    <Stack direction="vertical" spacing="sm">
      {error ? <Typography tone="error">{error}</Typography> : null}

      {!initialApplicationId ? (
        <Select
          value={applicationId}
          onValueChange={(v: string) => {
            setApplicationId(v)
            setSelectedNodeId('')
          }}
          options={applications.map((a) => ({
            value: a.id,
            label: `${a.code} — ${a.name}`,
          }))}
          placeholder={loading ? 'Loading…' : 'Application'}
          disabled={disabled || loading}
        />
      ) : null}

      <div className="flex flex-wrap gap-1">
        {TYPE_FILTERS.map((f) => {
          const active = typeFilter === f.id
          return (
            <button
              key={f.id}
              type="button"
              disabled={!applicationId || disabled}
              onClick={() => {
                setTypeFilter(f.id)
                setSelectedNodeId('')
              }}
              className={cn(
                'px-2 py-1 text-xs transition-colors disabled:opacity-40',
                active
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter nodes…"
          aria-label="Filter nodes"
          disabled={!applicationId || disabled}
          className="sm:max-w-[160px]"
        />
        <Select
          value={selectedNodeId}
          onValueChange={setSelectedNodeId}
          options={filteredNodes.map((n) => ({
            value: n.id,
            label: `${ARCHITECTURE_NODE_TYPE_LABEL[n.type]} · ${labelArchitectureNode(n)}`,
          }))}
          placeholder={
            !applicationId
              ? 'Pick application first'
              : loading
                ? 'Loading…'
                : filteredNodes.length
                  ? 'Select node'
                  : 'No nodes'
          }
          disabled={!applicationId || disabled || loading}
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
          aria-label="Anchor note"
          disabled={disabled}
          className="sm:max-w-[140px]"
        />
        <Button
          disabled={!selectedNode || disabled || submitting}
          onClick={() => {
            if (!selectedNode || !applicationId) return
            const nodeType = architectureToAnchorNodeType(selectedNode.type)
            if (!nodeType) return
            void Promise.resolve(
              onAdd(
                {
                  nodeType,
                  nodeId: selectedNode.id,
                  node: selectedNode,
                  applicationId,
                },
                note.trim() || null
              )
            ).then(() => {
              setSelectedNodeId('')
              setNote('')
            })
          }}
        >
          Attach
        </Button>
      </div>
    </Stack>
  )
}
