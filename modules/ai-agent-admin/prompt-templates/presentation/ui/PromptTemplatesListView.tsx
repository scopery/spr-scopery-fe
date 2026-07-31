'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useAgents } from '@/modules/ai-agent-admin/agents'
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
import { PromptTemplateStatus } from '../../domain/enums/prompt.enum'
import type { AiPromptTemplate } from '../../domain/model/prompt-template'
import { usePromptTemplates } from '../hooks/usePrompts'
import { usePromptTemplateMutations } from '../hooks/usePromptMutations'
import { PromptTemplateFormModal } from './PromptTemplateFormModal'

const PAGE_SIZE = 20

export function PromptTemplatesListView() {
  const searchParams = useSearchParams()
  const initialAgentId = searchParams.get('agentId') ?? ''
  const canManage = useCanManageAiConfig()

  const [agentId, setAgentId] = useState(initialAgentId)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiPromptTemplate | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiPromptTemplate | null>(null)

  const { items: agents } = useAgents({ page: 0, size: 100 })
  const agentOptions = useMemo(
    () => agents.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` })),
    [agents]
  )
  const agentNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of agents) m.set(a.id, a.name)
    return m
  }, [agents])

  const params = useMemo(
    () => ({
      agentId: agentId || undefined,
      keyword: keyword.trim() || undefined,
      status: (status || '') as '' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED',
      page,
      size: PAGE_SIZE,
    }),
    [agentId, keyword, status, page]
  )

  const { items, totalElements, loading, error, refetch } = usePromptTemplates(params)
  const { saving, activate, deactivate } = usePromptTemplateMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Prompt templates</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Template library — content lives in versions
          </Typography>
        </div>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            disabled={!agentOptions.length}
          >
            Create template
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[180px] flex-1">
          <Select
            value={agentId}
            onValueChange={(v: string) => {
              setAgentId(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All agents' }, ...agentOptions]}
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
              setStatus(v)
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: PromptTemplateStatus.Active, label: 'Active' },
              { value: PromptTemplateStatus.Inactive, label: 'Inactive' },
              { value: PromptTemplateStatus.Deprecated, label: 'Deprecated' },
            ]}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Prompt Templates List"
          rows={items}
          rowKey={(t) => String(t.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'agent',
              header: 'Agent',
              kind: 'reference',
              cell: (t) => <>{agentNameById.get(t.agentId) ?? '—'}</>,
            },
            {
              id: 'name',
              header: 'Name',
              cell: (t) => (
                <>
                  <Typography weight="medium">{t.name}</Typography>
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
              id: 'status',
              header: 'Status',
              cell: (t) => (
                <>
                  <AiLifecycleStatusBadge status={t.status} />
                </>
              ),
            },
            {
              id: 'description',
              header: 'Description',
              cell: (t) => <>{t.description || '—'}</>,
              cellClassName: 'max-w-[200px] truncate text-xs',
            },
            {
              id: 'updated',
              header: 'Updated',
              cell: (t) => <>{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—'}</>,
              cellClassName: 'text-xs text-neutral-500',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (t) => (
                <>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlPrompt(t.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Versions
                    </Button>
                    {canManage ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(t)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        {t.status !== PromptTemplateStatus.Active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => void activate(t.id)}
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setDeactivateTarget(t)}>
                            Deactivate
                          </Button>
                        )}
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

      <PromptTemplateFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        template={editing}
        agentOptions={agentOptions}
        defaultAgentId={agentId || agentOptions[0]?.value || ''}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate template"
        message={deactivateTarget ? `Deactivate “${deactivateTarget.name}”?` : ''}
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
