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
  /** First option with empty value, e.g. "All planning elements" for filters. */
  emptyLabel?: string
  placeholder?: string
  className?: string
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
  emptyLabel,
  placeholder,
  className,
}: WbsNodeSearchSelectProps) {
  const { tree, loading } = useProjectWbs(projectId || null)
  const options = useMemo(() => {
    const head: { value: string; label: string }[] = []
    if (emptyLabel) head.push({ value: '', label: emptyLabel })
    else if (optional) head.push({ value: '', label: 'No planning element' })
    return [...head, ...flatten(tree)]
  }, [emptyLabel, optional, tree])

  return (
    <SearchableSelect
      value={value}
      options={options}
      disabled={!projectId}
      placeholder={
        placeholder ?? (loading ? 'Loading planning elements…' : 'Select planning element')
      }
      searchPlaceholder="Search planning elements…"
      onValueChange={onChange}
      className={className}
    />
  )
}
