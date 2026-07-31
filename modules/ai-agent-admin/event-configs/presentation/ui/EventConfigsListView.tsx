'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useAgents } from '@/modules/ai-agent-admin/agents'
import { useDeployments } from '@/modules/ai-agent-admin/deployments'
import {
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
  DataTable, Card,
} from '@/shared/ui'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import {
  EVENT_ENVIRONMENT_OPTIONS,
  EVENT_TRIGGER_TYPE_OPTIONS,
  EventConfigStatus,
  type EventConfigEnvironment,
  type EventTriggerType,
} from '../../domain/enums/event-config.enum'
import { validateResolveIdentification } from '../../domain/rules/event-config.rules'
import type { AiEventConfig } from '../../domain/model/event-config'
import { useEventConfigs, useResolveEventConfig } from '../hooks/useEventConfigs'
import { useEventConfigMutations } from '../hooks/useEventConfigMutations'
import { EventConfigFormModal } from './EventConfigFormModal'
import { EventDefinitionSearchSelect } from '@/modules/admin/event-definitions'

const PAGE_SIZE = 20

export function EventConfigsListView() {
  const canManage = useCanManageAiConfig()
  const [keyword, setKeyword] = useState('')
  const [eventDefinitionId, setEventDefinitionId] = useState('')
  const [environment, setEnvironment] = useState<EventConfigEnvironment | ''>('')
  const [triggerType, setTriggerType] = useState<EventTriggerType | ''>('')
  const [status, setStatus] = useState<string>('')
  const [agentId, setAgentId] = useState('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiEventConfig | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiEventConfig | null>(null)

  const [resolveMode, setResolveMode] = useState<'definition' | 'pair'>('definition')
  const [resolveDefId, setResolveDefId] = useState('')
  const [resolveSource, setResolveSource] = useState('')
  const [resolveKey, setResolveKey] = useState('')
  const [resolveEnv, setResolveEnv] = useState<EventConfigEnvironment | ''>('')
  const [resolveFieldError, setResolveFieldError] = useState<string | null>(null)

  const { items: agents } = useAgents({ page: 0, size: 100 })
  const { items: deployments } = useDeployments({ page: 0, size: 100, status: 'ACTIVE' })
  const agentOptions = useMemo(
    () => agents.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` })),
    [agents]
  )
  const deploymentOptions = useMemo(
    () =>
      deployments.map((d) => ({
        value: d.id,
        label: `${d.name} (${d.environment})`,
      })),
    [deployments]
  )
  const agentNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of agents) m.set(a.id, a.name)
    return m
  }, [agents])

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      eventDefinitionId: eventDefinitionId.trim() || undefined,
      environment,
      triggerType,
      status: (status || '') as '' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED',
      agentId: agentId || undefined,
      page,
      size: PAGE_SIZE,
    }),
    [keyword, eventDefinitionId, environment, triggerType, status, agentId, page]
  )

  const { items, totalElements, loading, error, refetch } = useEventConfigs(params)
  const { saving, activate, deactivate } = useEventConfigMutations(refetch)
  const {
    result: resolveResult,
    loading: resolveLoading,
    error: resolveError,
    resolve,
    clear: clearResolve,
  } = useResolveEventConfig()
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  const handleResolve = async () => {
    setResolveFieldError(null)
    const payload =
      resolveMode === 'definition'
        ? {
            eventDefinitionId: resolveDefId.trim() || undefined,
            environment: resolveEnv,
          }
        : {
            sourceSystem: resolveSource.trim() || undefined,
            eventKey: resolveKey.trim() || undefined,
            environment: resolveEnv,
          }
    const idError = validateResolveIdentification(payload)
    if (idError) {
      setResolveFieldError(idError)
      return
    }
    try {
      await resolve(payload)
    } catch {
      /* error in hook */
    }
  }

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Event configs</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Link business events to agent + prompt + deployment
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
            Create config
          </Button>
        ) : null}
      </div>

      <Card className="bg-neutral-50 p-md">
        <Typography variant="h3" className="mb-sm">
          Resolve tester
        </Typography>
        <Typography variant="caption" tone="muted" className="mb-md block">
          Select an event definition <strong>or</strong> use source system + event key (not both).
        </Typography>
        <div className="mb-md flex flex-wrap gap-sm">
          <Button
            size="sm"
            variant={resolveMode === 'definition' ? 'primary' : 'outline'}
            onClick={() => {
              setResolveMode('definition')
              clearResolve()
              setResolveFieldError(null)
            }}
          >
            By definition
          </Button>
          <Button
            size="sm"
            variant={resolveMode === 'pair' ? 'primary' : 'outline'}
            onClick={() => {
              setResolveMode('pair')
              clearResolve()
              setResolveFieldError(null)
            }}
          >
            By source + key
          </Button>
        </div>
        <div className="flex flex-wrap gap-sm">
          {resolveMode === 'definition' ? (
            <div className="min-w-[220px] flex-1">
              <EventDefinitionSearchSelect value={resolveDefId} onChange={setResolveDefId} />
            </div>
          ) : (
            <>
              <div className="min-w-[140px] flex-1">
                <Input
                  placeholder="Source system"
                  value={resolveSource}
                  onChange={(e) => setResolveSource(e.target.value)}
                />
              </div>
              <div className="min-w-[140px] flex-1">
                <Input
                  placeholder="Event key"
                  value={resolveKey}
                  onChange={(e) => setResolveKey(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="w-32">
            <Select
              value={resolveEnv}
              onValueChange={(v: string) => setResolveEnv((v || '') as EventConfigEnvironment | '')}
              options={[
                { value: '', label: 'Env (default)' },
                ...EVENT_ENVIRONMENT_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
            />
          </div>
          <Button size="sm" disabled={resolveLoading} onClick={() => void handleResolve()}>
            Resolve
          </Button>
        </div>
        {resolveFieldError ? (
          <Typography tone="error" variant="small" className="mt-sm">
            {resolveFieldError}
          </Typography>
        ) : null}
        {resolveError ? (
          <Typography tone="error" variant="small" className="mt-sm">
            {resolveError}
          </Typography>
        ) : null}
        {resolveResult ? (
          <Card className="mt-md p-md">
            <Typography weight="medium">{resolveResult.name}</Typography>
            <Typography variant="caption" tone="muted" className="block font-normal">
              {resolveResult.code} · {resolveResult.environment} · {resolveResult.status}
            </Typography>
            <Button
              as={NextLink}
              href={ADMIN_ROUTES.aiControlEventConfig(resolveResult.id)}
              size="sm"
              variant="ghost"
              className="mt-sm"
            >
              Open resolved config
            </Button>
          </Card>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-sm">
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
        <div className="min-w-[160px] flex-1">
          <EventDefinitionSearchSelect
            optional
            value={eventDefinitionId}
            onChange={(value) => {
              setEventDefinitionId(value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-32">
          <Select
            value={environment}
            onValueChange={(v: string) => {
              setEnvironment((v || '') as EventConfigEnvironment | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All envs' },
              ...EVENT_ENVIRONMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={triggerType}
            onValueChange={(v: string) => {
              setTriggerType((v || '') as EventTriggerType | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All triggers' },
              ...EVENT_TRIGGER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
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
              { value: EventConfigStatus.Active, label: 'Active' },
              { value: EventConfigStatus.Inactive, label: 'Inactive' },
              { value: EventConfigStatus.Deprecated, label: 'Deprecated' },
            ]}
          />
        </div>
        <div className="w-44">
          <Select
            value={agentId}
            onValueChange={(v: string) => {
              setAgentId(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All agents' }, ...agentOptions]}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Event Configs List"
          rows={items}
          rowKey={(c) => String(c.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'code',
              header: 'Code',
              accessor: 'code',
              kind: 'code',
              cellClassName: 'text-xs',
            },
            { id: 'name', header: 'Name', accessor: 'name' },
            {
              id: 'event-def',
              header: 'Event def',
              cell: (c) => <>—</>,
              cellClassName: 'text-xs',
            },
            { id: 'env', header: 'Env', accessor: 'environment' },
            { id: 'trigger', header: 'Trigger', accessor: 'triggerType' },
            {
              id: 'agent',
              header: 'Agent',
              cell: (c) => <>{c.agentId ? (agentNameById.get(c.agentId) ?? '—') : '—'}</>,
              cellClassName: 'text-xs',
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
                  <div className="flex flex-wrap gap-1">
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlEventConfig(c.id)}
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
                            setEditing(c)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        {c.status !== EventConfigStatus.Active ? (
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
                      </>
                    ) : null}
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlPlayground}
                      size="sm"
                      variant="ghost"
                    >
                      Playground
                    </Button>
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlExecutions}
                      size="sm"
                      variant="ghost"
                    >
                      Executions
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

      <EventConfigFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        config={editing}
        agentOptions={agentOptions}
        deploymentOptions={deploymentOptions}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate event config"
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
