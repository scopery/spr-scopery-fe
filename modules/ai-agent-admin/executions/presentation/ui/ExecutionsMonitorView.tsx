'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useAgents } from '@/modules/ai-agent-admin/agents'
import { useEventConfigs } from '@/modules/ai-agent-admin/event-configs'
import { EventDefinitionSearchSelect } from '@/modules/admin/event-definitions'
import {
  EVENT_ENVIRONMENT_OPTIONS,
  type EventConfigEnvironment,
} from '@/modules/ai-agent-admin/event-configs'
import { Button, Input, PageSkeleton, Select, Stack, Typography, DataTable, Card } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import {
  EXECUTION_LOG_STATUS_OPTIONS,
  EXECUTION_TRIGGER_SOURCE_OPTIONS,
  ExecutionTriggerSource,
  type ExecutionLogStatus,
  type ExecutionTriggerSource as TriggerSource,
} from '../../domain/enums/execution.enum'
import {
  parseInputVariablesJson,
  validateExecuteByEventPayload,
} from '../../domain/rules/execution.rules'
import { useExecutionLogs } from '../hooks/useExecutionLogs'
import { useExecutionTriggers } from '../hooks/useExecutionTriggers'
import { useCanRunExecutions, useCanViewExecutionLogs } from '../hooks/useExecutionPermissions'

const PAGE_SIZE = 20

