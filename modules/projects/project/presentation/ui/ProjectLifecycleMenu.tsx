'use client'

import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button, ConfirmDialog, Stack } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  allowedProjectLifecycleActions,
  type ProjectLifecycleAction,
} from '../../domain/rules/project.rules'

const ACTION_LABEL: Record<ProjectLifecycleAction, string> = {
  activate: 'Activate',
  hold: 'Put on hold',
  complete: 'Complete',
  archive: 'Archive',
}

const ACTION_CONFIRM: Record<ProjectLifecycleAction, { title: string; body: string }> = {
  activate: {
    title: 'Activate project?',
    body: 'This will move the project to Active. Continue?',
  },
  hold: {
    title: 'Put project on hold?',
    body: 'Work will pause until the project is activated again.',
  },
  complete: {
    title: 'Complete project?',
    body: 'Mark this project as completed. This cannot be reversed from the UI.',
  },
  archive: {
    title: 'Archive project?',
    body: 'Archived projects are hidden from default lists.',
  },
}

interface ProjectLifecycleMenuProps {
  status: string
  disabled?: boolean
  loading?: boolean
  /** Prefer `top` when the trigger sits near the bottom of the page. */
  menuPlacement?: 'top' | 'bottom'
  onAction: (action: ProjectLifecycleAction) => Promise<void> | void
}

export function ProjectLifecycleMenu({
  status,
  disabled,
  loading,
  menuPlacement = 'bottom',
  onAction,
}: ProjectLifecycleMenuProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<ProjectLifecycleAction | null>(null)
  const [confirming, setConfirming] = useState(false)
  const actions = allowedProjectLifecycleActions(status)

  if (actions.length === 0) return null

  const handleConfirm = async () => {
    if (!pending) return
    setConfirming(true)
    try {
      await onAction(pending)
      setPending(null)
      setOpen(false)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="relative inline-flex">
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        icon={<MoreHorizontal size={16} />}
        aria-label="Project lifecycle actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Actions
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={cn(
              'absolute right-0 z-20 min-w-[10rem] border border-neutral-200 bg-white py-1 shadow-md',
              menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
            )}
          >
            <Stack direction="vertical" spacing="none">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  role="menuitem"
                  className="px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                  onClick={() => {
                    setOpen(false)
                    setPending(action)
                  }}
                >
                  {ACTION_LABEL[action]}
                </button>
              ))}
            </Stack>
          </div>
        </>
      )}
      {pending && (
        <ConfirmDialog
          open
          onClose={() => setPending(null)}
          onConfirm={handleConfirm}
          title={ACTION_CONFIRM[pending].title}
          message={ACTION_CONFIRM[pending].body}
          confirmLabel={ACTION_LABEL[pending]}
          variant={pending === 'archive' ? 'danger' : 'default'}
          loading={confirming}
        />
      )}
    </div>
  )
}
