'use client'

import { useState } from 'react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { IamUsersPanel } from './panels/IamUsersPanel'
import { IamRolesPanel } from './panels/IamRolesPanel'
import { IamRightsPanel } from './panels/IamRightsPanel'
import { IamGrantsPanel } from './panels/IamGrantsPanel'
import { IamAssignmentsPanel } from './panels/IamAssignmentsPanel'
import { IamResourcesPanel } from './panels/IamResourcesPanel'
import { IamAuthCheckPanel } from './panels/IamAuthCheckPanel'

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
  { id: 'rights', label: 'Rights' },
  { id: 'grants', label: 'Grants' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'resources', label: 'Resources' },
  { id: 'auth-check', label: 'Auth check' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminIamView() {
  const [tab, setTab] = useState<TabId>('users')

  return (
    <div className="mx-auto max-w-6xl">
      <Typography as="h1" size="lg" weight="semibold" className="mb-2">
        IAM — System administration
      </Typography>
      <Typography as="p" variant="small" tone="muted" className="mb-6">
        Manage users, roles, rights, grants, and authorization for the platform.
      </Typography>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <IamUsersPanel />}
      {tab === 'roles' && <IamRolesPanel />}
      {tab === 'rights' && <IamRightsPanel />}
      {tab === 'grants' && <IamGrantsPanel />}
      {tab === 'assignments' && <IamAssignmentsPanel />}
      {tab === 'resources' && <IamResourcesPanel />}
      {tab === 'auth-check' && <IamAuthCheckPanel />}
    </div>
  )
}
