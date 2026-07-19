'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import {
  Button,
  ConfirmDialog,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { useProviders } from '@/modules/ai-agent-admin/providers'
import { ModelStatus } from '../../domain/enums/model.enum'
import { useModelDetail } from '../hooks/useModels'
import { useModelMutations } from '../hooks/useModelMutations'
import { ModelFormModal } from './ModelFormModal'

export function ModelDetailView() {
  const { modelId } = useParams<{ modelId: string }>()
  const canManage = useCanManageAiConfig()
  const { model, loading, error, refetch } = useModelDetail(modelId)
  const { saving, activate, deactivate } = useModelMutations(refetch)
  const { items: providers } = useProviders({ page: 0, size: 100 })
  const providerOptions = providers.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.code})`,
  }))
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  if (loading && !model) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !model) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Model not found'}</Typography>
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlModels} size="sm" variant="outline">
          Back to models
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlModels} size="sm" variant="ghost">
            ← Models
          </Button>
          <Typography variant="h2" className="mt-sm">
            {model.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {model.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {model.status !== ModelStatus.Active ? (
                <Button size="sm" disabled={saving} onClick={() => void activate(model.id)}>
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
            href={`${ADMIN_ROUTES.aiControlDeployments}?modelId=${model.id}`}
            size="sm"
            variant="outline"
          >
            Deployments
          </Button>
          <Button
            as={NextLink}
            href={`${ADMIN_ROUTES.aiControlParameterCapabilities}?modelId=${model.id}`}
            size="sm"
            variant="outline"
          >
            Capabilities
          </Button>
        </div>
      </div>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Status
          </Typography>
          <div className="mt-1">
            <AiLifecycleStatusBadge status={model.status} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Type
          </Typography>
          <Typography className="mt-1">{model.type}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Provider model ID
          </Typography>
          <Typography className="mt-1 font-mono">{model.providerModelId || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Provider ID
          </Typography>
          <Typography className="mt-1 font-mono text-xs">{model.providerId}</Typography>
        </div>
        <div className="sm:col-span-2">
          <Typography variant="caption" tone="muted">
            Description
          </Typography>
          <Typography className="mt-1">{model.description || '—'}</Typography>
        </div>
      </dl>

      <ModelFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        model={model}
        providerOptions={providerOptions}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate model"
        message={`Deactivate “${model.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(model.id).then(() => setDeactivateOpen(false))}
      />
    </Stack>
  )
}