export function ExecutionsMonitorView() {
  const canRun = useCanRunExecutions()
  const canView = useCanViewExecutionLogs()

  const [requestId, setRequestId] = useState('')
  const [eventConfigId, setEventConfigId] = useState('')
  const [eventDefinitionId, setEventDefinitionId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [triggerSource, setTriggerSource] = useState<TriggerSource | ''>('')
  const [status, setStatus] = useState<ExecutionLogStatus | ''>('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [page, setPage] = useState(0)

  const [runMode, setRunMode] = useState<'event' | 'config'>('event')
  const [idMode, setIdMode] = useState<'definition' | 'code' | 'pair'>('definition')
  const [runDefId, setRunDefId] = useState('')
  const [runEventCode, setRunEventCode] = useState('')
  const [runSource, setRunSource] = useState('')
  const [runKey, setRunKey] = useState('')
  const [runEnv, setRunEnv] = useState<EventConfigEnvironment | ''>('')
  const [runConfigId, setRunConfigId] = useState('')
  const [runRequestId, setRunRequestId] = useState('')
  const [inputVariablesRaw, setInputVariablesRaw] = useState('{}')
  const [runError, setRunError] = useState<string | null>(null)

  const { items: agents } = useAgents({ page: 0, size: 100 })
  const { items: eventConfigs } = useEventConfigs({ page: 0, size: 100 })
  const agentOptions = useMemo(
    () => agents.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` })),
    [agents]
  )
  const eventConfigOptions = useMemo(
    () => eventConfigs.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
    [eventConfigs]
  )

  const params = useMemo(
    () => ({
      requestId: requestId.trim() || undefined,
      eventConfigId: eventConfigId || undefined,
      eventDefinitionId: eventDefinitionId.trim() || undefined,
      agentId: agentId || undefined,
      triggerSource,
      status,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      page,
      size: PAGE_SIZE,
    }),
    [
      requestId,
      eventConfigId,
      eventDefinitionId,
      agentId,
      triggerSource,
      status,
      createdFrom,
      createdTo,
      page,
    ]
  )

  const { items, totalElements, loading, error, refetch } = useExecutionLogs(params)
  const { running, lastResult, runByEvent, runByEventConfig } = useExecutionTriggers()
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  const handleRun = async () => {
    setRunError(null)
    const vars = parseInputVariablesJson(inputVariablesRaw)
    if (vars.error) {
      setRunError(vars.error)
      return
    }
    try {
      if (runMode === 'config') {
        if (!runConfigId) {
          setRunError('Event config is required')
          return
        }
        await runByEventConfig(runConfigId, {
          requestId: runRequestId.trim() || null,
          inputVariables: vars.value,
        })
      } else {
        const body = {
          requestId: runRequestId.trim() || null,
          environment: runEnv || null,
          triggerSource: ExecutionTriggerSource.Manual,
          inputVariables: vars.value,
          eventDefinitionId: idMode === 'definition' ? runDefId.trim() || null : null,
          eventCode: idMode === 'code' ? runEventCode.trim() || null : null,
          sourceSystem: idMode === 'pair' ? runSource.trim() || null : null,
          eventKey: idMode === 'pair' ? runKey.trim() || null : null,
        }
        const idError = validateExecuteByEventPayload(body)
        if (idError) {
          setRunError(idError)
          return
        }
        await runByEvent(body)
      }
      void refetch()
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setRunError(err.problem.detail || 'Execution failed')
      }
    }
  }

  const copyRequestId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* ignore */
    }
  }

  if (!canView) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">You do not have permission to view execution logs.</Typography>
      </Stack>
    )
  }

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div>
        <Typography variant="h2">Executions</Typography>
        <Typography variant="caption" tone="muted" className="mt-1 block">
          Monitor AI runs (GET logs only). Log status transitions are service-orchestrated — not
          available in the browser.
        </Typography>
      </div>

      {canRun ? (
        <Card className="bg-neutral-50 p-md">
          <Typography variant="h3" className="mb-sm">
            Manual run
          </Typography>
          <div className="mb-md flex flex-wrap gap-sm">
            <Button
              size="sm"
              variant={runMode === 'event' ? 'primary' : 'outline'}
              onClick={() => setRunMode('event')}
            >
              By event
            </Button>
            <Button
              size="sm"
              variant={runMode === 'config' ? 'primary' : 'outline'}
              onClick={() => setRunMode('config')}
            >
              By event config
            </Button>
          </div>

          {runMode === 'event' ? (
            <div className="mb-md flex flex-wrap gap-sm">
              <Button
                size="sm"
                variant={idMode === 'definition' ? 'primary' : 'outline'}
                onClick={() => setIdMode('definition')}
              >
                Event definition
              </Button>
              <Button
                size="sm"
                variant={idMode === 'code' ? 'primary' : 'outline'}
                onClick={() => setIdMode('code')}
              >
                Event code
              </Button>
              <Button
                size="sm"
                variant={idMode === 'pair' ? 'primary' : 'outline'}
                onClick={() => setIdMode('pair')}
              >
                Source + key
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-sm">
            {runMode === 'config' ? (
              <div className="min-w-[200px] flex-1">
                <Select
                  value={runConfigId}
                  onValueChange={setRunConfigId}
                  options={[{ value: '', label: 'Select event config' }, ...eventConfigOptions]}
                />
              </div>
            ) : idMode === 'definition' ? (
              <div className="min-w-[200px] flex-1">
                <EventDefinitionSearchSelect value={runDefId} onChange={setRunDefId} />
              </div>
            ) : idMode === 'code' ? (
              <div className="min-w-[160px] flex-1">
                <Input
                  placeholder="Event code"
                  value={runEventCode}
                  onChange={(e) => setRunEventCode(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="min-w-[140px] flex-1">
                  <Input
                    placeholder="Source system"
                    value={runSource}
                    onChange={(e) => setRunSource(e.target.value)}
                  />
                </div>
                <div className="min-w-[140px] flex-1">
                  <Input
                    placeholder="Event key"
                    value={runKey}
                    onChange={(e) => setRunKey(e.target.value)}
                  />
                </div>
              </>
            )}
            {runMode === 'event' ? (
              <div className="w-32">
                <Select
                  value={runEnv}
                  onValueChange={(v: string) => setRunEnv((v || '') as EventConfigEnvironment | '')}
                  options={[
                    { value: '', label: 'Env' },
                    ...EVENT_ENVIRONMENT_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    })),
                  ]}
                />
              </div>
            ) : null}
            <div className="min-w-[140px] flex-1">
              <Input
                placeholder="Deduplication key (optional)"
                value={runRequestId}
                onChange={(e) => setRunRequestId(e.target.value)}
              />
            </div>
            <Button size="sm" disabled={running} onClick={() => void handleRun()}>
              Run
            </Button>
          </div>
          <div className="mt-md">
            <Typography variant="caption" tone="muted" className="mb-1 block">
              inputVariables (JSON object)
            </Typography>
            <textarea
              className="min-h-[80px] w-full border border-neutral-200 bg-white p-sm text-sm font-normal"
              value={inputVariablesRaw}
              onChange={(e) => setInputVariablesRaw(e.target.value)}
            />
          </div>
          {runError ? (
            <Typography tone="error" variant="small" className="mt-sm">
              {runError}
            </Typography>
          ) : null}
          {lastResult ? (
            <Card className="mt-md p-md">
              <div className="flex flex-wrap items-center gap-sm">
                <AiLifecycleStatusBadge status={lastResult.status} />
                <Typography variant="caption" className="font-normal">
                  {lastResult.executionId}
                </Typography>
              </div>
              <Typography variant="caption" tone="muted" className="mt-1 block">
                requestId: {lastResult.requestId} · tokens: {lastResult.totalTokenCount ?? '—'} ·{' '}
                {lastResult.durationMs ?? '—'}ms
              </Typography>
              {lastResult.errorMessage ? (
                <Typography tone="error" variant="small" className="mt-1">
                  {lastResult.errorMessage}
                </Typography>
              ) : null}
              {lastResult.executionId ? (
                <Button
                  as={NextLink}
                  href={ADMIN_ROUTES.aiControlExecution(lastResult.executionId)}
                  size="sm"
                  variant="ghost"
                  className="mt-sm"
                >
                  Open log detail
                </Button>
              ) : null}
            </Card>
          ) : null}
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[140px] flex-1">
          <Input
            placeholder="Request reference"
            value={requestId}
            onChange={(e) => {
              setRequestId(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-44">
          <Select
            value={eventConfigId}
            onValueChange={(v: string) => {
              setEventConfigId(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All configs' }, ...eventConfigOptions]}
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <EventDefinitionSearchSelect
            optional
            value={eventDefinitionId}
            onChange={(value) => {
              setEventDefinitionId(value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-40">
          <Select
            value={agentId}
            onValueChange={(v: string) => {
              setAgentId(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All agents' }, ...agentOptions]}
          />
        </div>
        <div className="w-36">
          <Select
            value={triggerSource}
            onValueChange={(v: string) => {
              setTriggerSource((v || '') as TriggerSource | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All triggers' },
              ...EXECUTION_TRIGGER_SOURCE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus((v || '') as ExecutionLogStatus | '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              ...EXECUTION_LOG_STATUS_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
          />
        </div>
        <div className="w-44">
          <Input
            type="datetime-local"
            value={createdFrom}
            onChange={(e) => {
              setCreatedFrom(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-44">
          <Input
            type="datetime-local"
            value={createdTo}
            onChange={(e) => {
              setCreatedTo(e.target.value)
              setPage(0)
            }}
          />
        </div>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Executions Monitor"
          rows={items}
          rowKey={(log) => String(log.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'request-id',
              header: 'Request ID',
              accessor: () => '—',
              kind: 'reference',
              cellClassName: 'text-xs',
            },
            { id: 'trigger', header: 'Trigger', cell: (log) => <>{log.triggerSource || '—'}</> },
            {
              id: 'event-config',
              header: 'Event config',
              cell: (log) => <>—</>,
              cellClassName: 'text-xs',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (log) => (
                <>
                  <AiLifecycleStatusBadge status={log.status} />
                </>
              ),
            },
            { id: 'tokens', header: 'Tokens', cell: (log) => <>{log.totalTokenCount ?? '—'}</> },
            { id: 'cost', header: 'Cost', cell: (log) => <>{log.estimatedCost ?? '—'}</> },
            {
              id: 'duration',
              header: 'Duration',
              cell: (log) => <>{log.durationMs != null ? `${log.durationMs}ms` : '—'}</>,
            },
            {
              id: 'created',
              header: 'Created',
              cell: (log) => <>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</>,
              cellClassName: 'text-xs text-neutral-500',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (log) => (
                <>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlExecution(log.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void copyRequestId(log.requestId)}
                    >
                      Copy ID
                    </Button>
                    {log.eventConfigId ? (
                      <Button
                        as={NextLink}
                        href={ADMIN_ROUTES.aiControlEventConfig(log.eventConfigId)}
                        size="sm"
                        variant="ghost"
                      >
                        Config
                      </Button>
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
    </Stack>
  )
}
