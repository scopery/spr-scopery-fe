'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useProviders } from '@/modules/ai-agent-admin/providers'
import {
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
  DataTable,
} from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import {
  MODEL_STATUS_OPTIONS,
  MODEL_TYPE_OPTIONS,
  ModelStatus,
  type ModelStatus as ModelStatusType,
  type ModelType,
} from '../../domain/enums/model.enum'
import type { AiModel } from '../../domain/model/ai-model'
import { useModels } from '../hooks/useModels'
import { useModelMutations } from '../hooks/useModelMutations'
import { ModelFormModal } from './ModelFormModal'

const PAGE_SIZE = 20

export function ModelsListView() {
  const searchParams = useSearchParams()
  const initialProviderId = searchParams.get('providerId') ?? ''
  const canManage = useCanManageAiConfig()

  const [providerId, setProviderId] = useState(initialProviderId)
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<ModelType | ''>('')
  const [status, setStatus] = useState<ModelStatusType | ''>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiModel | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiModel | null>(null)

  const { items: providers } = useProviders({ page: 0, size: 100 })
  const providerOptions = useMemo(
    () => providers.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [providers]
  )
  const providerNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of providers) m.set(p.id, p.name)
    return m
  }, [providers])

  const params = useMemo(
    () => ({
      providerId: providerId || undefined,
      keyword: keyword.trim() || undefined,
      type,
      status,
      page,
      size: PAGE_SIZE,
    }),
    [providerId, keyword, type, status, page]
  )

  const { items, totalElements, loading, error, refetch } = useModels(params)
  const { saving, activate, deactivate } = useModelMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Models</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            AI model catalog
          </Typography>
        </div>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            disabled={!providerOptions.length}
          >
            Create model
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[180px] flex-1">
          <Select
            value={providerId}
            onValueChange={(v: string) => {
              setProviderId(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All providers' }, ...providerOptions]}
          />
        </div>
        <div className="min-w-[160px] flex-1">
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
            value={type}
            onValueChange={(v: string) => {
              setType((v || '') as ModelType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All types' },
              ...MODEL_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus((v || '') as ModelStatusType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              ...MODEL_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Models List"
          rows={items}
          rowKey={(m) => String(m.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'provider',
              header: 'Provider',
              cell: (m) => <>{providerNameById.get(m.providerId) ?? '—'}</>,
            },
            {
              id: 'name',
              header: 'Name',
              cell: (m) => (
                <>
                  <Typography weight="medium">{m.name}</Typography>
                  {m.description ? (
                    <Typography variant="caption" tone="muted" className="block">
                      {m.description}
                    </Typography>
                  ) : null}
                </>
              ),
            },
            {
              id: 'code',
              header: 'Code',
              accessor: 'code',
              kind: 'code',
              cellClassName: 'text-xs',
            },
            {
              id: 'provider-model-id',
              header: 'Provider model ID',
              accessor: () => '—',
              kind: 'reference',
              cellClassName: 'text-xs',
            },
            { id: 'type', header: 'Type', accessor: 'type' },
            {
              id: 'status',
              header: 'Status',
              cell: (m) => (
                <>
                  <AiLifecycleStatusBadge status={m.status} />
                </>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (m) => (
                <>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlModel(m.id)}
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
                            setEditing(m)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        {m.status !== ModelStatus.Active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => void activate(m.id)}
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setDeactivateTarget(m)}>
                            Deactivate
                          </Button>
                        )}
                      </>
                    ) : null}
                    <Button
                      as={NextLink}
                      href={`${ADMIN_ROUTES.aiControlDeployments}?modelId=${m.id}`}
                      size="sm"
                      variant="ghost"
                    >
                      Deployments
                    </Button>
                    <Button
                      as={NextLink}
                      href={`${ADMIN_ROUTES.aiControlParameterCapabilities}?modelId=${m.id}`}
                      size="sm"
                      variant="ghost"
                    >
                      Capabilities
                    </Button>
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

      <ModelFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        model={editing}
        providerOptions={providerOptions}
        defaultProviderId={providerId || providerOptions[0]?.value || ''}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate model"
        message={
          deactivateTarget
            ? `Deactivate “${deactivateTarget.name}”? Deployments may stop resolving.`
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
