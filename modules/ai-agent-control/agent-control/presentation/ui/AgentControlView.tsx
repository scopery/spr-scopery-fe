'use client'

import { Archive, Play, Plus } from 'lucide-react'

import { useState } from 'react'
import Link from 'next/link'
import { Box, Button, Input, Select, Typography, Badge, PageSkeleton } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAgentControl } from '../hooks/useAgentControl'
import { useAgentControlMutations } from '../hooks/useAgentControlMutations'
import { PromptRegistryPanel } from '@/modules/ai-agent-control/prompt-registry'
import { RuntimeUsagePanel } from '@/modules/ai-agent-control/runtime'

type Tab = 'agents' | 'model-policies' | 'prompts' | 'runtime'

export type AgentControlViewProps = {
  orgId: string
}

export function AgentControlView({ orgId }: AgentControlViewProps) {
  const [tab, setTab] = useState<Tab>('agents')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const {
    metadata,
    agents,
    policies,
    presets,
    canManage,
    canViewPrompts,
    canManagePrompts,
    canViewRuntime,
    canViewUsage,
    loading,
    refetch: reload,
  } = useAgentControl(orgId, { search, status: statusFilter })

  const mutations = useAgentControlMutations(orgId, () => void reload())

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  return (
    <Box className="space-y-6">
      <div>
        <Typography variant="h3">Agent & model control</Typography>
        <Typography variant="small" tone="muted">
          Centralized org configuration for AI agents, model policies, and prompt registry.
          Configuration only — does not execute AI calls. Token/cost tracking is Phase 20. Provider
          API keys stay in server environment variables, never in the database.
        </Typography>
      </div>

      <Typography
        as="div"
        variant="small"
        tone="muted"
        className="border-border bg-muted/30 rounded border p-3"
      >
        Platform runtime agents (answer improve, question generation, etc.) remain in the system
        registry at{' '}
        <Link href={ROUTES.admin.aiAgents} className="text-primary hover:underline">
          Admin → AI Agents
        </Link>
        . This page manages org-scoped agent definitions for future routing.
      </Typography>

      <div className="w-64">
        <Select
          value={tab}
          onValueChange={(v: string) => setTab(v as Tab)}
          options={[
            { value: 'agents', label: `Agents (${agents.length})` },
            { value: 'model-policies', label: `Model policies (${policies.length})` },
            ...(canViewPrompts ? [{ value: 'prompts' as const, label: 'Prompt registry' }] : []),
            ...(canViewRuntime || canViewUsage
              ? [{ value: 'runtime' as const, label: 'Runtime & usage' }]
              : []),
          ]}
          placeholder="Select section"
        />
      </div>

      {tab === 'prompts' && canViewPrompts ? (
        <PromptRegistryPanel orgId={orgId} canManage={canManagePrompts} agents={agents} />
      ) : tab === 'runtime' && (canViewRuntime || canViewUsage) ? (
        <RuntimeUsagePanel
          orgId={orgId}
          canViewRuntime={canViewRuntime}
          canViewUsage={canViewUsage}
          canViewPrompts={canViewPrompts}
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or key"
            />
            <Select
              label="Status"
              value={statusFilter}
              onValueChange={(v: string) => setStatusFilter(v)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {tab === 'agents' ? (
                <Button
                  variant="outline"
                  onClick={() => mutations.setShowAgentForm((v) => !v)}
                  icon={!mutations.showAgentForm ? <Plus size={16} /> : undefined}
                >
                  {mutations.showAgentForm ? 'Cancel agent' : 'New agent'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => mutations.setShowPolicyForm((v) => !v)}
                  icon={!mutations.showPolicyForm ? <Plus size={16} /> : undefined}
                >
                  {mutations.showPolicyForm ? 'Cancel policy' : 'New model policy'}
                </Button>
              )}
            </div>
          ) : null}

          {mutations.showAgentForm && canManage ? (
            <div className="border-border space-y-3 rounded-md border p-4">
              <Input
                label="Agent key"
                value={mutations.agentKey}
                onChange={(e) => mutations.setAgentKey(e.target.value)}
              />
              <Input
                label="Name"
                value={mutations.agentName}
                onChange={(e) => mutations.setAgentName(e.target.value)}
              />
              <Input
                label="Purpose"
                value={mutations.agentPurpose}
                onChange={(e) => mutations.setAgentPurpose(e.target.value)}
              />
              <Button
                variant="primary"
                loading={mutations.saving}
                onClick={() => void mutations.handleCreateAgent()} icon={<Plus size={16} />}>
                Create inactive agent
              </Button>
            </div>
          ) : null}

          {mutations.showPolicyForm && canManage ? (
            <div className="border-border space-y-3 rounded-md border p-4">
              <Input
                label="Policy key"
                value={mutations.policyKey}
                onChange={(e) => mutations.setPolicyKey(e.target.value)}
              />
              <Input
                label="Name"
                value={mutations.policyName}
                onChange={(e) => mutations.setPolicyName(e.target.value)}
              />
              <Select
                label="Provider"
                value={mutations.policyProvider}
                onValueChange={(v: string) => mutations.setPolicyProvider(v)}
                options={(metadata?.providers ?? ['openai']).map((p) => ({ value: p, label: p }))}
              />
              <Input
                label="Model name"
                value={mutations.policyModel}
                onChange={(e) => mutations.setPolicyModel(e.target.value)}
              />
              <Select
                label="Mode"
                value={mutations.policyMode}
                onValueChange={(v: string) => mutations.setPolicyMode(v)}
                options={(metadata?.modes ?? ['balanced']).map((m) => ({ value: m, label: m }))}
              />
              <Button
                variant="primary"
                loading={mutations.saving}
                onClick={() => void mutations.handleCreatePolicy()} icon={<Plus size={16} />}>
                Create inactive policy
              </Button>
            </div>
          ) : null}

          {tab === 'agents' ? (
            agents.length === 0 ? (
              <Typography variant="small" tone="muted">
                No agents configured yet.
              </Typography>
            ) : (
              <ul className="space-y-3">
                {agents.map((agent) => (
                  <li key={agent.id} className="border-border rounded-md border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Typography variant="small" weight="medium">
                          {agent.name}
                        </Typography>
                        <Typography variant="small" tone="muted">
                          {agent.agent_key} · {agent.purpose} · risk {agent.risk_level}
                        </Typography>
                        <Typography variant="small" tone="muted">
                          Default policy: {agent.default_model_policy_name ?? 'none'} ·{' '}
                          {agent.allowed_context_sources.length} context sources ·{' '}
                          {agent.allowed_actions.length} actions · Updated{' '}
                          {new Date(agent.updated_at).toLocaleDateString()}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="solid"
                          tone={agent.status === 'active' ? 'success' : 'neutral'}
                        >
                          {agent.status === 'active' ? 'Active' : agent.status === 'archived' ? 'Archived' : agent.status}
                        </Badge>
                        {canManage && agent.status !== 'archived' ? (
                          <Button
                            variant="ghost"
                            onClick={() => void mutations.archiveAgent(agent.id)} icon={<Archive size={16} />}>
                            Archive
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : policies.length === 0 ? (
            <Typography variant="small" tone="muted">
              No model policies configured yet.
            </Typography>
          ) : (
            <ul className="space-y-3">
              {policies.map((policy) => (
                <li key={policy.id} className="border-border rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Typography variant="small" weight="medium">
                        {policy.name}
                      </Typography>
                      <Typography variant="small" tone="muted">
                        {policy.policy_key} · {policy.provider}/{policy.model_name} · {policy.mode}
                      </Typography>
                      <Typography variant="small" tone="muted">
                        Cost {policy.cost_tier} · Latency {policy.latency_tier} · Quality{' '}
                        {policy.quality_tier}
                        {policy.fallback_policy_name
                          ? ` · Fallback: ${policy.fallback_policy_name}`
                          : ''}
                        {' · '}Updated {new Date(policy.updated_at).toLocaleDateString()}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="solid"
                        tone={policy.status === 'active' ? 'success' : 'neutral'}
                      >
                        {policy.status === 'active' ? 'Active' : policy.status === 'archived' ? 'Archived' : policy.status}
                      </Badge>
                      {canManage && policy.status !== 'archived' ? (
                        <Button
                          variant="ghost"
                          onClick={() => void mutations.archivePolicy(policy.id)} icon={<Archive size={16} />}>
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {presets.length > 0 && canManage ? (
            <div className="space-y-2">
              <Typography variant="small" weight="medium">
                Presets (apply as inactive)
              </Typography>
              <ul className="space-y-2">
                {presets.map((preset) => (
                  <li
                    key={preset.preset_key}
                    className="border-border flex flex-wrap items-center justify-between gap-2 rounded border p-3"
                  >
                    <div>
                      <Typography variant="small" weight="medium">
                        {preset.name}
                      </Typography>
                      <Typography variant="small" tone="muted">
                        {preset.description} · {preset.model_policies.length} policies ·{' '}
                        {preset.agents.length} agents
                      </Typography>
                    </div>
                    <Button
                      variant="outline"
                      loading={mutations.applyingPreset}
                      onClick={() => void mutations.handleApplyPreset(preset.preset_key)} icon={<Play size={16} />}>
                      Apply preset
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </Box>
  )
}
