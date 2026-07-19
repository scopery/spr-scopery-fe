'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Badge, Input, PageSkeleton, Typography } from '@/shared/ui'
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

  const rules =
    tab === 'reminder' ? reminderRules : tab === 'alert' ? alertRules : digestRules

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
        <Input
          label="Workspace ID"
          fullWidth
          placeholder="UUID of workspace to inspect"
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
        />
      </div>

      <nav aria-label="Automation rule types" className="mb-4 flex gap-1 border-b border-neutral-200">
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
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <Typography variant="small" tone="muted">
            Enter a workspace ID to load automation rules
          </Typography>
        </div>
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No rules returned
                    </Typography>
                  </td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const status = ruleStatus(rule)
                  return (
                    <tr key={rule.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">
                        <Typography as="span" variant="small" className="font-mono">
                          {rule.id}
                        </Typography>
                      </td>
                      <td className="px-4 py-3">{ruleLabel(rule)}</td>
                      <td className="px-4 py-3">
                        {status ? <Badge tone="neutral">{status}</Badge> : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
