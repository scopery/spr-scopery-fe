'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { Badge, Button, ConfirmDialog, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { useModels } from '@/modules/ai-agent-admin/models'
import { DeploymentStatus } from '../../domain/enums/deployment.enum'
import { useDeploymentDetail } from '../hooks/useDeployments'
import { useDeploymentMutations } from '../hooks/useDeploymentMutations'
import { DeploymentFormModal } from './DeploymentFormModal'

export function DeploymentDetailView() {
  const { deploymentId } = useParams<{ deploymentId: string }>()
  const canManage = useCanManageAiConfig()
  const { deployment, loading, error, refetch } = useDeploymentDetail(deploymentId)
  const { saving, activate, deactivate, setDefault } = useDeploymentMutations(refetch)
  const { items: models } = useModels({ page: 0, size: 100 })
  const modelOptions = models.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.code})`,
  }))
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [setDefaultOpen, setSetDefaultOpen] = useState(false)

  if (loading && !deployment) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !deployment) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Deployment not found'}</Typography>
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlDeployments} size="sm" variant="outline">
          Back to deployments
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlDeployments} size="sm" variant="ghost">
            ← Deployments
          </Button>
          <Typography variant="h2" className="mt-sm">
            {deployment.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {deployment.code} · {deployment.environment}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {deployment.status !== DeploymentStatus.Active ? (
                <Button size="sm" disabled={saving} onClick={() => void activate(deployment.id)}>
                  Activate
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setDeactivateOpen(true)}>
                  Deactivate
                </Button>
              )}
              {!deployment.isDefault ? (
                <Button size="sm" variant="outline" onClick={() => setSetDefaultOpen(true)}>
                  Set default
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Status
          </Typography>
          <div className="mt-1">
            <AiLifecycleStatusBadge status={deployment.status} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Default
          </Typography>
          <div className="mt-1">
            {deployment.isDefault ? <Badge tone="success">Default</Badge> : '—'}
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Endpoint
          </Typography>
          <Typography className="mt-1 break-all">{deployment.endpointUrl || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Provider deployment name
          </Typography>
          <Typography className="mt-1 font-mono">
            {deployment.providerDeploymentId || '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Temperature
          </Typography>
          <Typography className="mt-1">
            {deployment.defaultTemperature != null ? deployment.defaultTemperature : '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Max output tokens
          </Typography>
          <Typography className="mt-1">
            {deployment.defaultMaxOutputTokens != null ? deployment.defaultMaxOutputTokens : '—'}
          </Typography>
        </div>
      </dl>

      <DeploymentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        deployment={deployment}
        modelOptions={modelOptions}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate deployment"
        message={`Deactivate “${deployment.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(deployment.id).then(() => setDeactivateOpen(false))}
      />
      <ConfirmDialog
        open={setDefaultOpen}
        onClose={() => setSetDefaultOpen(false)}
        title="Set default deployment"
        message={`Set “${deployment.name}” as default for ${deployment.environment}? Peers for the same model+environment are cleared by the server.`}
        confirmLabel="Set default"
        onConfirm={() => void setDefault(deployment.id).then(() => setSetDefaultOpen(false))}
      />
    </Stack>
  )
}
