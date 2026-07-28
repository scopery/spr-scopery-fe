'use client'

import { Button, Typography } from '@/shared/ui'
import { Check, Circle } from 'lucide-react'

interface WorkspaceSetupStateProps {
  hasProjects: boolean
  memberCount: number
  hasPhases: boolean
  onCreateProject: () => void
  canCreateProjects: boolean
}

export function WorkspaceSetupState({
  hasProjects,
  memberCount,
  hasPhases,
  onCreateProject,
  canCreateProjects,
}: WorkspaceSetupStateProps) {
  const steps = [
    { done: true, label: 'Workspace created' },
    { done: hasProjects, label: 'Create the first Project' },
    { done: memberCount > 1, label: 'Invite members' },
    { done: hasProjects, label: 'Assign a Project Manager' },
    { done: hasPhases, label: 'Add Project phases' },
  ]

  return (
    <section className="border border-neutral-200 bg-white px-6 py-10 text-center">
      <Typography as="h2" size="lg" weight="semibold" className="text-neutral-900">
        Set up your Workspace portfolio
      </Typography>
      <Typography variant="small" tone="muted" className="mx-auto mt-2 max-w-md">
        Create Projects and assign Project Managers to unlock portfolio insights.
      </Typography>
      <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            {s.done ? (
              <Check size={16} className="text-success" aria-hidden />
            ) : (
              <Circle size={16} className="text-neutral-300" aria-hidden />
            )}
            <Typography variant="small" tone={s.done ? undefined : 'muted'}>
              {s.label}
            </Typography>
          </li>
        ))}
      </ul>
      {canCreateProjects ? (
        <Button variant="primary" className="mt-6" onClick={onCreateProject}>
          Create Project
        </Button>
      ) : null}
    </section>
  )
}
