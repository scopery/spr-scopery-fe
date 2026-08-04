'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  Pencil,
  Plus,
  Undo2,
  X,
} from 'lucide-react'
import { Button, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { SpecPackGroup, SpecPackRequirementRef } from '../model/spec-pack'
import { newSpecPackGroupId } from '../model/spec-pack'

interface SpecPackGroupOutlineProps {
  groups: SpecPackGroup[]
  activeRequirementId?: string | null
  onChange?: (groups: SpecPackGroup[]) => void
  onSelectRequirement?: (id: string) => void
  /** Allow removing requirements from groups (create / edit modal). */
  allowRemoveRequirement?: boolean
  /** Show add-group / edit name+description / remove-group controls. */
  editableMeta?: boolean
  /** Enable Ctrl/Cmd+Z undo for outline edits. */
  enableUndo?: boolean
  /**
   * Sidebar browse mode: requirements are read-only (no drag/remove).
   * Pencil opens external editor via onRequestEdit.
   */
  browseOnly?: boolean
  /** Called when user clicks pencil in browseOnly (or when provided instead of inline edit). */
  onRequestEdit?: (groupId: string) => void
  /** Expand this group on mount (edit modal focus). */
  initiallyExpandGroupId?: string | null
  className?: string
}

type DragPayload =
  | { kind: 'group'; from: number }
  | { kind: 'req'; groupId: string; from: number }

const UNDO_LIMIT = 40

function cloneGroups(groups: SpecPackGroup[]): SpecPackGroup[] {
  return groups.map((g) => ({
    ...g,
    requirements: [...g.requirements],
  }))
}

/**
 * Flat groups only (no nesting): drag a group to swap order with another group;
 * drag requirements within / across groups; expand/collapse; undo.
 */
export function SpecPackGroupOutline({
  groups,
  activeRequirementId,
  onChange,
  onSelectRequirement,
  allowRemoveRequirement = false,
  editableMeta = true,
  enableUndo = true,
  browseOnly = false,
  onRequestEdit,
  initiallyExpandGroupId = null,
  className,
}: SpecPackGroupOutlineProps) {
  const dragRef = useRef<DragPayload | null>(null)
  const undoStackRef = useRef<SpecPackGroup[][]>([])
  const groupsRef = useRef(groups)
  groupsRef.current = groups
  const rootRef = useRef<HTMLDivElement | null>(null)
  const groupBlockRefs = useRef<Map<string, HTMLElement>>(new Map())

  const [overKey, setOverKey] = useState<string | null>(null)
  const [draggingKind, setDraggingKind] = useState<'group' | 'req' | null>(null)
  const [draggingGroupFrom, setDraggingGroupFrom] = useState<number | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [canUndo, setCanUndo] = useState(false)

  const canMutate = !browseOnly && Boolean(onChange)
  const showMeta = editableMeta && canMutate
  const showUndo = enableUndo && canMutate
  const canDragGroups = canMutate
  const canDragReqs = canMutate
  const canRemoveReqs = allowRemoveRequirement && canMutate

  useEffect(() => {
    if (!initiallyExpandGroupId) return
    setCollapsed(new Set(groups.map((g) => g.id).filter((id) => id !== initiallyExpandGroupId)))
    // Scroll focused group into view after paint.
    requestAnimationFrame(() => {
      groupBlockRefs.current.get(initiallyExpandGroupId)?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    })
    // Only on mount / focus id change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initiallyExpandGroupId])

  const commit = useCallback(
    (next: SpecPackGroup[]) => {
      if (!onChange || browseOnly) return
      if (enableUndo) {
        undoStackRef.current = [
          ...undoStackRef.current.slice(-(UNDO_LIMIT - 1)),
          cloneGroups(groupsRef.current),
        ]
        setCanUndo(true)
      }
      onChange(next)
    },
    [browseOnly, enableUndo, onChange]
  )

  const undo = useCallback(() => {
    const prev = undoStackRef.current.pop()
    setCanUndo(undoStackRef.current.length > 0)
    if (!prev || !onChange) return
    onChange(prev)
  }, [onChange])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!showUndo) return
      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.key.toLowerCase() !== 'z' || e.shiftKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (
        rootRef.current &&
        document.activeElement &&
        !rootRef.current.contains(document.activeElement) &&
        document.activeElement !== document.body
      ) {
        return
      }
      e.preventDefault()
      undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showUndo, undo])

  const startEdit = (g: SpecPackGroup) => {
    if (onRequestEdit) {
      onRequestEdit(g.id)
      return
    }
    if (!canMutate) return
    setEditingGroupId(g.id)
    setEditName(g.name)
    setEditDescription(g.description ?? '')
  }

  const commitEdit = () => {
    if (!editingGroupId) return
    commit(
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
    commit([...groups, next])
    setCollapsed((prev) => {
      const n = new Set(prev)
      n.delete(next.id)
      return n
    })
    startEdit(next)
  }

  const removeGroup = (groupId: string) => {
    if (groups.length <= 1) return
    const victim = groups.find((g) => g.id === groupId)
    if (!victim) return
    const rest = groups.filter((g) => g.id !== groupId)
    rest[0] = {
      ...rest[0],
      requirements: [...rest[0].requirements, ...victim.requirements],
    }
    commit(rest)
  }

  const removeRequirement = (groupId: string, reqId: string) => {
    commit(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, requirements: g.requirements.filter((r) => r.id !== reqId) }
          : g
      )
    )
  }

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => setCollapsed(new Set(groups.map((g) => g.id)))
  const toggleCollapsed = (groupId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const allCollapsed =
    groups.length > 0 && groups.every((g) => collapsed.has(g.id))

  const clearDrag = () => {
    dragRef.current = null
    setDraggingKind(null)
    setDraggingGroupFrom(null)
    setOverKey(null)
  }

  const onGroupHandleDragStart = (from: number, groupId: string) => (e: DragEvent) => {
    dragRef.current = { kind: 'group', from }
    setDraggingKind('group')
    setDraggingGroupFrom(from)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', 'group')
    const block = groupBlockRefs.current.get(groupId)
    if (block) {
      try {
        e.dataTransfer.setDragImage(block, 16, 16)
      } catch {
        // Some browsers reject custom drag images — ignore.
      }
    }
  }

  const onReqDragStart = (groupId: string, from: number) => (e: DragEvent) => {
    e.stopPropagation()
    dragRef.current = { kind: 'req', groupId, from }
    setDraggingKind('req')
    setDraggingGroupFrom(null)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', 'req')
  }

  const onGroupDragOver = (index: number) => (e: DragEvent) => {
    if (dragRef.current?.kind !== 'group') return
    e.preventDefault()
    e.stopPropagation()
    setOverKey(`g:${index}`)
  }

  const onGroupDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const drag = dragRef.current
    clearDrag()
    if (!drag || drag.kind !== 'group' || drag.from === index) return
    // Flat reorder only — whole group (with its requirements) moves as one unit.
    const next = [...groups]
    const [moved] = next.splice(drag.from, 1)
    next.splice(index, 0, moved)
    commit(next)
  }

  const onReqDragOver = (groupId: string, index: number) => (e: DragEvent) => {
    if (dragRef.current?.kind !== 'req') return
    e.preventDefault()
    e.stopPropagation()
    setOverKey(`r:${groupId}:${index}`)
  }

  const onReqDrop = (groupId: string, index: number) => (e: DragEvent) => {
    if (dragRef.current?.kind !== 'req') return
    e.preventDefault()
    e.stopPropagation()
    const drag = dragRef.current
    clearDrag()
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
    commit(next)
  }

  const onRootKeyDown = (e: ReactKeyboardEvent) => {
    if (!showUndo) return
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }
  }

  if (groups.length === 0) {
    return (
      <div className={cn('flex flex-col items-center gap-2 px-3 py-8', className)}>
        <Typography variant="small" tone="muted">
          No groups yet.
        </Typography>
        {showMeta ? (
          <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={addGroup}>
            Add group
          </Button>
        ) : null}
      </div>
    )
  }

  let reqOrdinal = 0

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onRootKeyDown}
      className={cn('flex min-h-0 flex-1 flex-col outline-none', className)}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-neutral-100 px-2 py-2">
        {showMeta ? (
          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={addGroup}>
            Add group
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          icon={
            allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />
          }
          onClick={() => (allCollapsed ? expandAll() : collapseAll())}
        >
          {allCollapsed ? 'Expand all' : 'Collapse all'}
        </Button>
        {showUndo ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<Undo2 size={14} />}
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl/⌘Z)"
          >
            Undo
          </Button>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {groups.map((group, gIndex) => {
          const isCollapsed = collapsed.has(group.id)
          const isGroupDragOver =
            canDragGroups && draggingKind === 'group' && overKey === `g:${gIndex}`
          const isDraggingThis = canDragGroups && draggingGroupFrom === gIndex

          return (
            <li
              key={group.id}
              ref={(el) => {
                if (el) groupBlockRefs.current.set(group.id, el)
                else groupBlockRefs.current.delete(group.id)
              }}
              data-group-block
              onDragOver={canDragGroups ? onGroupDragOver(gIndex) : undefined}
              onDrop={canDragGroups ? onGroupDrop(gIndex) : undefined}
              className={cn(
                'border-b border-neutral-200 bg-white',
                isGroupDragOver && 'border-t-2 border-t-neutral-800',
                isDraggingThis && 'opacity-40'
              )}
            >
              <div className="flex items-start gap-1 bg-neutral-50 px-2 py-2">
                {canDragGroups ? (
                  <span
                    draggable={editingGroupId !== group.id}
                    onDragStart={onGroupHandleDragStart(gIndex, group.id)}
                    onDragEnd={clearDrag}
                    className="mt-0.5 cursor-grab text-neutral-400 active:cursor-grabbing"
                    title="Drag group to reorder"
                    aria-label={`Drag group ${group.name}`}
                  >
                    <GripVertical size={14} />
                  </span>
                ) : null}
                <button
                  type="button"
                  className="mt-0.5 shrink-0 px-0.5 text-[10px] font-medium text-neutral-500 hover:text-neutral-800"
                  onClick={() => toggleCollapsed(group.id)}
                  aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
                <div className="min-w-0 flex-1">
                  {editingGroupId === group.id && canMutate ? (
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
                        {showMeta || onRequestEdit ? (
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
                        {isCollapsed ? ' · collapsed' : ''}
                      </p>
                    </>
                  )}
                </div>
                {showMeta && groups.length > 1 ? (
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

              {!isCollapsed ? (
                <ul>
                  {group.requirements.map((req, rIndex) => {
                    reqOrdinal += 1
                    const active = activeRequirementId === req.id
                    return (
                      <li
                        key={req.id}
                        draggable={canDragReqs}
                        onDragStart={
                          canDragReqs ? onReqDragStart(group.id, rIndex) : undefined
                        }
                        onDragOver={
                          canDragReqs ? onReqDragOver(group.id, rIndex) : undefined
                        }
                        onDrop={canDragReqs ? onReqDrop(group.id, rIndex) : undefined}
                        onDragEnd={canDragReqs ? clearDrag : undefined}
                        className={cn(
                          'border-b border-neutral-100 last:border-b-0',
                          overKey === `r:${group.id}:${rIndex}` &&
                            draggingKind === 'req' &&
                            'border-t-2 border-t-neutral-800',
                          active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-start gap-1 py-1.5 pr-2',
                            browseOnly ? 'pl-5' : 'pl-6'
                          )}
                        >
                          {canDragReqs ? (
                            <span className="mt-0.5 cursor-grab text-neutral-400 active:cursor-grabbing">
                              <GripVertical size={12} />
                            </span>
                          ) : null}
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
                          {canRemoveReqs ? (
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
                  {canDragReqs ? (
                    <li
                      className="h-2"
                      onDragOver={onReqDragOver(group.id, group.requirements.length)}
                      onDrop={onReqDrop(group.id, group.requirements.length)}
                    />
                  ) : null}
                </ul>
              ) : null}
            </li>
          )
        })}
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
