'use client'

import { Typography } from '@/shared/ui'
import type { ScopeTreeEntity } from '../../domain/model/elicitation'
import { ScopeTreeNode } from './ScopeTreeNode'

interface ScopeTreeViewProps {
  mode: 'before' | 'after'
  nodes: ScopeTreeEntity[]
}

export function ScopeTreeView({ mode, nodes }: ScopeTreeViewProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <Typography variant="body" className="text-neutral-400">
          No scope data
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Typography variant="caption" className="mb-1 font-medium text-neutral-500">
        {mode === 'before' ? 'Before (snapshot)' : 'After (projected)'}
      </Typography>
      {nodes.map((node) => (
        <ScopeTreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  )
}
