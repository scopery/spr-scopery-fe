'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export interface StructureItemGroup {
  key: string
  label: string
  itemIds: string[]
}

export function partitionByGroups<T extends { id: string }>(
  items: T[],
  groups: StructureItemGroup[]
): Array<{ group: StructureItemGroup; items: T[] }> {
  const byId = new Map(items.map((item) => [item.id, item]))
  const seen = new Set<string>()
  const blocks = groups.map((group) => {
    const grouped = group.itemIds
      .map((id) => byId.get(id))
      .filter((item): item is T => Boolean(item))
    grouped.forEach((item) => seen.add(item.id))
    return { group, items: grouped }
  })
  const leftover = items.filter((item) => !seen.has(item.id))
  if (leftover.length > 0) {
    blocks.push({
      group: {
        key: 'other',
        label: 'Other',
        itemIds: leftover.map((item) => item.id),
      },
      items: leftover,
    })
  }
  return blocks.filter((block) => block.items.length > 0)
}

export function StructureGroupBlocks<T extends { id: string }>({
  items,
  groups,
  renderItems,
}: {
  items: T[]
  groups: StructureItemGroup[]
  renderItems: (groupItems: T[], startIndex: number) => ReactNode
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const blocks = useMemo(() => partitionByGroups(items, groups), [groups, items])

  let nextIndex = 0
  return (
    <div>
      {blocks.map((block) => {
        const startIndex = nextIndex
        nextIndex += block.items.length
        const open = !collapsed.has(block.group.key)
        return (
          <div key={block.group.key}>
            <button
              type="button"
              className="flex w-full items-center gap-1.5 bg-neutral-50 px-3 py-2 text-left"
              aria-expanded={open}
              onClick={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev)
                  if (next.has(block.group.key)) next.delete(block.group.key)
                  else next.add(block.group.key)
                  return next
                })
              }
            >
              <ChevronDown
                size={14}
                className={cn(
                  'shrink-0 text-neutral-500 transition-transform',
                  !open && '-rotate-90'
                )}
              />
              <span className="min-w-0 flex-1">
                <Typography variant="small" className="font-medium">
                  {block.group.label}
                </Typography>
              </span>
              <Typography variant="caption" tone="muted">
                {block.items.length}
              </Typography>
            </button>
            {open ? renderItems(block.items, startIndex) : null}
          </div>
        )
      })}
    </div>
  )
}
