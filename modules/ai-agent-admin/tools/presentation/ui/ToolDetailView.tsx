'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useAgents } from '@/modules/ai-agent-admin/agents'
import { AgentStatus } from '@/modules/ai-agent-admin/agents'
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { parseInputVariablesJson } from '@/modules/ai-agent-admin/executions'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { ToolStatus } from '../../domain/enums/tool.enum'
import {
  isWriteLikeMutation,
  normalizePermissionCode,
  validatePermissionCode,
} from '../../domain/rules/tool.rules'
import type { AiToolPermission, ExecuteToolResult } from '../../domain/model/tool'
import { useCanManageTools, useCanViewTools } from '../hooks/useToolPermissions'
import { useToolMutations } from '../hooks/useToolMutations'
import { useToolBindings, useToolDetail } from '../hooks/useTools'
import { ToolFormModal } from './ToolFormModal'

type DetailTab = 'overview' | 'permissions' | 'bindings' | 'debug' | 'audit'

export function ToolDetailView() {
  const { toolId } = useParams<{ toolId: string }>()
  const canView = useCanViewTools()
  const canManage = useCanManageTools()
  const [tab, setTab] = useState<DetailTab>('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [unbindAgentId, setUnbindAgentId] = useState<string | null>(null)
  const [removePerm, setRemovePerm] = useState<AiToolPermission | null>(null)
  const [debugConfirmOpen, setDebugConfirmOpen] = useState(false)

  const [permCode, setPermCode] = useState('')
  const [permDescription, setPermDescription] = useState('')
  const [permError, setPermError] = useState<string | null>(null)
  const [bindAgentId, setBindAgentId] = useState('')
  const [bindError, setBindError] = useState<string | null>(null)
  const [debugInputRaw, setDebugInputRaw] = useState('{}')
  const [debugError, setDebugError] = useState<string | null>(null)
  const [lastDebug, setLastDebug] = useState<ExecuteToolResult | null>(null)

  const { tool, loading, error, refetch } = useToolDetail(toolId)
  const { bindings, refetch: refetchBindings } = useToolBindings(
    toolId,
    tab === 'bindings' || tab === 'overview'
  )
  const { items: agents } = useAgents({ page: 0, size: 100, status: AgentStatus.Active })
  const {
    saving,
    activate,
    deactivate,
    addPermission,
    removePermission,
    bindAgent,
    unbindAgent,
    execute,
  } = useToolMutations(() => {
    void refetch()
    void refetchBindings()
  })

  const boundIds = useMemo(
    () => new Set(bindings.map((b) => b.agentId)),
    [bindings]
  )
  const agentOptions = useMemo(
    () =>
      agents
        .filter((a) => !boundIds.has(a.id))
        .map((a) => ({ value: a.id, label: `${a.name} (${a.code})` })),
    [agents, boundIds]
  )

  const permissions = tool?.permissions ?? []

  const handleAddPermission = async () => {
    setPermError(null)
    const codeError = validatePermissionCode(permCode)
    if (codeError) {
      setPermError(codeError)
      return
    }
    try {
      await addPermission(toolId, {
        permissionCode: normalizePermissionCode(permCode),
        description: permDescription.trim() || null,
      })
      setPermCode('')
      setPermDescription('')
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setPermError(err.problem.detail || 'Failed to add permission')
      }
    }
  }

  const handleBind = async () => {
    setBindError(null)
    if (!bindAgentId) {
      setBindError('Select an agent')
      return
    }
    try {
      await bindAgent(toolId, { agentId: bindAgentId })
      setBindAgentId('')
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setBindError(err.problem.detail || 'Failed to bind agent')
      }
    }
  }

  const runDebug = async () => {
    setDebugError(null)
    const vars = parseInputVariablesJson(debugInputRaw)
    if (vars.error) {
      setDebugError(vars.error)
      return
    }
    try {
      const result = await execute(toolId, { input: vars.value ?? null })
      setLastDebug(result)
      setDebugConfirmOpen(false)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setDebugError(err.problem.detail || 'Debug execute failed')
      }
      setDebugConfirmOpen(false)
    }
  }

  if (!canView) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">You do not have permission to view tools.</Typography>
      </Stack>
    )
  }

  if (loading && !tool) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !tool) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Tool not found'}</Typography>
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlTools} size="sm" variant="outline">
          Back to tools
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlTools} size="sm" variant="ghost">
            ← Tools
          </Button>
          <Typography variant="h2" className="mt-sm">
            {tool.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {tool.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {tool.status !== ToolStatus.Active ? (
                <Button size="sm" disabled={saving} onClick={() => void activate(tool.id)}>
                  Activate
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setDeactivateOpen(true)}>
                  Deactivate
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-sm">
        {(
          [
            ['overview', 'Overview'],
            ['permissions', 'Permissions'],
            ['bindings', 'Agent bindings'],
            ['debug', 'Debug execute'],
            ['audit', 'Audit'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={tab === value ? 'primary' : 'outline'}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'overview' ? (
        <dl className="grid gap-md sm:grid-cols-2">
          <div>
            <Typography variant="caption" tone="muted">
              Status
            </Typography>
            <div className="mt-1">
              <AiLifecycleStatusBadge status={tool.status} />
            </div>
          </div>
          <div>
            <Typography variant="caption" tone="muted">
              Category
            </Typography>
            <Typography className="mt-1">{tool.category || '—'}</Typography>
          </div>
          <div>
            <Typography variant="caption" tone="muted">
              Mutation type
            </Typography>
            <div className="mt-1">
              {tool.mutationType ? (
                <Badge tone={isWriteLikeMutation(tool.mutationType) ? 'warning' : 'neutral'}>
                  {tool.mutationType}
                </Badge>
              ) : (
                '—'
              )}
            </div>
          </div>
          <div>
            <Typography variant="caption" tone="muted">
              Human approval
            </Typography>
            <Typography className="mt-1">
              {tool.requiresHumanApproval ? 'Required' : 'Not required'}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" tone="muted">
              Permission / agent counts
            </Typography>
            <Typography className="mt-1">
              {tool.permissionCount ?? permissions.length} /{' '}
              {tool.agentBindingCount ?? bindings.length}
            </Typography>
          </div>
          <div className="sm:col-span-2">
            <Typography variant="caption" tone="muted">
              Description
            </Typography>
            <Typography className="mt-1">{tool.description || '—'}</Typography>
          </div>
        </dl>
      ) : null}

      {tab === 'permissions' ? (
        <Stack direction="vertical" spacing="md">
          <Typography variant="caption" tone="muted">
            Permission catalog picker is not in the Wave 5 contract (W5-GAP-10). Use a controlled
            permission code string (uppercase + underscores).
          </Typography>
          {canManage ? (
            <div className="border border-neutral-200 bg-neutral-50 p-md">
              <Stack direction="vertical" spacing="sm">
                <Input
                  label="Permission code"
                  value={permCode}
                  onChange={(e) => setPermCode(e.target.value)}
                  placeholder="e.g. PROJECT_DOCUMENT_READ"
                />
                <Input
                  label="Description (optional)"
                  value={permDescription}
                  onChange={(e) => setPermDescription(e.target.value)}
                />
                {permError ? (
                  <Typography tone="error" variant="small">
                    {permError}
                  </Typography>
                ) : null}
                <Button size="sm" disabled={saving} onClick={() => void handleAddPermission()}>
                  Add permission
                </Button>
              </Stack>
            </div>
          ) : null}
          <div className="overflow-x-auto border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-md py-sm font-medium">Code</th>
                  <th className="px-md py-sm font-medium">Description</th>
                  <th className="px-md py-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className="px-md py-sm font-mono text-xs">{p.permissionCode}</td>
                    <td className="px-md py-sm">{p.description || '—'}</td>
                    <td className="px-md py-sm">
                      {canManage ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRemovePerm(p)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-md py-lg text-center text-neutral-500">
                      No permissions bound
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Stack>
      ) : null}

      {tab === 'bindings' ? (
        <Stack direction="vertical" spacing="md">
          {canManage ? (
            <div className="border border-neutral-200 bg-neutral-50 p-md">
              <Stack direction="vertical" spacing="sm">
                <Typography variant="caption">Bind active agent</Typography>
                <Select
                  value={bindAgentId}
                  onValueChange={setBindAgentId}
                  options={[
                    { value: '', label: 'Select agent…' },
                    ...agentOptions,
                  ]}
                />
                {bindError ? (
                  <Typography tone="error" variant="small">
                    {bindError}
                  </Typography>
                ) : null}
                <Button size="sm" disabled={saving} onClick={() => void handleBind()}>
                  Bind agent
                </Button>
              </Stack>
            </div>
          ) : null}
          <div className="overflow-x-auto border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-md py-sm font-medium">Agent</th>
                  <th className="px-md py-sm font-medium">Status</th>
                  <th className="px-md py-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bindings.map((b) => (
                  <tr key={b.agentId} className="border-t border-neutral-100">
                    <td className="px-md py-sm">
                      <Button
                        as={NextLink}
                        href={ADMIN_ROUTES.aiControlAgent(b.agentId)}
                        size="sm"
                        variant="ghost"
                        className="px-0"
                      >
                        {b.agentName || b.agentCode || b.agentId}
                      </Button>
                      {b.agentCode ? (
                        <Typography variant="caption" tone="muted" className="block font-mono">
                          {b.agentCode}
                        </Typography>
                      ) : null}
                    </td>
                    <td className="px-md py-sm">
                      {b.status ? <AiLifecycleStatusBadge status={b.status} /> : '—'}
                    </td>
                    <td className="px-md py-sm">
                      {canManage ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUnbindAgentId(b.agentId)}
                        >
                          Unbind
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {bindings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-md py-lg text-center text-neutral-500">
                      No agents bound
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Stack>
      ) : null}

      {tab === 'debug' ? (
        <Stack direction="vertical" spacing="md">
          <div className="border border-amber-200 bg-amber-50 p-md">
            <Typography variant="h3">Debug execution</Typography>
            <Typography variant="caption" className="mt-1 block">
              Stub / no-op + log only (W5-GAP-13). This is not a production business execution.
            </Typography>
          </div>
          {canManage ? (
            <>
              <div>
                <Typography variant="caption" className="mb-1 block">
                  Optional input (JSON object)
                </Typography>
                <Textarea
                  value={debugInputRaw}
                  onChange={(e) => setDebugInputRaw(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              {debugError ? (
                <Typography tone="error" variant="small">
                  {debugError}
                </Typography>
              ) : null}
              <Button size="sm" disabled={saving} onClick={() => setDebugConfirmOpen(true)}>
                Run debug execute
              </Button>
            </>
          ) : (
            <Typography tone="muted">Manage permission required to debug execute.</Typography>
          )}
          {lastDebug ? (
            <div className="border border-neutral-200 p-md">
              <Typography variant="h3" className="mb-sm">
                Last debug result
              </Typography>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-sm">
                {JSON.stringify(lastDebug, null, 2)}
              </pre>
            </div>
          ) : null}
        </Stack>
      ) : null}

      {tab === 'audit' ? (
        <Stack direction="vertical" spacing="sm">
          <Typography variant="caption" tone="muted">
            No dedicated tool audit endpoint in Wave 5 contract. Use timestamps below and platform
            audit / execution logs for operational history.
          </Typography>
          <dl className="grid gap-md sm:grid-cols-2">
            <div>
              <Typography variant="caption" tone="muted">
                Created
              </Typography>
              <Typography className="mt-1 font-mono text-sm">{tool.createdAt}</Typography>
            </div>
            <div>
              <Typography variant="caption" tone="muted">
                Updated
              </Typography>
              <Typography className="mt-1 font-mono text-sm">{tool.updatedAt}</Typography>
            </div>
          </dl>
          <Button
            as={NextLink}
            href={ADMIN_ROUTES.aiControlExecutions}
            size="sm"
            variant="outline"
          >
            Open execution logs
          </Button>
        </Stack>
      ) : null}

      <ToolFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        tool={tool}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate tool"
        message={`Deactivate “${tool.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(tool.id).then(() => setDeactivateOpen(false))}
      />
      <ConfirmDialog
        open={removePerm != null}
        onClose={() => setRemovePerm(null)}
        title="Remove permission"
        message={`Remove “${removePerm?.permissionCode}”?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() =>
          removePerm
            ? void removePermission(tool.id, removePerm.id).then(() => setRemovePerm(null))
            : undefined
        }
      />
      <ConfirmDialog
        open={unbindAgentId != null}
        onClose={() => setUnbindAgentId(null)}
        title="Unbind agent"
        message="Unbind this agent from the tool?"
        confirmLabel="Unbind"
        variant="danger"
        onConfirm={() =>
          unbindAgentId
            ? void unbindAgent(tool.id, unbindAgentId).then(() => setUnbindAgentId(null))
            : undefined
        }
      />
      <ConfirmDialog
        open={debugConfirmOpen}
        onClose={() => setDebugConfirmOpen(false)}
        title="Debug execution"
        message={
          isWriteLikeMutation(tool.mutationType)
            ? `Confirm debug execute for WRITE-like tool “${tool.name}” (${tool.mutationType}). Stub/no-op only — not production.`
            : `Confirm debug execute for “${tool.name}”. Stub/no-op only — not production.`
        }
        confirmLabel="Run debug"
        variant={isWriteLikeMutation(tool.mutationType) ? 'danger' : 'default'}
        onConfirm={() => void runDebug()}
      />
    </Stack>
  )
}
