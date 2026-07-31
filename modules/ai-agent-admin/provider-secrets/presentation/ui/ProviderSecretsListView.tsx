'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ADMIN_ROUTES } from '@/modules/admin'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'
import {
  Button,
  ConfirmDialog,
  MaskedValue,
  PageSkeleton,
  Select,
  Stack,
  Typography,
  DataTable,
} from '@/shared/ui'
import { useProviders } from '@/modules/ai-agent-admin/providers'
import {
  PROVIDER_SECRET_TYPE_OPTIONS,
  ProviderSecretStatus,
  type ProviderSecretStatus as ProviderSecretStatusType,
  type ProviderSecretType,
} from '../../domain/enums/provider-secret.enum'
import type { AiProviderSecret } from '../../domain/model/provider-secret'
import { useProviderSecrets } from '../hooks/useProviderSecrets'
import { useProviderSecretMutations } from '../hooks/useProviderSecretMutations'
import { SaveProviderSecretDialog } from './SaveProviderSecretDialog'
import { RotateProviderSecretDialog } from './RotateProviderSecretDialog'
import { ProviderSecretStatusBadge } from './ProviderSecretStatusBadge'

const PAGE_SIZE = 20

export function ProviderSecretsListView() {
  const searchParams = useSearchParams()
  const initialProviderId = searchParams.get('providerId') ?? ''

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

  const [providerId, setProviderId] = useState(initialProviderId)
  const [secretType, setSecretType] = useState<ProviderSecretType | ''>('')
  const [status, setStatus] = useState<ProviderSecretStatusType | ''>('')
  const [page, setPage] = useState(0)
  const [saveOpen, setSaveOpen] = useState(false)
  const [rotateTarget, setRotateTarget] = useState<AiProviderSecret | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiProviderSecret | null>(null)

  const { items: providers } = useProviders({ page: 0, size: 100 })
  const providerOptions = useMemo(
    () => providers.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [providers]
  )
  const providerNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of providers) map.set(p.id, p.name)
    return map
  }, [providers])

  const params = useMemo(
    () => ({
      providerId: providerId || undefined,
      secretType,
      status,
      page,
      size: PAGE_SIZE,
    }),
    [providerId, secretType, status, page]
  )

  const { items, totalElements, loading, error, refetch } = useProviderSecrets(params)
  const { saving, deactivate } = useProviderSecretMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Provider secrets</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Masked vault only — raw secrets are never shown or cached
          </Typography>
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => setSaveOpen(true)} disabled={!providerOptions.length}>
            Save secret
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[200px] flex-1">
          <Select
            value={providerId}
            onValueChange={(v: string) => {
              setProviderId(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All providers' }, ...providerOptions]}
            placeholder="Provider"
          />
        </div>
        <div className="w-48">
          <Select
            value={secretType}
            onValueChange={(v: string) => {
              setSecretType((v || '') as ProviderSecretType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All types' },
              ...PROVIDER_SECRET_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus((v || '') as ProviderSecretStatusType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: ProviderSecretStatus.Active, label: 'Active' },
              { value: ProviderSecretStatus.Inactive, label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Provider Secrets List"
          rows={items}
          rowKey={(s) => String(s.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'provider',
              header: 'Provider',
              kind: 'reference',
              cell: (s) => <>{providerNameById.get(s.providerId) ?? '—'}</>,
            },
            { id: 'secret-type', header: 'Secret type', accessor: 'secretType' },
            {
              id: 'masked-value',
              header: 'Masked value',
              cell: (s) => (
                <>
                  <MaskedValue masked maskLabel={s.maskedValue || '••••••'} />
                </>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (s) => (
                <>
                  <ProviderSecretStatusBadge status={s.status} />
                </>
              ),
            },
            {
              id: 'key-version',
              header: 'Key version',
              accessor: 'keyVersion',
              kind: 'code',
              cellClassName: 'text-xs',
            },
            {
              id: 'created',
              header: 'Created',
              cell: (s) => <>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</>,
              cellClassName: 'text-xs text-neutral-500',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (s) => (
                <>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlProviderSecret(s.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Open
                    </Button>
                    {canManage && s.status === ProviderSecretStatus.Active ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setRotateTarget(s)}>
                          Rotate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          onClick={() => setDeactivateTarget(s)}
                        >
                          Deactivate
                        </Button>
                      </>
                    ) : null}
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>

      {totalElements > PAGE_SIZE ? (
        <div className="flex items-center justify-between">
          <Typography variant="caption" tone="muted">
            {totalElements} total · page {page + 1} / {totalPages}
          </Typography>
          <div className="flex gap-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <SaveProviderSecretDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        providerId={providerId || providerOptions[0]?.value || ''}
        providerOptions={providerOptions}
        onSaved={() => void refetch()}
      />

      <RotateProviderSecretDialog
        open={rotateTarget != null}
        onClose={() => setRotateTarget(null)}
        secret={rotateTarget}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate secret"
        message={
          deactivateTarget
            ? `Deactivate masked secret ${deactivateTarget.maskedValue}? This cannot reveal the raw value.`
            : ''
        }
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => {
          if (!deactivateTarget) return
          void deactivate(deactivateTarget.id).then(() => setDeactivateTarget(null))
        }}
      />
    </Stack>
  )
}
