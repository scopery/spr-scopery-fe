'use client'

import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Badge, Button, Typography } from '@/shared/ui'
import { canArchiveWbsNode, wbsNodeStatusLabel } from '../../domain/rules/wbs.rules'
import type { WbsTreeNode } from '../../domain/model/wbs'
import { WbsNodeTypeBadge } from './WbsNodeTypeBadge'

interface WbsTreeRowProps {
  node: WbsTreeNode
  depth: number
  expanded: Set<string>
  onToggle: (nodeId: string) => void
  onAddChild: (node: WbsTreeNode) => void
  onArchive: (nodeId: string) => void
  actingId: string | null
}

export function WbsTreeRow({
  node,
  depth,
  expanded,
  onToggle,
  onAddChild,
  onArchive,
  actingId,
}: WbsTreeRowProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <>
      <tr className="border-t border-neutral-100 hover:bg-neutral-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button
                type="button"
                className="text-neutral-500 hover:text-neutral-900"
                onClick={() => onToggle(node.id)}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="inline-block w-3.5" />
            )}
            <Typography as="span" variant="small" tone="muted" className="font-mono">
              {node.code}
            </Typography>
            <Typography as="span" weight="medium">
              {node.title}
            </Typography>
          </div>
        </td>
        <td className="px-4 py-3">
          <WbsNodeTypeBadge nodeType={node.nodeType} />
        </td>
        <td className="px-4 py-3">
          <Badge tone={node.status === 'ARCHIVED' ? 'neutral' : 'success'}>
            {wbsNodeStatusLabel(node.status)}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <Typography variant="small" tone="muted">
            {node.path}
          </Typography>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              disabled={actingId === node.id}
              onClick={() => onAddChild(node)}
            >
              Add child element
            </Button>
            {canArchiveWbsNode(node) && (
              <Button
                size="sm"
                variant="ghost"
                tone="error"
                disabled={actingId === node.id}
                onClick={() => onArchive(node.id)}
              >
                Archive
              </Button>
            )}
          </div>
        </td>
      </tr>
      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <WbsTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onArchive={onArchive}
              actingId={actingId}
            />
          ))
        : null}
    </>
  )
}
