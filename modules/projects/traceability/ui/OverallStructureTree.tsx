'use client'

import { useEffect, useRef } from 'react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type {
  OverallStructureModule,
  OverallStructureResponse,
  StructureFocus,
} from '../model/overall-structure'
import { StructureFocusType } from '../model/overall-structure'
import type { StructureExpandMap } from '../model/structure-tree-search'

interface OverallStructureTreeProps {
  tree: OverallStructureResponse
  focus: StructureFocus | null
  onFocus: (focus: StructureFocus) => void
  expandMap: StructureExpandMap
  onToggleExpand: (key: string) => void
  scrollToFocusId?: string | null
}

export function OverallStructureTree({
  tree,
  focus,
  onFocus,
  expandMap,
  onToggleExpand,
  scrollToFocusId,
}: OverallStructureTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollToFocusId || !containerRef.current) return
    const el = containerRef.current.querySelector(
      `[data-structure-node="${scrollToFocusId}"]`
    )
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [scrollToFocusId, expandMap])

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto p-3">
      {tree.modules.length === 0 &&
      !(tree.unassignedFunctions?.length || tree.unassignedEntities?.length) ? (
        <Typography variant="small" tone="muted" className="p-4 text-center">
          No modules yet. Create modules in Browse, then assign Functions and Entities.
        </Typography>
      ) : null}

      <ul className="space-y-2">
        {tree.modules.map((mod) => (
          <ModuleBranch
            key={mod.id}
            module={mod}
            focus={focus}
            onFocus={onFocus}
            open={expandMap[mod.id] !== false}
            expandMap={expandMap}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </ul>

      {(tree.unassignedFunctions?.length || tree.unassignedEntities?.length) ? (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <Typography
            variant="small"
            tone="muted"
            className="mb-2 text-[10px] uppercase tracking-wide"
          >
            Unassigned
          </Typography>
          <ul className="space-y-1">
            {tree.unassignedFunctions?.map((fn) => (
              <TreeRow
                key={fn.id}
                nodeId={fn.id}
                label={`${fn.code} · ${fn.title}`}
                active={
                  focus?.type === StructureFocusType.Function && focus.id === fn.id
                }
                onClick={() =>
                  onFocus({ type: StructureFocusType.Function, id: fn.id })
                }
                depth={0}
              />
            ))}
            {tree.unassignedEntities?.map((ent) => (
              <TreeRow
                key={ent.id}
                nodeId={ent.id}
                label={`${ent.code} · ${ent.name}`}
                active={
                  focus?.type === StructureFocusType.Entity && focus.id === ent.id
                }
                onClick={() =>
                  onFocus({ type: StructureFocusType.Entity, id: ent.id })
                }
                depth={0}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {tree.applicationNfrs && tree.applicationNfrs.length > 0 ? (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <Typography
            variant="small"
            tone="muted"
            className="mb-2 text-[10px] uppercase tracking-wide"
          >
            Application-wide NFRs
          </Typography>
          <ul className="space-y-1">
            {tree.applicationNfrs.map((nfr) => (
              <TreeRow
                key={nfr.id}
                nodeId={nfr.id}
                label={`${nfr.code} · ${nfr.title}`}
                active={focus?.type === StructureFocusType.Nfr && focus.id === nfr.id}
                onClick={() => onFocus({ type: StructureFocusType.Nfr, id: nfr.id })}
                depth={0}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ModuleBranch({
  module: mod,
  focus,
  onFocus,
  open,
  expandMap,
  onToggleExpand,
}: {
  module: OverallStructureModule
  focus: StructureFocus | null
  onFocus: (focus: StructureFocus) => void
  open: boolean
  expandMap: StructureExpandMap
  onToggleExpand: (key: string) => void
}) {
  const active = focus?.type === StructureFocusType.Module && focus.id === mod.id

  return (
    <li>
      <div className="flex items-stretch gap-0.5">
        <button
          type="button"
          className="px-1 text-xs text-neutral-400 hover:text-neutral-700"
          onClick={() => onToggleExpand(mod.id)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▾' : '▸'}
        </button>
        <TreeRow
          nodeId={mod.id}
          label={`${mod.code} · ${mod.name}`}
          active={active}
          onClick={() => onFocus({ type: StructureFocusType.Module, id: mod.id })}
          depth={0}
          className="flex-1"
        />
      </div>
      {open ? (
        <ul className="ml-3 border-l border-neutral-100 pl-2">
          {mod.functions.length > 0 ? (
            <li className="mt-1">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 text-[10px] uppercase tracking-wide"
              >
                Functions
              </Typography>
              <ul>
                {mod.functions.map((fn) => (
                  <FunctionBranch
                    key={fn.id}
                    functionId={fn.id}
                    code={fn.code}
                    title={fn.title}
                    screens={fn.screens}
                    apis={fn.apis}
                    communications={fn.communications ?? []}
                    focus={focus}
                    onFocus={onFocus}
                    open={expandMap[fn.id] !== false}
                    onToggleExpand={onToggleExpand}
                  />
                ))}
              </ul>
            </li>
          ) : null}

          {mod.entities.length > 0 ? (
            <li className="mt-2">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 text-[10px] uppercase tracking-wide"
              >
                Entities
              </Typography>
              <ul>
                {mod.entities.map((ent) => (
                  <TreeRow
                    key={ent.id}
                    nodeId={ent.id}
                    label={`${ent.code} · ${ent.name}`}
                    active={
                      focus?.type === StructureFocusType.Entity && focus.id === ent.id
                    }
                    onClick={() =>
                      onFocus({ type: StructureFocusType.Entity, id: ent.id })
                    }
                    depth={1}
                  />
                ))}
              </ul>
            </li>
          ) : null}

          {mod.scopedNfrs && mod.scopedNfrs.length > 0 ? (
            <li className="mt-2">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 text-[10px] uppercase tracking-wide"
              >
                Scoped NFRs
              </Typography>
              <ul>
                {mod.scopedNfrs.map((nfr) => (
                  <TreeRow
                    key={nfr.id}
                    nodeId={nfr.id}
                    label={`${nfr.code} · ${nfr.title}`}
                    active={
                      focus?.type === StructureFocusType.Nfr && focus.id === nfr.id
                    }
                    onClick={() =>
                      onFocus({ type: StructureFocusType.Nfr, id: nfr.id })
                    }
                    depth={1}
                  />
                ))}
              </ul>
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  )
}

function FunctionBranch({
  functionId,
  code,
  title,
  screens,
  apis,
  communications,
  focus,
  onFocus,
  open,
  onToggleExpand,
}: {
  functionId: string
  code: string
  title: string
  screens: OverallStructureModule['functions'][number]['screens']
  apis: OverallStructureModule['functions'][number]['apis']
  communications: NonNullable<
    OverallStructureModule['functions'][number]['communications']
  >
  focus: StructureFocus | null
  onFocus: (focus: StructureFocus) => void
  open: boolean
  onToggleExpand: (key: string) => void
}) {
  const active =
    focus?.type === StructureFocusType.Function && focus.id === functionId

  return (
    <li>
      <div className="flex items-stretch gap-0.5">
        <button
          type="button"
          className="px-1 text-xs text-neutral-400 hover:text-neutral-700"
          onClick={() => onToggleExpand(functionId)}
        >
          {open ? '▾' : '▸'}
        </button>
        <TreeRow
          nodeId={functionId}
          label={`${code} · ${title}`}
          active={active}
          onClick={() =>
            onFocus({ type: StructureFocusType.Function, id: functionId })
          }
          depth={1}
          className="flex-1"
        />
      </div>
      {open ? (
        <ul className="ml-4 border-l border-neutral-100 pl-2">
          {screens.length > 0 ? (
            <li className="mt-1">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 text-[10px] uppercase tracking-wide"
              >
                Screens
              </Typography>
              {screens.map((scr) => (
                <li key={scr.id}>
                  <TreeRow
                    nodeId={scr.id}
                    label={`${scr.code} · ${scr.name}${
                      scr.usedByFunctionCount && scr.usedByFunctionCount > 1
                        ? ` · Shared by ${scr.usedByFunctionCount}`
                        : ''
                    }`}
                    active={
                      focus?.type === StructureFocusType.Screen && focus.id === scr.id
                    }
                    onClick={() =>
                      onFocus({ type: StructureFocusType.Screen, id: scr.id })
                    }
                    depth={2}
                  />
                  {scr.components.length > 0 ? (
                    <ul className="ml-3">
                      {scr.components.map((c) => (
                        <TreeRow
                          key={c.id}
                          nodeId={c.id}
                          label={`${c.code} · ${c.name}`}
                          active={
                            focus?.type === StructureFocusType.Component &&
                            focus.id === c.id
                          }
                          onClick={() =>
                            onFocus({
                              type: StructureFocusType.Component,
                              id: c.id,
                            })
                          }
                          depth={3}
                        />
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </li>
          ) : null}
          {apis.length > 0 ? (
            <li className="mt-1">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 text-[10px] uppercase tracking-wide"
              >
                APIs
              </Typography>
              {apis.map((a) => (
                <TreeRow
                  key={a.id}
                  nodeId={a.id}
                  label={`${a.method} ${a.pathPattern}${
                    a.usedByFunctionCount && a.usedByFunctionCount > 1
                      ? ` · Shared by ${a.usedByFunctionCount}`
                      : ''
                  }`}
                  active={
                    focus?.type === StructureFocusType.ApiEndpoint && focus.id === a.id
                  }
                  onClick={() =>
                    onFocus({ type: StructureFocusType.ApiEndpoint, id: a.id })
                  }
                  depth={2}
                />
              ))}
            </li>
          ) : null}
          {communications.length > 0 ? (
            <li className="mt-1">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 text-[10px] uppercase tracking-wide"
              >
                Communications
              </Typography>
              {communications.map((c) => (
                <TreeRow
                  key={c.id}
                  nodeId={c.id}
                  label={`${c.code} · ${c.name}`}
                  active={
                    focus?.type === StructureFocusType.Communication &&
                    focus.id === c.id
                  }
                  onClick={() =>
                    onFocus({
                      type: StructureFocusType.Communication,
                      id: c.id,
                    })
                  }
                  depth={2}
                />
              ))}
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  )
}

function TreeRow({
  nodeId,
  label,
  active,
  onClick,
  depth,
  className,
}: {
  nodeId: string
  label: string
  active: boolean
  onClick: () => void
  depth: number
  className?: string
}) {
  return (
    <button
      type="button"
      data-structure-node={nodeId}
      onClick={onClick}
      className={cn(
        'block w-full truncate px-2 py-1 text-left text-sm',
        active
          ? 'bg-secondary text-white'
          : 'text-neutral-900 hover:bg-secondary/5',
        className
      )}
      style={{ paddingLeft: `${8 + depth * 4}px` }}
      title={label}
    >
      {label}
    </button>
  )
}
