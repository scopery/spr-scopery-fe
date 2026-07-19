'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useDeployments } from '@/modules/ai-agent-admin/deployments'
import {
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
  AGENT_OUTPUT_FORMAT_OPTIONS,
  AGENT_TYPE_OPTIONS,
  AgentStatus,
  type AgentOutputFormat,
  type AgentType,
} from '../../domain/enums/agent.enum'
import type { AiAgent } from '../../domain/model/agent'
import { useAgents } from '../hooks/useAgents'
import { useAgentMutations } from '../hooks/useAgentMutations'
import { AgentFormModal } from './AgentFormModal'

const PAGE_SIZE = 20

export function AgentsListView() {
  const canManage = useCanManageAiConfig()
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<AgentType | ''>('')
  const [status, setStatus] = useState<string>('')
  const [outputFormat, setOutputFormat] = useState<AgentOutputFormat | ''>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiAgent | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiAgent | null>(null)

  const { items: deployments } = useDeployments({
    page: 0,
    size: 100,
    status: 'ACTIVE',
  })
  const deploymentOptions = useMemo(
    () =>
      deployments.map((d) => ({
        value: d.id,
        label: `${d.name} (${d.environment})`,
      })),
    [deployments]
  )
  const deploymentNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const d of deployments) m.set(d.id, d.name)
    return m
  }, [deployments])

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      type,
      status: (status || '') as '' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED',
      outputFormat,
      page,
      size: PAGE_SIZE,
    }),
    [keyword, type, status, outputFormat, page]
  )

  const { items, totalElements, loading, error, refetch } = useAgents(params)
  const { saving, activate, deactivate } = useAgentMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Agents</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            AI business agent registry
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
            Create agent
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
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
        <div className="w-44">
          <Select
            value={type}
            onValueChange={(v: string) => {
              setType((v || '') as AgentType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All types' },
              ...AGENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
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
              { value: AgentStatus.Active, label: 'Active' },
              { value: AgentStatus.Inactive, label: 'Inactive' },
              { value: AgentStatus.Deprecated, label: 'Deprecated' },
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={outputFormat}
            onValueChange={(v: string) => {
              setOutputFormat((v || '') as AgentOutputFormat | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All formats' },
              ...AGENT_OUTPUT_FORMAT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
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
              <th className="px-4 py-3 font-medium">Default deployment</th>
              <th className="px-4 py-3 font-medium">Output</th>
              <th className="px-4 py-3 font-medium">Autonomy</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                  No agents found.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography weight="medium">{a.name}</Typography>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                  <td className="px-4 py-3">{a.type}</td>
                  <td className="px-4 py-3">
                    <AiLifecycleStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {a.defaultModelDeploymentId
                      ? deploymentNameById.get(a.defaultModelDeploymentId) ??
                        a.defaultModelDeploymentId.slice(0, 8)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{a.outputFormat || '—'}</td>
                  <td className="px-4 py-3 text-xs">{a.autonomyLevel || '—'}</td>
                  <td className="px-4 py-3">{a.scope || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        as={NextLink}
                        href={ADMIN_ROUTES.aiControlAgent(a.id)}
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
                              setEditing(a)
                              setFormOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          {a.status !== AgentStatus.Active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => void activate(a.id)}
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeactivateTarget(a)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </>
                      ) : null}
                      <Button
                        as={NextLink}
                        href={`${ADMIN_ROUTES.aiControlPrompts}?agentId=${a.id}`}
                        size="sm"
                        variant="ghost"
                      >
                        Prompts
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

      <AgentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        agent={editing}
        deploymentOptions={deploymentOptions}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate agent"
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
