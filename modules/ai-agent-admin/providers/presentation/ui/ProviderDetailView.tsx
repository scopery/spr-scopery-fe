'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ADMIN_ROUTES } from '@/modules/admin'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'
import {
  Button,
  ConfirmDialog,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { ProviderStatus } from '../../domain/enums/provider.enum'
import { useProviderDetail } from '../hooks/useProviders'
import { useProviderMutations } from '../hooks/useProviderMutations'
import { ProviderFormModal } from './ProviderFormModal'
import { ProviderStatusBadge } from './ProviderStatusBadge'

export function ProviderDetailView() {
  const { providerId } = useParams<{ providerId: string }>()
  const { workspaces, currentWorkspaceId } = useAuth()
  const orgId =
    workspaces.find((w) => w.id === currentWorkspaceId)?.organizationId ??
    workspaces[0]?.organizationId ??
    null
  const { permissions } = useEffectivePermissions(orgId)
  const canManage = useMemo(() => {
    if (!permissions) return true
    if (hasPermission(permissions, PERMISSIONS.AI_AGENT_CONFIG_MANAGE)) return true
    const hasWave5 = permissions.permissions.some((p) => p.startsWith('AI_AGENT_CONFIG'))
    return !hasWave5
  }, [permissions])

  const { provider, loading, error, refetch } = useProviderDetail(providerId)
  const { saving, activate, deactivate } = useProviderMutations(refetch)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  if (loading && !provider) {
    return <PageSkeleton variant="detail" className="p-lg" />
  }

  if (error || !provider) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Provider not found'}</Typography>
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlProviders} size="sm" variant="outline">
          Back to providers
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlProviders} size="sm" variant="ghost">
            ← Providers
          </Button>
          <Typography variant="h2" className="mt-sm">
            {provider.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {provider.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {provider.status !== ProviderStatus.Active ? (
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() => void activate(provider.id)}
                >
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
            href={`${ADMIN_ROUTES.aiControlProviderSecrets}?providerId=${provider.id}`}
            size="sm"
            variant="outline"
          >
            Manage secrets
          </Button>
        </div>
      </div>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Status
          </Typography>
          <div className="mt-1">
            <ProviderStatusBadge status={provider.status} />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Type
          </Typography>
          <Typography className="mt-1">{provider.type}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            API base URL
          </Typography>
          <Typography className="mt-1 break-all">{provider.apiBaseUrl || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Description
          </Typography>
          <Typography className="mt-1">{provider.description || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Created
          </Typography>
          <Typography className="mt-1">
            {provider.createdAt ? new Date(provider.createdAt).toLocaleString() : '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Updated
          </Typography>
          <Typography className="mt-1">
            {provider.updatedAt ? new Date(provider.updatedAt).toLocaleString() : '—'}
          </Typography>
        </div>
      </dl>

      <ProviderFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        provider={provider}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate provider"
        message={`Deactivate “${provider.name}”? Dependent models/deployments may stop resolving.`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() =>
          void deactivate(provider.id).then(() => setDeactivateOpen(false))
        }
      />
    </Stack>
  )
}
