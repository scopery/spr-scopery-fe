'use client'

import { Button, Typography } from '@/shared/ui'
import {
  ARCHITECTURE_NODE_TYPE_LABEL,
  type ArchitectureCatalogNode,
} from '../model/architecture-workbench'
import { labelArchitectureNode } from '../model/anchor-mapping'
import type { StructureRelation } from '../model/structure-relation'

interface RelationInspectorProps {
  relation: StructureRelation | null
  nodeById: Map<string, ArchitectureCatalogNode>
  removing?: boolean
  onRemove: () => void
  onFocusFrom: () => void
  onFocusTo: () => void
}

function labelFor(
  nodeType: string,
  nodeId: string,
  nodeById: Map<string, ArchitectureCatalogNode>
): { title: string; subtitle: string } {
  const node = nodeById.get(nodeId)
  if (node) {
    return {
      title: node.name,
      subtitle: `${ARCHITECTURE_NODE_TYPE_LABEL[node.type]} · ${labelArchitectureNode(node)}`,
    }
  }
  return { title: nodeId.slice(0, 8) + '…', subtitle: nodeType }
}

export function RelationInspector({
  relation,
  nodeById,
  removing = false,
  onRemove,
  onFocusFrom,
  onFocusTo,
}: RelationInspectorProps) {
  if (!relation) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-neutral-200 px-4 text-center">
        <Typography weight="medium" size="sm">
          Relation inspector
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Select a relation in the workspace to inspect or remove it.
        </Typography>
      </div>
    )
  }

  const from = labelFor(relation.fromNodeType, relation.fromNodeId, nodeById)
  const to = labelFor(relation.toNodeType, relation.toNodeId, nodeById)

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-neutral-200 bg-neutral-50/50 p-4">
      <Typography weight="medium" size="sm">
        Relation
      </Typography>

      <div className="mt-4 space-y-4">
        <div>
          <Typography variant="small" tone="muted">
            Type
          </Typography>
          <Typography className="uppercase tracking-wide">{relation.relationType}</Typography>
        </div>

        <div>
          <Typography variant="small" tone="muted">
            From
          </Typography>
          <button
            type="button"
            className="mt-0.5 block w-full text-left hover:underline"
            onClick={onFocusFrom}
          >
            <div className="text-sm text-neutral-900">{from.title}</div>
            <div className="text-xs text-neutral-500">{from.subtitle}</div>
          </button>
        </div>

        <div>
          <Typography variant="small" tone="muted">
            To
          </Typography>
          <button
            type="button"
            className="mt-0.5 block w-full text-left hover:underline"
            onClick={onFocusTo}
          >
            <div className="text-sm text-neutral-900">{to.title}</div>
            <div className="text-xs text-neutral-500">{to.subtitle}</div>
          </button>
        </div>

        {relation.createdAt ? (
          <Typography variant="small" tone="muted">
            Created {new Date(relation.createdAt).toLocaleString()}
          </Typography>
        ) : null}
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <Button
          className="w-full"
          variant="secondary"
          disabled={removing}
          onClick={onRemove}
        >
          Remove relation
        </Button>
      </div>
    </div>
  )
}
