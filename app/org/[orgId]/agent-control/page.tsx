'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Box, Button, Input, Select, Typography, ContentLoader, Badge } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as agentControlService from '@/services/agent-control.service'
import { ApiError } from '@/types/api'
import { PromptRegistryPanel } from './_components/prompt-registry-panel'
import { RuntimeUsagePanel } from './_components/runtime-usage-panel'
import { useAgentControl } from '@/hooks/useAgentControl'

type Tab = 'agents' | 'model-policies' | 'prompts' | 'runtime'

export default function AgentControlPage() {
  const params = useParams()
  const orgId = params.orgId as string

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
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [showPolicyForm, setShowPolicyForm] = useState(false)
  const [agentKey, setAgentKey] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentPurpose, setAgentPurpose] = useState('')
  const [policyKey, setPolicyKey] = useState('')
  const [policyName, setPolicyName] = useState('')
  const [policyProvider, setPolicyProvider] = useState('openai')
  const [policyModel, setPolicyModel] = useState('gpt-4o-mini')
  const [policyMode, setPolicyMode] = useState('balanced')
  const [saving, setSaving] = useState(false)
  const [applyingPreset, setApplyingPreset] = useState(false)


  const handleCreateAgent = async () => {
    if (!agentKey.trim() || !agentName.trim() || !agentPurpose.trim()) {
      toast.error('Agent key, name, and purpose are required')
      return
    }
    setSaving(true)
    try {
      await agentControlService.createOrgAgent(orgId, {
        agent_key: agentKey.trim(),
        name: agentName.trim(),
        purpose: agentPurpose.trim(),
        status: 'inactive',
      })
      toast.success('Agent created (inactive)')
      setShowAgentForm(false)
      setAgentKey('')
      setAgentName('')
      setAgentPurpose('')
      void reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create agent')
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePolicy = async () => {
    if (!policyKey.trim() || !policyName.trim()) {
      toast.error('Policy key and name are required')
      return
    }
    setSaving(true)
    try {
      await agentControlService.createOrgModelPolicy(orgId, {
        policy_key: policyKey.trim(),
        name: policyName.trim(),
        provider: policyProvider,
        model_name: policyModel.trim(),
        mode: policyMode,
        status: 'inactive',
      })
      toast.success('Model policy created (inactive)')
      setShowPolicyForm(false)
      setPolicyKey('')
      setPolicyName('')
      void reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create model policy')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyPreset = async (presetKey: string) => {
    setApplyingPreset(true)
    try {
      await agentControlService.applyAgentControlPreset(orgId, {
        preset_key: presetKey,
        activate: false,
      })
      toast.success('Preset applied as inactive configuration')
      void reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to apply preset')
    } finally {
      setApplyingPreset(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
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

      <div className="rounded border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        Platform runtime agents (answer improve, question generation, etc.) remain in the system
        registry at{' '}
        <Link href={ROUTES.admin.aiAgents} className="text-primary hover:underline">
          Admin → AI Agents
        </Link>
        . This page manages org-scoped agent definitions for future routing.
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === 'agents' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setTab('agents')}
        >
          Agents ({agents.length})
        </Button>
        <Button
          variant={tab === 'model-policies' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setTab('model-policies')}
        >
          Model policies ({policies.length})
        </Button>
        {canViewPrompts ? (
          <Button
            variant={tab === 'prompts' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('prompts')}
          >
            Prompt registry
          </Button>
        ) : null}
        {canViewRuntime || canViewUsage ? (
          <Button
            variant={tab === 'runtime' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('runtime')}
          >
            Runtime & usage
          </Button>
        ) : null}
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
            <Button variant="outline" size="sm" onClick={() => setShowAgentForm((v) => !v)}>
              {showAgentForm ? 'Cancel agent' : 'New agent'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPolicyForm((v) => !v)}>
              {showPolicyForm ? 'Cancel policy' : 'New model policy'}
            </Button>
          )}
        </div>
      ) : null}

      {showAgentForm && canManage ? (
        <div className="space-y-3 rounded-md border border-border p-4">
          <Input label="Agent key" value={agentKey} onChange={(e) => setAgentKey(e.target.value)} />
          <Input label="Name" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
          <Input
            label="Purpose"
            value={agentPurpose}
            onChange={(e) => setAgentPurpose(e.target.value)}
          />
          <Button variant="primary" size="sm" loading={saving} onClick={() => void handleCreateAgent()}>
            Create inactive agent
          </Button>
        </div>
      ) : null}

      {showPolicyForm && canManage ? (
        <div className="space-y-3 rounded-md border border-border p-4">
          <Input label="Policy key" value={policyKey} onChange={(e) => setPolicyKey(e.target.value)} />
          <Input label="Name" value={policyName} onChange={(e) => setPolicyName(e.target.value)} />
          <Select
            label="Provider"
            value={policyProvider}
            onValueChange={(v: string) => setPolicyProvider(v)}
            options={(metadata?.providers ?? ['openai']).map((p) => ({ value: p, label: p }))}
          />
          <Input
            label="Model name"
            value={policyModel}
            onChange={(e) => setPolicyModel(e.target.value)}
          />
          <Select
            label="Mode"
            value={policyMode}
            onValueChange={(v: string) => setPolicyMode(v)}
            options={(metadata?.modes ?? ['balanced']).map((m) => ({ value: m, label: m }))}
          />
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={() => void handleCreatePolicy()}
          >
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
              <li key={agent.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Typography variant="small" className="font-medium">
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
                      variant="soft"
                      tone={agent.status === 'active' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {agent.status}
                    </Badge>
                    {canManage && agent.status !== 'archived' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          void agentControlService
                            .archiveOrgAgent(orgId, agent.id)
                            .then(() => {
                              toast.success('Agent archived')
                              void reload()
                            })
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError ? err.message : 'Failed to archive agent'
                              )
                            )
                        }
                      >
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
            <li key={policy.id} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <Typography variant="small" className="font-medium">
                    {policy.name}
                  </Typography>
                  <Typography variant="small" tone="muted">
                    {policy.policy_key} · {policy.provider}/{policy.model_name} · {policy.mode}
                  </Typography>
                  <Typography variant="small" tone="muted">
                    Cost {policy.cost_tier} · Latency {policy.latency_tier} · Quality{' '}
                    {policy.quality_tier}
                    {policy.fallback_policy_name ? ` · Fallback: ${policy.fallback_policy_name}` : ''}
                    {' · '}Updated {new Date(policy.updated_at).toLocaleDateString()}
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="soft"
                    tone={policy.status === 'active' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {policy.status}
                  </Badge>
                  {canManage && policy.status !== 'archived' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void agentControlService
                          .archiveOrgModelPolicy(orgId, policy.id)
                          .then(() => {
                            toast.success('Model policy archived')
                            void reload()
                          })
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError ? err.message : 'Failed to archive policy'
                            )
                          )
                      }
                    >
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
          <Typography variant="small" className="font-medium">
            Presets (apply as inactive)
          </Typography>
          <ul className="space-y-2">
            {presets.map((preset) => (
              <li
                key={preset.preset_key}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3"
              >
                <div>
                  <Typography variant="small" className="font-medium">
                    {preset.name}
                  </Typography>
                  <Typography variant="small" tone="muted">
                    {preset.description} · {preset.model_policies.length} policies ·{' '}
                    {preset.agents.length} agents
                  </Typography>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  loading={applyingPreset}
                  onClick={() => void handleApplyPreset(preset.preset_key)}
                >
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
