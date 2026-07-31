'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useAuth } from '@/modules/auth'
import { useDeployments } from '@/modules/ai-agent-admin/deployments'
import { Button, ConfirmDialog, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { AgentStatus } from '../../domain/enums/agent.enum'
import { useAgentDetail } from '../hooks/useAgents'
import { useAgentMutations } from '../hooks/useAgentMutations'
import { AgentFormModal } from './AgentFormModal'

export function AgentDetailView() {
  const { agentId } = useParams<{ agentId: string }>()
  const canManage = useCanManageAiConfig()
  const { workspaces } = useAuth()
  const { agent, loading, error, refetch } = useAgentDetail(agentId)
  const { saving, activate, deactivate } = useAgentMutations(refetch)
  const { items: deployments } = useDeployments({ page: 0, size: 100, status: 'ACTIVE' })
  const deploymentOptions = useMemo(
    () =>
      deployments.map((d) => ({
        value: d.id,
        label: `${d.name} (${d.environment})`,
      })),
    [deployments]
  )
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const defaultDeployment = deployments.find((item) => item.id === agent?.defaultModelDeploymentId)
  const organizationName = workspaces.find(
    (item) => item.organizationId === agent?.organizationId
  )?.organizationName
  const workspace = workspaces.find((item) => item.id === agent?.workspaceId)

  if (loading && !agent) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !agent) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Agent not found'}</Typography>
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlAgents} size="sm" variant="outline">
          Back to agents
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlAgents} size="sm" variant="ghost">
            ← Agents
          </Button>
          <Typography variant="h2" className="mt-sm">
            {agent.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {agent.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {agent.status !== AgentStatus.Active ? (
                <Button size="sm" disabled={saving} onClick={() => void activate(agent.id)}>
                  Activate
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setDeactivateOpen(true)}>
                  Deactivate
                </Button>
              )}
            </>
          ) : null}
          <Button
            as={NextLink}
            href={`${ADMIN_ROUTES.aiControlPrompts}?agentId=${agent.id}`}
            size="sm"
            variant="outline"
          >
            Prompt templates
          </Button>
        </div>
      </div>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Status
          </Typography>
          <div className="mt-1">
            <AiLifecycleStatusBadge status={agent.status} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Type
          </Typography>
          <Typography className="mt-1">{agent.type}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Output format
          </Typography>
          <Typography className="mt-1">{agent.outputFormat || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Autonomy
          </Typography>
          <Typography className="mt-1">{agent.autonomyLevel || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Scope
          </Typography>
          <Typography className="mt-1">{agent.scope || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Default deployment
          </Typography>
          <Typography className="mt-1 font-mono text-xs">
            {defaultDeployment ? `${defaultDeployment.name} (${defaultDeployment.code})` : '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Organization
          </Typography>
          <Typography className="mt-1 font-mono text-xs">{organizationName || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Workspace
          </Typography>
          <Typography className="mt-1 font-mono text-xs">
            {workspace ? `${workspace.name} (${workspace.code})` : '—'}
          </Typography>
        </div>
        <div className="sm:col-span-2">
          <Typography variant="caption" tone="muted">
            Description
          </Typography>
          <Typography className="mt-1">{agent.description || '—'}</Typography>
        </div>
      </dl>

      <AgentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        agent={agent}
        deploymentOptions={deploymentOptions}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate agent"
        message={`Deactivate “${agent.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(agent.id).then(() => setDeactivateOpen(false))}
      />
    </Stack>
  )
}
