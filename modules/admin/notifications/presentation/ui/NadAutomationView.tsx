'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Badge, PageSkeleton, Typography, DataTable, Card } from '@/shared/ui'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'
import { useAutomationRules } from '../hooks/useAutomationRules'
import type { AutomationRuleRaw } from '../../domain/model/notification'

type AutomationTab = 'reminder' | 'alert' | 'digest'

const TABS: { id: AutomationTab; label: string; hint: string }[] = [
  {
    id: 'reminder',
    label: 'Reminder rules',
    hint: 'Time-based reminders. Full builder waits on BE condition/schedule schemas.',
  },
  {
    id: 'alert',
    label: 'Alert rules',
    hint: 'Threshold and status alerts. Prefer email rules for event→template routing.',
  },
  {
    id: 'digest',
    label: 'Digest rules',
    hint: 'Periodic digests. Schema-gated — read-only list until contract completes.',
  },
]

function ruleLabel(rule: AutomationRuleRaw): string {
  const name = rule.name ?? rule.code ?? rule.title
  return typeof name === 'string' && name.trim() ? name : rule.id
}

function ruleStatus(rule: AutomationRuleRaw): string | null {
  const status = rule.status
  return typeof status === 'string' ? status : null
}

export function NadAutomationView() {
  const [workspaceId, setWorkspaceId] = useState('')
  const [tab, setTab] = useState<AutomationTab>('reminder')
  const { reminderRules, alertRules, digestRules, loading, error } = useAutomationRules(
    workspaceId.trim() || null
  )

  const rules = tab === 'reminder' ? reminderRules : tab === 'alert' ? alertRules : digestRules

  return (
    <div>
      <div className="mb-2">
        <NextLink
          href={ADMIN_ROUTES.nadOverview}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Notification admin
        </NextLink>
      </div>
      <Typography as="h1" size="lg" weight="semibold" className="mb-2">
        Automation rules
      </Typography>
      <Typography tone="muted" className="mb-6">
        Thin NAD-05 shell. Lists reminder/alert/digest rules for a workspace when the list APIs
        respond. Create/edit waits on documented schemas — use{' '}
        <NextLink href={ADMIN_ROUTES.nadEmailRules} className="underline">
          email rules
        </NextLink>{' '}
        for event routing.
      </Typography>

      <div className="mb-6 max-w-md">
        <AdminWorkspaceSearchSelect value={workspaceId} onChange={setWorkspaceId} />
      </div>

      <nav
        aria-label="Automation rule types"
        className="mb-4 flex gap-1 border-b border-neutral-200"
      >
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setTab(t.id)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              )}
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      <Typography variant="small" tone="muted" className="mb-4">
        {TABS.find((t) => t.id === tab)?.hint}
      </Typography>

      {!workspaceId.trim() ? (
        <Card className="p-8 text-center">
          <Typography variant="small" tone="muted">
            Enter a workspace ID to load automation rules
          </Typography>
        </Card>
      ) : loading ? (
        <PageSkeleton variant="list" />
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <DataTable
            ariaLabel="Nad Automation"
            rows={rules}
            rowKey={(rule) => String(rule.id)}
            emptyMessage="No items."
            columns={[
              { id: 'id', header: 'ID', accessor: () => '—', kind: 'reference' },
              {
                id: 'label',
                header: 'Label',
                cell: (rule) => {
                  const status = ruleStatus(rule)
                  return <>{ruleLabel(rule)}</>
                },
              },
              {
                id: 'status',
                header: 'Status',
                cell: (rule) => {
                  const status = ruleStatus(rule)
                  return <>{status ? <Badge tone="neutral">{status}</Badge> : '—'}</>
                },
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
