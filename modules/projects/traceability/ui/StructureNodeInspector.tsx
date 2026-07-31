'use client'

import { Button, Typography } from '@/shared/ui'
import type {
  OverallStructureResponse,
  StructureFocus,
} from '../model/overall-structure'
import { StructureFocusType } from '../model/overall-structure'
import type { StructureAssignDragPayload } from '../model/structure-assign.rules'
import { StructureDropZones } from './StructureDropZones'

interface StructureNodeInspectorProps {
  tree: OverallStructureResponse | null
  focus: StructureFocus | null
  assigning?: boolean
  onAssign: (payload: StructureAssignDragPayload) => void
  onUnlinkScreen: (functionId: string, screenId: string, projectId?: string | null) => void
  onUnlinkApi: (functionId: string, apiId: string, projectId?: string | null) => void
  onUnlinkComponent: (screenId: string, componentId: string) => void
  onUnlinkEntity?: (entityId: string, moduleId: string) => void
  onClose?: () => void
}

export function findFocusLabel(
  tree: OverallStructureResponse | null,
  focus: StructureFocus | null
): { title: string; subtitle: string; path: string } {
  if (!tree || !focus) return { title: 'No selection', subtitle: '', path: '' }
  for (const mod of tree.modules) {
    if (focus.type === StructureFocusType.Module && mod.id === focus.id) {
      return { title: mod.name, subtitle: `Module · ${mod.code}`, path: mod.name }
    }
    for (const fn of mod.functions) {
      if (focus.type === StructureFocusType.Function && fn.id === focus.id) {
        return {
          title: fn.title,
          subtitle: `Function · ${fn.code}`,
          path: `${mod.name} / ${fn.title}`,
        }
      }
      for (const scr of fn.screens) {
        if (focus.type === StructureFocusType.Screen && scr.id === focus.id) {
          const shared =
            scr.usedByFunctionCount && scr.usedByFunctionCount > 1
              ? ` · Shared by ${scr.usedByFunctionCount}`
              : ''
          return {
            title: scr.name,
            subtitle: `Screen · ${scr.code}${shared}`,
            path: `${mod.name} / ${fn.title} / ${scr.name}`,
          }
        }
        for (const c of scr.components) {
          if (focus.type === StructureFocusType.Component && c.id === focus.id) {
            return {
              title: c.name,
              subtitle: `Component · ${c.code}`,
              path: `${mod.name} / ${fn.title} / ${scr.name}`,
            }
          }
        }
      }
      for (const a of fn.apis) {
        if (focus.type === StructureFocusType.ApiEndpoint && a.id === focus.id) {
          const shared =
            a.usedByFunctionCount && a.usedByFunctionCount > 1
              ? ` · Shared by ${a.usedByFunctionCount}`
              : ''
          return {
            title: a.name || a.pathPattern,
            subtitle: `API · ${a.method} ${a.pathPattern}${shared}`,
            path: `${mod.name} / ${fn.title}`,
          }
        }
      }
    }
    for (const ent of mod.entities) {
      if (focus.type === StructureFocusType.Entity && ent.id === focus.id) {
        return {
          title: ent.name,
          subtitle: `Entity · ${ent.code}`,
          path: `${mod.name} / Entities`,
        }
      }
    }
    for (const nfr of mod.scopedNfrs ?? []) {
      if (focus.type === StructureFocusType.Nfr && nfr.id === focus.id) {
        return {
          title: nfr.title,
          subtitle: `NFR · ${nfr.code}`,
          path: `${mod.name} / NFRs`,
        }
      }
    }
  }
  for (const fn of tree.unassignedFunctions ?? []) {
    if (focus.type === StructureFocusType.Function && fn.id === focus.id) {
      return { title: fn.title, subtitle: `Function · ${fn.code}`, path: 'Unassigned' }
    }
  }
  for (const ent of tree.unassignedEntities ?? []) {
    if (focus.type === StructureFocusType.Entity && ent.id === focus.id) {
      return { title: ent.name, subtitle: `Entity · ${ent.code}`, path: 'Unassigned' }
    }
  }
  for (const nfr of tree.applicationNfrs ?? []) {
    if (focus.type === StructureFocusType.Nfr && nfr.id === focus.id) {
      return {
        title: nfr.title,
        subtitle: `NFR · ${nfr.code}`,
        path: 'Application-wide',
      }
    }
  }
  return { title: 'Unavailable node', subtitle: focus.type, path: '' }
}

