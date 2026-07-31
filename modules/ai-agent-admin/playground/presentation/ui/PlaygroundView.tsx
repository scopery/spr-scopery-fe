'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { ADMIN_ROUTES } from '@/modules/admin'
import { FEATURES } from '@/config/features'
import {
  Button,
  Card,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { parseInputVariablesJson } from '@/modules/ai-agent-admin/executions'
import { useCanUsePlayground } from '../hooks/useCanUsePlayground'
import { usePlaygroundActions } from '../hooks/usePlaygroundActions'
import { usePlaygroundOptions } from '../hooks/usePlaygroundOptions'

type PlaygroundMode = 'event-config' | 'direct' | 'prompt-preview'

function optionLabel(item: { label: string; code?: string; status?: string }) {
  const code = item.code ? ` (${item.code})` : ''
  const status = item.status ? ` · ${item.status}` : ''
  return `${item.label}${code}${status}`
}

export function PlaygroundView() {
  const canUse = useCanUsePlayground()
  const playgroundEnabled = FEATURES.aiAgentPlayground

  const [mode, setMode] = useState<PlaygroundMode>('event-config')
  const [eventConfigId, setEventConfigId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [promptVersionId, setPromptVersionId] = useState('')
  const [modelDeploymentId, setModelDeploymentId] = useState('')
  const [requestId, setRequestId] = useState('')
  const [inputVariablesRaw, setInputVariablesRaw] = useState('{}')
  const [formError, setFormError] = useState<string | null>(null)

  const { options, loading, error, refetch } = usePlaygroundOptions(
    playgroundEnabled && canUse
  )
  const {
    running,
    lastRun,
    preview,
    runEventConfig,
    runDirect,
    previewPrompt,
  } = usePlaygroundActions()

  const eventConfigOptions = useMemo(
    () =>
      (options?.eventConfigs ?? []).map((o) => ({
        value: o.id,
        label: optionLabel(o),
      })),
    [options]
  )
  const agentOptions = useMemo(
    () =>
      (options?.agents ?? []).map((o) => ({
        value: o.id,
        label: optionLabel(o),
      })),
    [options]
  )
  const promptVersionOptions = useMemo(
    () =>
      (options?.promptVersions ?? []).map((o) => ({
        value: o.id,
        label: optionLabel(o),
      })),
    [options]
  )
  const deploymentOptions = useMemo(
    () =>
      (options?.modelDeployments ?? []).map((o) => ({
        value: o.id,
        label: optionLabel(o),
      })),
    [options]
  )

  const handleSubmit = async () => {
    setFormError(null)
    if (!playgroundEnabled) return

    const vars = parseInputVariablesJson(inputVariablesRaw)
    if (vars.error) {
      setFormError(vars.error)
      return
    }

    try {
      if (mode === 'event-config') {
        if (!eventConfigId) {
          setFormError('Event config is required')
          return
        }
        await runEventConfig(eventConfigId, {
          requestId: requestId.trim() || null,
          inputVariables: vars.value,
        })
      } else if (mode === 'direct') {
        if (!agentId || !promptVersionId || !modelDeploymentId) {
          setFormError('Agent, prompt version, and model deployment are required')
          return
        }
        await runDirect({
          requestId: requestId.trim() || null,
          agentId,
          promptVersionId,
          modelDeploymentId,
          inputVariables: vars.value,
        })
      } else {
        if (!promptVersionId) {
          setFormError('Prompt version is required')
          return
        }
        await previewPrompt(promptVersionId, vars.value)
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setFormError(err.problem.detail || 'Playground request failed')
      }
    }
  }

  if (!canUse) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography variant="h2">Playground</Typography>
        <Typography tone="error">
          You do not have permission to use the AI playground (`AI_PLAYGROUND_USE`).
        </Typography>
      </Stack>
    )
  }

  if (!playgroundEnabled) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography variant="h2">Playground</Typography>
        <Typography tone="muted">
          Playground is unavailable. Enable `AIAGENT_PLAYGROUND_ENABLED` on the server and set
          `NEXT_PUBLIC_AIAGENT_PLAYGROUND_ENABLED` (or use mock mode). Run APIs are not called
          while disabled.
        </Typography>
      </Stack>
    )
  }

  if (loading && !options) {
    return <PageSkeleton variant="detail" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Playground</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Sandbox runs for event configs, direct agent+prompt+deployment, and prompt preview
            (no model call). History linked via execution logs when a run returns an execution id.
          </Typography>
        </div>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.aiControlExecutions}
          size="sm"
          variant="outline"
        >
          Execution logs
        </Button>
      </div>

      {error ? (
        <div className="flex flex-wrap items-center gap-sm">
          <Typography tone="error" variant="small">
            {error}
          </Typography>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Retry options
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-sm">
        {(
          [
            ['event-config', 'Run event config'],
            ['direct', 'Direct run'],
            ['prompt-preview', 'Prompt preview'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={mode === value ? 'primary' : 'outline'}
            onClick={() => {
              setMode(value)
              setFormError(null)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="bg-neutral-50 p-md">
        <Stack direction="vertical" spacing="sm">
          {mode === 'event-config' ? (
            <div className="max-w-md">
              <Typography variant="caption" className="mb-1 block">
                Event config
              </Typography>
              <Select
                value={eventConfigId}
                onValueChange={setEventConfigId}
                options={[
                  { value: '', label: 'Select event config…' },
                  ...eventConfigOptions,
                ]}
              />
            </div>
          ) : null}

          {mode === 'direct' ? (
            <div className="grid gap-sm md:grid-cols-3">
              <div>
                <Typography variant="caption" className="mb-1 block">
                  Agent
                </Typography>
                <Select
                  value={agentId}
                  onValueChange={setAgentId}
                  options={[{ value: '', label: 'Select agent…' }, ...agentOptions]}
                />
              </div>
              <div>
                <Typography variant="caption" className="mb-1 block">
                  Prompt version
                </Typography>
                <Select
                  value={promptVersionId}
                  onValueChange={setPromptVersionId}
                  options={[
                    { value: '', label: 'Select prompt version…' },
                    ...promptVersionOptions,
                  ]}
                />
              </div>
              <div>
                <Typography variant="caption" className="mb-1 block">
                  Model deployment
                </Typography>
                <Select
                  value={modelDeploymentId}
                  onValueChange={setModelDeploymentId}
                  options={[
                    { value: '', label: 'Select deployment…' },
                    ...deploymentOptions,
                  ]}
                />
              </div>
            </div>
          ) : null}

          {mode === 'prompt-preview' ? (
            <div className="max-w-md">
              <Typography variant="caption" className="mb-1 block">
                Prompt version
              </Typography>
              <Select
                value={promptVersionId}
                onValueChange={setPromptVersionId}
                options={[
                  { value: '', label: 'Select prompt version…' },
                  ...promptVersionOptions,
                ]}
              />
            </div>
          ) : null}

          {mode !== 'prompt-preview' ? (
            <div className="max-w-md">
              <Typography variant="caption" className="mb-1 block">
                Request id (optional)
              </Typography>
              <Input
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="Leave empty to auto-generate"
              />
            </div>
          ) : null}

          <div>
            <Typography variant="caption" className="mb-1 block">
              Input variables (JSON object)
            </Typography>
            <Textarea
              value={inputVariablesRaw}
              onChange={(e) => setInputVariablesRaw(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {formError ? (
            <Typography tone="error" variant="small">
              {formError}
            </Typography>
          ) : null}

          <div>
            <Button size="sm" loading={running} onClick={() => void handleSubmit()}>
              {mode === 'prompt-preview' ? 'Preview prompt' : 'Run playground'}
            </Button>
          </div>
        </Stack>
      </Card>

      {lastRun ? (
        <Card className="p-md">
          <Typography variant="h3" className="mb-sm">
            Run result
          </Typography>
          <dl className="grid gap-sm sm:grid-cols-2">
            <div>
              <Typography variant="caption" tone="muted">
                Status
              </Typography>
              <Typography>{lastRun.status}</Typography>
            </div>
            {lastRun.requestId ? (
              <div>
                <Typography variant="caption" tone="muted">
                  Request id
                </Typography>
                <Typography className="font-mono text-sm">{lastRun.requestId}</Typography>
              </div>
            ) : null}
            {lastRun.executionId ? (
              <div>
                <Typography variant="caption" tone="muted">
                  Execution
                </Typography>
                <Button
                  as={NextLink}
                  href={ADMIN_ROUTES.aiControlExecution(lastRun.executionId)}
                  size="sm"
                  variant="ghost"
                  className="px-0"
                >
                  Open log
                </Button>
              </div>
            ) : null}
            {lastRun.totalTokenCount != null ? (
              <div>
                <Typography variant="caption" tone="muted">
                  Tokens
                </Typography>
                <Typography>
                  {lastRun.inputTokenCount ?? '—'} in / {lastRun.outputTokenCount ?? '—'} out /{' '}
                  {lastRun.totalTokenCount} total
                </Typography>
              </div>
            ) : null}
            {lastRun.durationMs != null ? (
              <div>
                <Typography variant="caption" tone="muted">
                  Duration
                </Typography>
                <Typography>{lastRun.durationMs} ms</Typography>
              </div>
            ) : null}
            {lastRun.errorMessage ? (
              <div className="sm:col-span-2">
                <Typography variant="caption" tone="muted">
                  Error
                </Typography>
                <Typography tone="error">
                  {lastRun.errorCode ? `${lastRun.errorCode}: ` : ''}
                  {lastRun.errorMessage}
                </Typography>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <Typography variant="caption" tone="muted">
                Output
              </Typography>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-sm font-mono text-sm">
                {lastRun.output ?? '—'}
              </pre>
            </div>
          </dl>
        </Card>
      ) : null}

      {preview ? (
        <Card className="p-md">
          <Typography variant="h3" className="mb-sm">
            Prompt preview
          </Typography>
          {preview.missingVariables?.length ? (
            <Typography tone="error" variant="small" className="mb-sm block">
              Missing variables: {preview.missingVariables.join(', ')}
            </Typography>
          ) : null}
          {preview.variables?.length ? (
            <Typography variant="caption" tone="muted" className="mb-sm block">
              Variables: {preview.variables.join(', ')}
            </Typography>
          ) : null}
          <Typography variant="caption" tone="muted">
            System prompt
          </Typography>
          <pre className="mb-md mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-sm font-mono text-sm">
            {preview.renderedSystemPrompt || '—'}
          </pre>
          <Typography variant="caption" tone="muted">
            User prompt
          </Typography>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-sm font-mono text-sm">
            {preview.renderedUserPrompt || '—'}
          </pre>
        </Card>
      ) : null}
    </Stack>
  )
}
