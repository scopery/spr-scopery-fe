'use client'

import { useRef, useState, type DragEvent } from 'react'
import { GripVertical, Pencil, Plus, X } from 'lucide-react'
import { Button, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { SpecPackGroup, SpecPackRequirementRef } from '../model/spec-pack'
import { newSpecPackGroupId } from '../model/spec-pack'

interface SpecPackGroupOutlineProps {
  groups: SpecPackGroup[]
  activeRequirementId?: string | null
  onChange: (groups: SpecPackGroup[]) => void
  onSelectRequirement?: (id: string) => void
  /** Allow removing requirements from groups (create flow). */
  allowRemoveRequirement?: boolean
  /** Show add-group / edit name+description controls. */
  editableMeta?: boolean
  className?: string
}

type DragPayload =
  | { kind: 'group'; from: number }
  | { kind: 'req'; groupId: string; from: number }

/**
 * Nested Word-style outline: reorder groups, reorder requirements inside a group,
 * optionally edit group name/description.
 */
export function SpecPackGroupOutline({
  groups,
  activeRequirementId,
  onChange,
  onSelectRequirement,
  allowRemoveRequirement = false,
  editableMeta = true,
  className,
}: SpecPackGroupOutlineProps) {
  const dragRef = useRef<DragPayload | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const startEdit = (g: SpecPackGroup) => {
    setEditingGroupId(g.id)
    setEditName(g.name)
    setEditDescription(g.description ?? '')
  }

  const commitEdit = () => {
    if (!editingGroupId) return
    onChange(
      groups.map((g) =>
        g.id === editingGroupId
          ? {
              ...g,
              name: editName.trim() || 'Untitled group',
              description: editDescription.trim() || null,
            }
          : g
      )
    )
    setEditingGroupId(null)
  }

  const addGroup = () => {
    const next: SpecPackGroup = {
      id: newSpecPackGroupId(),
      name: `Group ${groups.length + 1}`,
      description: null,
      requirements: [],
    }
    onChange([...groups, next])
    startEdit(next)
  }

  const removeGroup = (groupId: string) => {
    if (groups.length <= 1) return
    const victim = groups.find((g) => g.id === groupId)
    if (!victim) return
    // Move orphaned reqs into the first remaining group.
    const rest = groups.filter((g) => g.id !== groupId)
    rest[0] = {
      ...rest[0],
      requirements: [...rest[0].requirements, ...victim.requirements],
    }
    onChange(rest)
  }

  const removeRequirement = (groupId: string, reqId: string) => {
    onChange(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, requirements: g.requirements.filter((r) => r.id !== reqId) }
          : g
      )
    )
  }

  const onDragStart = (payload: DragPayload) => (e: DragEvent) => {
    dragRef.current = payload
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', payload.kind)
  }

  const onDragEnd = () => {
    dragRef.current = null
    setOverKey(null)
  }

  const onGroupDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    setOverKey(`g:${index}`)
  }

  const onGroupDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    const drag = dragRef.current
    dragRef.current = null
    setOverKey(null)
    if (!drag || drag.kind !== 'group' || drag.from === index) return
    const next = [...groups]
    const [moved] = next.splice(drag.from, 1)
    next.splice(index, 0, moved)
    onChange(next)
  }

  const onReqDragOver = (groupId: string, index: number) => (e: DragEvent) => {
    e.preventDefault()
    setOverKey(`r:${groupId}:${index}`)
  }

  const onReqDrop = (groupId: string, index: number) => (e: DragEvent) => {
    e.preventDefault()
    const drag = dragRef.current
    dragRef.current = null
    setOverKey(null)
    if (!drag || drag.kind !== 'req') return

    const next = groups.map((g) => ({
      ...g,
      requirements: [...g.requirements],
    }))
    const fromGroup = next.find((g) => g.id === drag.groupId)
    const toGroup = next.find((g) => g.id === groupId)
    if (!fromGroup || !toGroup) return
    const [moved] = fromGroup.requirements.splice(drag.from, 1)
    if (!moved) return
    const insertAt =
      drag.groupId === groupId && drag.from < index ? index - 1 : index
    toGroup.requirements.splice(Math.max(0, insertAt), 0, moved)
    onChange(next)
  }

  if (groups.length === 0) {
    return (
      <div className={cn('flex flex-col items-center gap-2 px-3 py-8', className)}>
        <Typography variant="small" tone="muted">
          No groups yet.
        </Typography>
        {editableMeta ? (
          <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={addGroup}>
            Add group
          </Button>
        ) : null}
      </div>
    )
  }

  let reqOrdinal = 0

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {editableMeta ? (
        <div className="shrink-0 border-b border-neutral-100 px-2 py-2">
          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={addGroup} fullWidth>
            Add group
          </Button>
        </div>
      ) : null}

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {groups.map((group, gIndex) => (
          <li key={group.id} className="border-b border-neutral-200">
            <div
              draggable
              onDragStart={onDragStart({ kind: 'group', from: gIndex })}
              onDragOver={onGroupDragOver(gIndex)}
              onDrop={onGroupDrop(gIndex)}
              onDragEnd={onDragEnd}
              className={cn(
                'flex items-start gap-1 bg-neutral-50 px-2 py-2',
                overKey === `g:${gIndex}` && 'border-t-2 border-t-neutral-800'
              )}
            >
              <span className="mt-0.5 cursor-grab text-neutral-400 active:cursor-grabbing">
                <GripVertical size={14} />
              </span>
              <div className="min-w-0 flex-1">
                {editingGroupId === group.id ? (
                  <div className="space-y-1.5">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Group name"
                      fullWidth
                    />
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      fullWidth
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={commitEdit}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingGroupId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-neutral-800">
                        {gIndex + 1}. {group.name}
                      </span>
                      {editableMeta ? (
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-neutral-800"
                          onClick={() => startEdit(group)}
                          aria-label={`Edit ${group.name}`}
                        >
                          <Pencil size={12} />
                        </button>
                      ) : null}
                    </div>
                    {group.description ? (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-500">
                        {group.description}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      {group.requirements.length} requirement
                      {group.requirements.length === 1 ? '' : 's'}
                    </p>
                  </>
                )}
              </div>
              {editableMeta && groups.length > 1 ? (
                <button
                  type="button"
                  className="text-neutral-400 hover:text-neutral-800"
                  onClick={() => removeGroup(group.id)}
                  aria-label={`Remove group ${group.name}`}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <ul>
              {group.requirements.map((req, rIndex) => {
                reqOrdinal += 1
                const active = activeRequirementId === req.id
                return (
                  <li
                    key={req.id}
                    draggable
                    onDragStart={onDragStart({
                      kind: 'req',
                      groupId: group.id,
                      from: rIndex,
                    })}
                    onDragOver={onReqDragOver(group.id, rIndex)}
                    onDrop={onReqDrop(group.id, rIndex)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      'border-b border-neutral-100 last:border-b-0',
                      overKey === `r:${group.id}:${rIndex}` &&
                        'border-t-2 border-t-neutral-800',
                      active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                    )}
                  >
                    <div className="flex items-start gap-1 py-1.5 pl-6 pr-2">
                      <span className="mt-0.5 cursor-grab text-neutral-400 active:cursor-grabbing">
                        <GripVertical size={12} />
                      </span>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => onSelectRequirement?.(req.id)}
                      >
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] tabular-nums text-neutral-400">
                            {reqOrdinal}.
                          </span>
                          <span className="truncate text-xs font-medium text-neutral-800">
                            {req.code}
                          </span>
                        </div>
                        <p className="line-clamp-2 pl-4 text-[11px] text-neutral-500">
                          {req.title}
                        </p>
                      </button>
                      {allowRemoveRequirement ? (
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-neutral-800"
                          onClick={() => removeRequirement(group.id, req.id)}
                          aria-label={`Remove ${req.code}`}
                        >
                          <X size={12} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
              {/* Drop zone at end of group */}
              <li
                className="h-2"
                onDragOver={onReqDragOver(group.id, group.requirements.length)}
                onDrop={onReqDrop(group.id, group.requirements.length)}
              />
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function toRequirementRef(r: {
  id: string
  code: string
  title: string
  requirementType?: string | null
  req_type?: string | null
  type?: string | null
}): SpecPackRequirementRef {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    requirementType: r.requirementType ?? r.req_type ?? r.type ?? null,
  }
}
