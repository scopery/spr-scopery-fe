'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useProviders } from '@/modules/ai-agent-admin/providers'
import { hasPermission, PERMISSIONS, useEffectivePermissions } from '@/modules/permissions'
import { Button, ConfirmDialog, MaskedValue, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { ProviderSecretStatus } from '../../domain/enums/provider-secret.enum'
import { useProviderSecretDetail } from '../hooks/useProviderSecrets'
import { useProviderSecretMutations } from '../hooks/useProviderSecretMutations'
import { RotateProviderSecretDialog } from './RotateProviderSecretDialog'
import { ProviderSecretStatusBadge } from './ProviderSecretStatusBadge'

export function ProviderSecretDetailView() {
  const { secretId } = useParams<{ secretId: string }>()
  const { workspaces, currentWorkspaceId } = useAuth()
  const orgId =
    workspaces.find((w) => w.id === currentWorkspaceId)?.organizationId ??
    workspaces[0]?.organizationId ??
    null
  const { permissions } = useEffectivePermissions(orgId)
  const canManage = useMemo(() => {
    if (!permissions) return true
    if (hasPermission(permissions, PERMISSIONS.AI_PROVIDER_SECRET_MANAGE)) return true
    const hasWave5 = permissions.permissions.some((p) => p.startsWith('AI_PROVIDER_SECRET'))
    return !hasWave5
  }, [permissions])

  const { secret, loading, error, refetch } = useProviderSecretDetail(secretId)
  const { items: providers } = useProviders({ page: 0, size: 100 })
  const { saving, deactivate } = useProviderSecretMutations(refetch)
  const [rotateOpen, setRotateOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const provider = providers.find((item) => item.id === secret?.providerId)

  if (loading && !secret) {
    return <PageSkeleton variant="detail" className="p-lg" />
  }

  if (error || !secret) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Secret not found'}</Typography>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.aiControlProviderSecrets}
          size="sm"
          variant="outline"
        >
          Back to secrets
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button
            as={NextLink}
            href={ADMIN_ROUTES.aiControlProviderSecrets}
            size="sm"
            variant="ghost"
          >
            ← Secrets
          </Button>
          <Typography variant="h2" className="mt-sm">
            Provider secret
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Masked detail only — no reveal
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage && secret.status === ProviderSecretStatus.Active ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setRotateOpen(true)}>
                Rotate
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate
              </Button>
            </>
          ) : null}
          <Button
            as={NextLink}
            href={ADMIN_ROUTES.aiControlProvider(secret.providerId)}
            size="sm"
            variant="outline"
          >
            Open provider
          </Button>
        </div>
      </div>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Masked value
          </Typography>
          <div className="mt-1">
            <MaskedValue masked maskLabel={secret.maskedValue || '••••••'} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Status
          </Typography>
          <div className="mt-1">
            <ProviderSecretStatusBadge status={secret.status} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Secret type
          </Typography>
          <Typography className="mt-1">{secret.secretType}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Key version
          </Typography>
          <Typography className="mt-1 font-mono">{secret.keyVersion}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Provider
          </Typography>
          <Typography className="mt-1">
            {provider ? `${provider.name} (${provider.code})` : '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Created
          </Typography>
          <Typography className="mt-1">
            {secret.createdAt ? new Date(secret.createdAt).toLocaleString() : '—'}
          </Typography>
        </div>
        {secret.description ? (
          <div className="sm:col-span-2">
            <Typography variant="caption" tone="muted">
              Description
            </Typography>
            <Typography className="mt-1">{secret.description}</Typography>
          </div>
        ) : null}
      </dl>

      <RotateProviderSecretDialog
        open={rotateOpen}
        onClose={() => setRotateOpen(false)}
        secret={secret}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate secret"
        message={`Deactivate ${secret.maskedValue}? The raw value cannot be recovered from the UI.`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(secret.id).then(() => setDeactivateOpen(false))}
      />
    </Stack>
  )
}
