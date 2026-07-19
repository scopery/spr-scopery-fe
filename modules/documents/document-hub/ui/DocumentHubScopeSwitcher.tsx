'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export type DocumentHubScopeKind = 'workspace' | 'project' | 'personal'

export interface DocumentHubScopeOption {
  kind: DocumentHubScopeKind
  id: string
  label: string
  projectId?: string
}

export interface DocumentHubScopeSwitcherProps {
  workspaceName: string
  workspaceId: string
  projects: { id: string; name: string }[]
  scope: DocumentHubScopeOption
  onChange: (scope: DocumentHubScopeOption) => void
}

export function DocumentHubScopeSwitcher({
  workspaceName,
  workspaceId,
  projects,
  scope,
  onChange,
}: DocumentHubScopeSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({ top: rect.bottom + 4, left: rect.left })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  const select = (next: DocumentHubScopeOption) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 border border-neutral-200 bg-white px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-neutral-50',
          open && 'bg-neutral-50'
        )}
      >
        <span className="shrink-0 text-xs text-neutral-500">Scope:</span>
        <span className="truncate text-sm font-medium text-neutral-900">{scope.label}</span>
        <ChevronDown size={14} className="shrink-0 text-neutral-400" aria-hidden />
      </button>

      {open && position && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              className="fixed z-[100] max-h-80 w-64 overflow-y-auto border border-neutral-200 bg-white shadow-lg"
              style={{ top: position.top, left: position.left }}
            >
              <div className="px-2.5 py-2">
                <Typography
                  as="p"
                  variant="caption"
                  tone="muted"
                  className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide"
                >
                  Workspaces
                </Typography>
                <button
                  type="button"
                  role="option"
                  aria-selected={scope.kind === 'workspace'}
                  className="flex w-full items-center gap-2 px-1.5 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                  onClick={() =>
                    select({
                      kind: 'workspace',
                      id: workspaceId,
                      label: workspaceName,
                    })
                  }
                >
                  <span className="min-w-0 flex-1 truncate">{workspaceName}</span>
                  {scope.kind === 'workspace' ? (
                    <Check size={14} className="shrink-0 text-primary" />
                  ) : null}
                </button>
              </div>

              {projects.length > 0 ? (
                <div className="border-t border-neutral-100 px-2.5 py-2">
                  <Typography
                    as="p"
                    variant="caption"
                    tone="muted"
                    className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide"
                  >
                    Projects
                  </Typography>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={scope.kind === 'project' && scope.projectId === p.id}
                      className="flex w-full items-center gap-2 px-1.5 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                      onClick={() =>
                        select({
                          kind: 'project',
                          id: p.id,
                          label: p.name,
                          projectId: p.id,
                        })
                      }
                    >
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      {scope.kind === 'project' && scope.projectId === p.id ? (
                        <Check size={14} className="shrink-0 text-primary" />
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="border-t border-neutral-100 px-2.5 py-2">
                <Typography
                  as="p"
                  variant="caption"
                  tone="muted"
                  className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide"
                >
                  Personal
                </Typography>
                <button
                  type="button"
                  role="option"
                  aria-selected={scope.kind === 'personal'}
                  className="flex w-full items-center gap-2 px-1.5 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                  onClick={() =>
                    select({
                      kind: 'personal',
                      id: 'personal',
                      label: 'My Documents',
                    })
                  }
                >
                  <span className="min-w-0 flex-1 truncate">My Documents</span>
                  {scope.kind === 'personal' ? (
                    <Check size={14} className="shrink-0 text-primary" />
                  ) : null}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
