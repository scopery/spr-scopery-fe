'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useEventDefinitions } from '@/modules/admin/event-definitions'
import { useAgents } from '@/modules/ai-agent-admin/agents'
import { useDeployments } from '@/modules/ai-agent-admin/deployments'
import { usePromptVersionDetail } from '@/modules/ai-agent-admin/prompt-templates'
import { Button, ConfirmDialog, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { EventConfigStatus } from '../../domain/enums/event-config.enum'
import { useEventConfigDetail } from '../hooks/useEventConfigs'
import { useEventConfigMutations } from '../hooks/useEventConfigMutations'
import { EventConfigFormModal } from './EventConfigFormModal'

export function EventConfigDetailView() {
  const { eventConfigId } = useParams<{ eventConfigId: string }>()
  const canManage = useCanManageAiConfig()
  const { config, loading, error, refetch } = useEventConfigDetail(eventConfigId)
  const { saving, activate, deactivate } = useEventConfigMutations(refetch)
  const { items: agents } = useAgents({ page: 0, size: 100 })
  const { items: deployments } = useDeployments({ page: 0, size: 100, status: 'ACTIVE' })
  const { items: eventDefinitions } = useEventDefinitions({ page: 0, size: 200 })
  const { version: promptVersion } = usePromptVersionDetail(config?.promptVersionId ?? null)
  const agentOptions = useMemo(
    () => agents.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` })),
    [agents]
  )
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
  const eventDefinition = eventDefinitions.find((item) => item.id === config?.eventDefinitionId)
  const selectedAgent = agents.find((item) => item.id === config?.agentId)
  const selectedDeployment = deployments.find((item) => item.id === config?.modelDeploymentId)

  if (loading && !config) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !config) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Event config not found'}</Typography>
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlEventConfigs} size="sm" variant="outline">
          Back to event configs
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlEventConfigs} size="sm" variant="ghost">
            ← Event configs
          </Button>
          <Typography variant="h2" className="mt-sm">
            {config.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {config.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {config.status !== EventConfigStatus.Active ? (
                <Button size="sm" disabled={saving} onClick={() => void activate(config.id)}>
                  Activate
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setDeactivateOpen(true)}>
                  Deactivate
                </Button>
              )}
            </>
          ) : null}
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlPlayground} size="sm" variant="outline">
            Playground
          </Button>
        </div>
      </div>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Status
          </Typography>
          <div className="mt-1">
            <AiLifecycleStatusBadge status={config.status} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Environment / trigger
          </Typography>
          <Typography className="mt-1">
            {config.environment} · {config.triggerType}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Event definition
          </Typography>
          <Typography className="mt-1">
            {eventDefinition ? `${eventDefinition.name} (${eventDefinition.code})` : '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Agent / prompt / deployment
          </Typography>
          <Typography className="mt-1">
            {selectedAgent ? `${selectedAgent.name} (${selectedAgent.code})` : '—'} /{' '}
            {promptVersion?.title ?? '—'} /{' '}
            {selectedDeployment ? `${selectedDeployment.name} (${selectedDeployment.code})` : '—'}
          </Typography>
        </div>
        <div className="sm:col-span-2">
          <Typography variant="caption" tone="muted">
            Condition (SpEL — server-side only)
          </Typography>
          <pre className="mt-1 overflow-x-auto border border-neutral-200 bg-neutral-50 p-sm font-mono text-xs">
            {config.conditionExpression || '—'}
          </pre>
        </div>
        <div className="sm:col-span-2">
          <Typography variant="caption" tone="muted">
            Description
          </Typography>
          <Typography className="mt-1">{config.description || '—'}</Typography>
        </div>
      </dl>

      <EventConfigFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        config={config}
        agentOptions={agentOptions}
        deploymentOptions={deploymentOptions}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate event config"
        message={`Deactivate “${config.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(config.id).then(() => setDeactivateOpen(false))}
      />
    </Stack>
  )
}
