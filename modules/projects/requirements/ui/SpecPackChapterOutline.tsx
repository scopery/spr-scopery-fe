'use client'

import { useRef, useState, type DragEvent } from 'react'
import { GripVertical, X } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export interface SpecPackOutlineItem {
  id: string
  code: string
  title: string
}

interface SpecPackChapterOutlineProps {
  items: SpecPackOutlineItem[]
  activeId?: string | null
  onReorder: (orderedIds: string[]) => void
  onSelect?: (id: string) => void
  onRemove?: (id: string) => void
  className?: string
  emptyMessage?: string
}

/**
 * Word-style outline: numbered rows + HTML5 drag reorder.
 * Parent owns debounce/persist; this component only emits the new order immediately.
 */
export function SpecPackChapterOutline({
  items,
  activeId,
  onReorder,
  onSelect,
  onRemove,
  className,
  emptyMessage = 'No requirements in this pack.',
}: SpecPackChapterOutlineProps) {
  const dragFrom = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const onDragStart = (index: number) => (e: DragEvent) => {
    dragFrom.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const onDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overIndex !== index) setOverIndex(index)
  }

  const onDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    const from = dragFrom.current
    dragFrom.current = null
    setOverIndex(null)
    if (from == null || from === index) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    onReorder(next.map((i) => i.id))
  }

  const onDragEnd = () => {
    dragFrom.current = null
    setOverIndex(null)
  }

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center px-3 py-8', className)}>
        <Typography variant="small" tone="muted">
          {emptyMessage}
        </Typography>
      </div>
    )
  }

  return (
    <ul
      className={cn('min-h-0 flex-1 overflow-y-auto', className)}
      onDragLeave={() => setOverIndex(null)}
    >
      {items.map((item, index) => {
        const active = activeId === item.id
        const dropTarget = overIndex === index
        return (
          <li
            key={item.id}
            draggable
            onDragStart={onDragStart(index)}
            onDragOver={onDragOver(index)}
            onDrop={onDrop(index)}
            onDragEnd={onDragEnd}
            className={cn(
              'border-b border-neutral-100 transition-colors',
              dropTarget && 'border-t-2 border-t-neutral-800',
              active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
            )}
          >
            <div className="flex items-start gap-1 px-2 py-2">
              <span
                className="mt-0.5 inline-flex cursor-grab touch-none text-neutral-400 active:cursor-grabbing"
                aria-hidden
                title="Drag to reorder"
              >
                <GripVertical size={14} />
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect?.(item.id)}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="shrink-0 text-xs font-medium tabular-nums text-neutral-500">
                    {index + 1}.
                  </span>
                  <span className="truncate text-xs font-medium text-neutral-800">
                    {item.code}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 pl-[1.15rem] text-[11px] text-neutral-500">
                  {item.title}
                </p>
              </button>
              {onRemove ? (
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-800"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.code}`}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