export function StructureNodeInspector({
  tree,
  focus,
  assigning = false,
  onAssign,
  onUnlinkScreen,
  onUnlinkApi,
  onUnlinkComponent,
  onUnlinkEntity,
  onClose,
}: StructureNodeInspectorProps) {
  const label = findFocusLabel(tree, focus)

  const linked = (() => {
    if (!tree || !focus) return null
    if (focus.type === StructureFocusType.Function) {
      for (const mod of tree.modules) {
        const fn = mod.functions.find((f) => f.id === focus.id)
        if (fn) {
          return {
            kind: 'function' as const,
            screens: fn.screens,
            apis: fn.apis,
            projectId: fn.projectId,
            functionId: fn.id,
          }
        }
      }
      for (const fn of tree.unassignedFunctions ?? []) {
        if (fn.id === focus.id) {
          return {
            kind: 'function' as const,
            screens: fn.screens ?? [],
            apis: fn.apis ?? [],
            projectId: fn.projectId,
            functionId: fn.id,
          }
        }
      }
    }
    if (focus.type === StructureFocusType.Screen) {
      for (const mod of tree.modules) {
        for (const fn of mod.functions) {
          const scr = fn.screens.find((s) => s.id === focus.id)
          if (scr) {
            return {
              kind: 'screen' as const,
              components: scr.components,
              screenId: scr.id,
            }
          }
        }
      }
    }
    if (focus.type === StructureFocusType.Module) {
      const mod = tree.modules.find((m) => m.id === focus.id)
      if (mod) {
        return {
          kind: 'module' as const,
          entities: mod.entities ?? [],
          functions: mod.functions ?? [],
          moduleId: mod.id,
        }
      }
    }
    return null
  })()

  if (!focus) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Typography weight="medium" size="sm">
          Selected / Drop
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Select a structure node to open the assignment dock.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-neutral-50/40">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-neutral-100 p-3">
        <div className="min-w-0">
          <Typography weight="medium" className="truncate">
            {label.title}
          </Typography>
          <Typography variant="small" tone="muted" className="truncate">
            {label.subtitle}
          </Typography>
          {label.path ? (
            <Typography variant="small" tone="muted" className="mt-0.5 truncate text-[11px]">
              {label.path}
            </Typography>
          ) : null}
        </div>
        {onClose ? (
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close dock">
            Close
          </Button>
        ) : null}
      </div>

      <StructureDropZones
        focus={focus}
        focusLabel={label.title}
        assigning={assigning}
        onAssign={onAssign}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {linked?.kind === 'function' ? (
          <div className="space-y-3">
            <LinkedList
              title="Linked screens"
              empty="None yet."
              items={linked.screens.map((s) => ({
                id: s.id,
                label: `${s.code} · ${s.name}${
                  s.usedByFunctionCount && s.usedByFunctionCount > 1
                    ? ` · Shared by ${s.usedByFunctionCount}`
                    : ''
                }`,
                onUnlink: () =>
                  onUnlinkScreen(linked.functionId, s.id, linked.projectId),
              }))}
            />
            <LinkedList
              title="Linked APIs"
              empty="None yet."
              items={linked.apis.map((a) => ({
                id: a.id,
                label: `${a.method} ${a.pathPattern}${
                  a.usedByFunctionCount && a.usedByFunctionCount > 1
                    ? ` · Shared by ${a.usedByFunctionCount}`
                    : ''
                }`,
                onUnlink: () => onUnlinkApi(linked.functionId, a.id, linked.projectId),
              }))}
            />
          </div>
        ) : null}

        {linked?.kind === 'screen' ? (
          <LinkedList
            title="Linked components"
            empty="None yet."
            items={linked.components.map((c) => ({
              id: c.id,
              label: `${c.code} · ${c.name}`,
              onUnlink: () => onUnlinkComponent(linked.screenId, c.id),
            }))}
          />
        ) : null}

        {linked?.kind === 'module' ? (
          <div className="space-y-3">
            <LinkedList
              title="Owned entities"
              empty="None yet."
              items={linked.entities.map((e) => ({
                id: e.id,
                label: `${e.code} · ${e.name}`,
                onUnlink: () => onUnlinkEntity?.(e.id, linked.moduleId),
              }))}
            />
            <div>
              <Typography weight="medium" size="sm" className="mb-1">
                Functions in module
              </Typography>
              {linked.functions.length === 0 ? (
                <Typography variant="small" tone="muted">
                  None yet.
                </Typography>
              ) : (
                <ul className="space-y-1">
                  {linked.functions.map((fn) => (
                    <li key={fn.id} className="truncate text-sm text-neutral-900">
                      {fn.code} · {fn.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function LinkedList({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: { id: string; label: string; onUnlink: () => void }[]
}) {
  return (
    <div>
      <Typography weight="medium" size="sm" className="mb-1">
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="small" tone="muted">
          {empty}
        </Typography>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-neutral-900">{item.label}</span>
              <Button size="sm" variant="ghost" onClick={item.onUnlink}>
                Unlink
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
