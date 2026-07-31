'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useModels } from '@/modules/ai-agent-admin/models'
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
  CapabilityStatus,
  SUPPORT_STATUS_OPTIONS,
  SupportStatus,
  VALUE_TYPE_OPTIONS,
  type ParameterValueType,
  type SupportStatus as SupportStatusType,
} from '../../domain/enums/capability.enum'
import type { AiParameterCapability } from '../../domain/model/capability'
import { useParameterCapabilities } from '../hooks/useParameterCapabilities'
import { useCapabilityMutations } from '../hooks/useCapabilityMutations'
import { CapabilityFormModal } from './CapabilityFormModal'

const PAGE_SIZE = 30

export function ParameterCapabilitiesListView() {
  const searchParams = useSearchParams()
  const initialModelId = searchParams.get('modelId') ?? ''
  const canManage = useCanManageAiConfig()

  const [modelId, setModelId] = useState(initialModelId)
  const [parameterName, setParameterName] = useState('')
  const [supportStatus, setSupportStatus] = useState<SupportStatusType | ''>('')
  const [valueType, setValueType] = useState<ParameterValueType | ''>('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiParameterCapability | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiParameterCapability | null>(null)

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
      parameterName: parameterName.trim() || undefined,
      supportStatus,
      valueType,
      status: (status || '') as '' | 'ACTIVE' | 'INACTIVE',
      page,
      size: PAGE_SIZE,
    }),
    [modelId, parameterName, supportStatus, valueType, status, page]
  )

  const { items, totalElements, loading, error, refetch } = useParameterCapabilities(params)
  const { saving, activate, deactivate } = useCapabilityMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Parameter capabilities</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Per-model parameter matrix (min ≤ default ≤ max)
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
            Add capability
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
        <div className="min-w-[140px] flex-1">
          <Input
            placeholder="Parameter name…"
            value={parameterName}
            onChange={(e) => {
              setParameterName(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-40">
          <Select
            value={supportStatus}
            onValueChange={(v: string) => {
              setSupportStatus((v || '') as SupportStatusType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All support' },
              ...SUPPORT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={valueType}
            onValueChange={(v: string) => {
              setValueType((v || '') as ParameterValueType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All types' },
              ...VALUE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus(v)
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: CapabilityStatus.Active, label: 'Active' },
              { value: CapabilityStatus.Inactive, label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Parameter Capabilities List"
          rows={items}
          rowKey={(c) => String(c.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'model',
              header: 'Model',
              kind: 'reference',
              cell: (c) => <>{modelNameById.get(c.modelId) ?? '—'}</>,
            },
            {
              id: 'parameter',
              header: 'Parameter',
              accessor: 'parameterName',
              cellClassName: 'text-xs',
            },
            {
              id: 'api-key',
              header: 'API key',
              cell: (c) => <>{c.apiParameterKey || '—'}</>,
              kind: 'code',
              cellClassName: 'text-xs',
            },
            { id: 'support', header: 'Support', accessor: 'supportStatus' },
            {
              id: 'type',
              header: 'Type',
              cell: (c) => <>{c.supportStatus === SupportStatus.No ? '—' : c.valueType || '—'}</>,
            },
            {
              id: 'min-def-max',
              header: 'Min / Def / Max',
              cell: (c) => (
                <>
                  {c.supportStatus === SupportStatus.No
                    ? '—'
                    : `${c.minValue ?? '—'} / ${c.defaultValue ?? '—'} / ${c.maxValue ?? '—'}`}
                </>
              ),
              cellClassName: 'text-xs',
            },
            {
              id: 'nullable',
              header: 'Nullable',
              cell: (c) => <>{c.nullable == null ? '—' : c.nullable ? 'Yes' : 'No'}</>,
            },
            {
              id: 'if-null',
              header: 'If null',
              cell: (c) => <>{c.ifNullBehavior || '—'}</>,
              cellClassName: 'max-w-[120px] truncate text-xs',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (c) => (
                <>
                  <AiLifecycleStatusBadge status={c.status} />
                </>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (c) => (
                <>
                  {canManage ? (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(c)
                          setFormOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      {c.status !== CapabilityStatus.Active ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          onClick={() => void activate(c.id)}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setDeactivateTarget(c)}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  ) : null}
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

      <CapabilityFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        capability={editing}
        modelOptions={modelOptions}
        defaultModelId={modelId || modelOptions[0]?.value || ''}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate capability"
        message={
          deactivateTarget ? `Deactivate parameter “${deactivateTarget.parameterName}”?` : ''
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
