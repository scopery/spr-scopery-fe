'use client'

import { useMemo } from 'react'
import { SearchableSelect } from '@/shared/ui'
import { useProjectWbs } from '../hooks/useProjectWbs'
import type { WbsTreeNode } from '../../domain/model/wbs'

interface WbsNodeSearchSelectProps {
  projectId: string
  value: string
  onChange: (wbsNodeId: string) => void
  optional?: boolean
}

function flatten(nodes: WbsTreeNode[], depth = 0): { value: string; label: string }[] {
  return nodes.flatMap((node) => [
    {
      value: node.id,
      label: `${depth ? `${'—'.repeat(depth)} ` : ''}${node.code} · ${node.title}`,
    },
    ...flatten(node.children, depth + 1),
  ])
}

export function WbsNodeSearchSelect({
  projectId,
  value,
  onChange,
  optional = false,
}: WbsNodeSearchSelectProps) {
  const { tree, loading } = useProjectWbs(projectId || null)
  const options = useMemo(
    () => [...(optional ? [{ value: '', label: 'No planning element' }] : []), ...flatten(tree)],
    [optional, tree]
  )

  return (
    <SearchableSelect
      value={value}
      options={options}
      disabled={!projectId}
      placeholder={loading ? 'Loading planning elements…' : 'Select planning element'}
      searchPlaceholder="Search planning elements…"
      onValueChange={onChange}
    />
  )
}
