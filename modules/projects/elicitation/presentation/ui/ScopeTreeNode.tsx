'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge, Typography, type BadgeTone } from '@/shared/ui'
import type { ScopeTreeEntity } from '../../domain/model/elicitation'

const TYPE_LABEL: Record<string, string> = {
  REQUIREMENT: 'REQ',
  FUNCTION: 'FR',
  USE_CASE: 'UC',
  SCREEN: 'SCR',
  COMPONENT: 'COMP',
  NOTIFICATION: 'NOTIF',
}

const ACTION_TONE: Record<string, BadgeTone> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'error',
}

export function ScopeTreeNode({
  node,
  depth = 0,
}: {
  node: ScopeTreeEntity
  depth?: number
}) {
  const hasChildren = (node.children ?? []).length > 0
  const [expanded, setExpanded] = useState(depth < 2)
  const [showChanges, setShowChanges] = useState(false)

  const hasChanges = node.changes && Object.keys(node.changes).length > 0

  return (
    <div className="min-w-0">
      <div
        className="flex items-center gap-1.5 px-1 py-1 hover:bg-neutral-50"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-neutral-400 hover:text-neutral-700"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <span className="shrink-0 bg-neutral-100 px-1 py-0.5 text-[10px] font-medium text-neutral-500">
          {TYPE_LABEL[node.type] ?? node.type}
        </span>

        <Typography variant="caption" className="min-w-0 flex-1 truncate text-neutral-700">
          {node.title}
        </Typography>

        {node.pendingAction && (
          <Badge variant="solid" tone={ACTION_TONE[node.pendingAction] ?? 'neutral'} size="sm">
            {node.pendingAction}
          </Badge>
        )}

        {hasChanges && (
          <button
            type="button"
            onClick={() => setShowChanges((v) => !v)}
            className="shrink-0 text-[10px] text-blue-600 underline hover:text-blue-800"
          >
            diff
          </button>
        )}
      </div>

      {hasChanges && showChanges && node.changes && (
        <div
          className="mb-1 border border-neutral-100 bg-neutral-50 p-2 text-xs"
          style={{ marginLeft: `${depth * 16 + 24}px` }}
        >
          {Object.entries(node.changes).map(([field, { before, after }]) => (
            <div key={field} className="flex flex-wrap gap-1">
              <span className="font-medium text-neutral-600">{field}:</span>
              <span className="text-red-600 line-through">{String(before ?? '—')}</span>
              <span className="text-neutral-400">→</span>
              <span className="text-green-700">{String(after ?? '—')}</span>
            </div>
          ))}
        </div>
      )}

      {expanded && hasChildren && (
        <div>
          {(node.children ?? []).map((child) => (
            <ScopeTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
