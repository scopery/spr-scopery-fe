'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ADMIN_ROUTES } from '@/modules/admin'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'
import {
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import {
  PROVIDER_STATUS_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  ProviderStatus,
  type ProviderStatus as ProviderStatusType,
  type ProviderType,
} from '../../domain/enums/provider.enum'
import type { AiProvider } from '../../domain/model/provider'
import { useProviders } from '../hooks/useProviders'
import { useProviderMutations } from '../hooks/useProviderMutations'
import { ProviderFormModal } from './ProviderFormModal'
import { ProviderStatusBadge } from './ProviderStatusBadge'

const PAGE_SIZE = 20

export function ProvidersListView() {
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

  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<ProviderType | ''>('')
  const [status, setStatus] = useState<ProviderStatusType | ''>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiProvider | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiProvider | null>(null)

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      type,
      status,
      page,
      size: PAGE_SIZE,
    }),
    [keyword, type, status, page]
  )

  const { items, totalElements, loading, error, refetch } = useProviders(params)
  const { saving, activate, deactivate } = useProviderMutations(refetch)

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Providers</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            AI provider registry and lifecycle
          </Typography>
        </div>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Create provider
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Search name or code…"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-40">
          <Select
            value={type}
            onValueChange={(v: string) => {
              setType((v || '') as ProviderType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All types' },
              ...PROVIDER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
            placeholder="Type"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus((v || '') as ProviderStatusType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              ...PROVIDER_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
            placeholder="Status"
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">API base URL</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No providers found.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography weight="medium">{p.name}</Typography>
                    {p.description ? (
                      <Typography variant="caption" tone="muted" className="block">
                        {p.description}
                      </Typography>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3">{p.type}</td>
                  <td className="px-4 py-3">
                    <ProviderStatusBadge status={p.status} />
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-xs">
                    {p.apiBaseUrl || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        as={NextLink}
                        href={ADMIN_ROUTES.aiControlProvider(p.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Open
                      </Button>
                      {canManage ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(p)
                              setFormOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          {p.status !== ProviderStatus.Active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => void activate(p.id)}
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => setDeactivateTarget(p)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </>
                      ) : null}
                      <Button
                        as={NextLink}
                        href={`${ADMIN_ROUTES.aiControlProviderSecrets}?providerId=${p.id}`}
                        size="sm"
                        variant="ghost"
                      >
                        Secrets
                      </Button>
                      <Button
                        as={NextLink}
                        href={ADMIN_ROUTES.aiControlModels}
                        size="sm"
                        variant="ghost"
                      >
                        Models
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

      <ProviderFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        provider={editing}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate provider"
        message={
          deactivateTarget
            ? `Deactivate “${deactivateTarget.name}”? Dependent models/deployments may stop resolving. (Dependency summary not yet returned by BE — W5-GAP.)`
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
