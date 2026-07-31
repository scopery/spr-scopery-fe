'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Input, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useSupportConfiguration } from '../hooks/useSupportConfiguration'

export function SupportConfigurationView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    policies,
    queues,
    requestTypes,
    escalationRules,
    warranties,
    handovers,
    serviceProfiles,
    costInputs,
    efforts,
    knowledgeLinks,
    workLinks,
    metricSnapshots,
    loading,
    error,
    actionError,
    createPolicy,
    enableRule,
    disableRule,
    expireWarranty,
    finalizeHandover,
    approveCost,
  } = useSupportConfiguration(workspaceId)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  if (loading) return <PageSkeleton variant="list" className="px-3 py-3 lg:px-4" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="sm" className="px-3 py-3 lg:px-4">
      <Typography as="h1" size="md" weight="medium">
        Support Configuration
      </Typography>
      <Typography variant="small" tone="muted">
        Queues, request types, SLA policies, escalation rules, service profiles and warranties.
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <Typography variant="h4">SLA policies</Typography>
      <div className="flex flex-wrap gap-sm">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Policy code"
          aria-label="SLA policy code"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-label="SLA policy name"
        />
        <Button
          size="sm"
          disabled={!code.trim() || !name.trim()}
          onClick={() => {
            void createPolicy(code.trim(), name.trim()).then(() => {
              setCode('')
              setName('')
            })
          }}
        >
          Create SLA
        </Button>
      </div>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {policies.map((p) => (
          <li key={p.id} className="p-md">
            <Typography variant="small" weight="medium">
              {p.name}
            </Typography>
            <Typography variant="caption" tone="muted">
              {[
                p.policyCode,
                p.firstResponseMinutes && `${p.firstResponseMinutes}m first`,
                p.resolveMinutes && `${p.resolveMinutes}m resolve`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </li>
        ))}
      </ul>

      <Typography variant="h4">Queues</Typography>
      {queues.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No queues.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {queues.map((q) => (
            <li key={q.id} className="p-md text-sm">
              {q.name}
              {q.status ? ` · ${q.status}` : ''}
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Request types</Typography>
      {requestTypes.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No request types.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {requestTypes.map((r) => (
            <li key={r.id} className="p-md text-sm">
              {[r.code, r.name, r.status].filter(Boolean).join(' · ')}
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Escalation rules</Typography>
      {escalationRules.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No escalation rules.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {escalationRules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {rule.name}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {rule.status ?? (rule.enabled ? 'ENABLED' : 'DISABLED')}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void enableRule(rule.id)}>
                  Enable
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void disableRule(rule.id)}>
                  Disable
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Warranties</Typography>
      {warranties.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No warranties.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {warranties.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {w.name ?? 'Unnamed warranty'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[w.status, w.expiresAt].filter(Boolean).join(' · ')}
                </Typography>
              </div>
              <Button size="sm" variant="outline" onClick={() => void expireWarranty(w.id)}>
                Expire
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Handover packages</Typography>
      {handovers.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No handover packages.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {handovers.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {h.name ?? 'Unnamed handover package'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {h.status}
                </Typography>
              </div>
              <Button size="sm" variant="outline" onClick={() => void finalizeHandover(h.id)}>
                Finalize
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Service profiles</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {serviceProfiles.map((sp) => (
          <li key={sp.id} className="p-md text-sm">
            {[sp.name, sp.status].filter(Boolean).join(' · ')}
          </li>
        ))}
      </ul>

      <Typography variant="h4">Cost inputs</Typography>
      {costInputs.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No cost inputs.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {costInputs.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-md p-md">
              <Typography variant="small">
                {[c.name ?? 'Unnamed cost input', c.status, c.amount]
                  .filter((x) => x != null)
                  .join(' · ')}
              </Typography>
              <Button size="sm" variant="outline" onClick={() => void approveCost(c.id)}>
                Approve
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Efforts / links / metrics</Typography>
      <Typography variant="caption" tone="muted">
        Efforts: {efforts.length} · Knowledge links: {knowledgeLinks.length} · Work links:{' '}
        {workLinks.length} · Metric snapshots: {metricSnapshots.length}
      </Typography>
    </Stack>
  )
}
