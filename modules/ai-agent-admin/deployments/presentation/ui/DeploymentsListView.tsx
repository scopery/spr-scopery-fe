'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useModels } from '@/modules/ai-agent-admin/models'
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import {
  DEPLOYMENT_ENVIRONMENT_OPTIONS,
  DeploymentStatus,
  type DeploymentEnvironment,
  type DeploymentStatus as DeploymentStatusType,
} from '../../domain/enums/deployment.enum'
import type { AiModelDeployment } from '../../domain/model/deployment'
import { useDeployments } from '../hooks/useDeployments'
import { useDeploymentMutations } from '../hooks/useDeploymentMutations'
import { DeploymentFormModal } from './DeploymentFormModal'

const PAGE_SIZE = 20

export function DeploymentsListView() {
  const searchParams = useSearchParams()
  const initialModelId = searchParams.get('modelId') ?? ''
  const canManage = useCanManageAiConfig()

  const [modelId, setModelId] = useState(initialModelId)
  const [environment, setEnvironment] = useState<DeploymentEnvironment | ''>('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<DeploymentStatusType | ''>('')
  const [isDefault, setIsDefault] = useState<boolean | ''>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiModelDeployment | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiModelDeployment | null>(null)
  const [setDefaultTarget, setSetDefaultTarget] = useState<AiModelDeployment | null>(null)

  const { items: models } = useModels({ page: 0, size: 100 })
  const modelOptions = useMemo(
    () => models.map((m) => ({ value: m.id, label: `${m.name} (${m.code})` })),
    [models]
  )
  const modelNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of models) map.set(m.id, m.name)
    return map
  }, [models])

  const params = useMemo(
    () => ({
      modelId: modelId || undefined,
      environment,
      keyword: keyword.trim() || undefined,
      status,
      isDefault,
      page,
      size: PAGE_SIZE,
    }),
    [modelId, environment, keyword, status, isDefault, page]
  )

  const { items, totalElements, loading, error, refetch } = useDeployments(params)
  const { saving, activate, deactivate, setDefault } = useDeploymentMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Deployments</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Runtime model deployments by environment — set-default invalidates peers server-side
          </Typography>
        </div>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            disabled={!modelOptions.length}
          >
            Create deployment
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[180px] flex-1">
          <Select
            value={modelId}
            onValueChange={(v: string) => {
              setModelId(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All models' }, ...modelOptions]}
          />
        </div>
        <div className="w-32">
          <Select
            value={environment}
            onValueChange={(v: string) => {
              setEnvironment((v || '') as DeploymentEnvironment | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All envs' },
              ...DEPLOYMENT_ENVIRONMENT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <Input
            placeholder="Search…"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-36">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus((v || '') as DeploymentStatusType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: DeploymentStatus.Active, label: 'Active' },
              { value: DeploymentStatus.Inactive, label: 'Inactive' },
              { value: DeploymentStatus.Deprecated, label: 'Deprecated' },
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={isDefault === '' ? '' : isDefault ? 'true' : 'false'}
            onValueChange={(v: string) => {
              setIsDefault(v === '' ? '' : v === 'true')
              setPage(0)
            }}
            options={[
              { value: '', label: 'Any default' },
              { value: 'true', label: 'Default only' },
              { value: 'false', label: 'Non-default' },
            ]}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Deployment</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Env</th>
              <th className="px-4 py-3 font-medium">Endpoint</th>
              <th className="px-4 py-3 font-medium">Default</th>
              <th className="px-4 py-3 font-medium">Temp</th>
              <th className="px-4 py-3 font-medium">Max tokens</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                  No deployments found.
                </td>
              </tr>
            ) : (
              items.map((d) => (
                <tr key={d.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography weight="medium">{d.name}</Typography>
                    <Typography variant="caption" tone="muted" className="block font-mono">
                      {d.code}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    {modelNameById.get(d.modelId) ?? d.modelId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">{d.environment}</td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-xs">
                    {d.endpointUrl || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {d.isDefault ? <Badge tone="success">Default</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {d.defaultTemperature != null ? d.defaultTemperature : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {d.defaultMaxOutputTokens != null ? d.defaultMaxOutputTokens : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <AiLifecycleStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        as={NextLink}
                        href={ADMIN_ROUTES.aiControlDeployment(d.id)}
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
                              setEditing(d)
                              setFormOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          {d.status !== DeploymentStatus.Active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => void activate(d.id)}
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeactivateTarget(d)}
                            >
                              Deactivate
                            </Button>
                          )}
                          {!d.isDefault ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSetDefaultTarget(d)}
                            >
                              Set default
                            </Button>
                          ) : null}
                        </>
                      ) : null}
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

      <DeploymentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        deployment={editing}
        modelOptions={modelOptions}
        defaultModelId={modelId || modelOptions[0]?.value || ''}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate deployment"
        message={
          deactivateTarget ? `Deactivate “${deactivateTarget.name}”?` : ''
        }
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => {
          if (!deactivateTarget) return
          void deactivate(deactivateTarget.id).then(() => setDeactivateTarget(null))
        }}
      />

      <ConfirmDialog
        open={setDefaultTarget != null}
        onClose={() => setSetDefaultTarget(null)}
        title="Set default deployment"
        message={
          setDefaultTarget
            ? `Set “${setDefaultTarget.name}” as default for ${setDefaultTarget.environment}? Other defaults for the same model+environment will be cleared by the server.`
            : ''
        }
        confirmLabel="Set default"
        onConfirm={() => {
          if (!setDefaultTarget) return
          void setDefault(setDefaultTarget.id).then(() => setSetDefaultTarget(null))
        }}
      />
    </Stack>
  )
}
