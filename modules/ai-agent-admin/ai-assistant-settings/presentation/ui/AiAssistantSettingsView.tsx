'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Select, Spinner, Textarea, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import * as api from '../../infrastructure/api/ai-assistant-settings.api'
import type { AiAssistantWorkspaceConfig } from '../../domain/model/ai-assistant-settings'

interface DeploymentOption {
  id: string
  name: string
  code: string
  providerDeploymentId: string
  modelName?: string
  providerCode?: string
  status: string
}

const DEFAULT_SYSTEM_PROMPT = 'You are Scopery AI Assistant.'
const DEFAULT_TEMPERATURE = '0.7'
const DEFAULT_MAX_TOKENS = '2000'

export function AiAssistantSettingsView() {
  const { currentWorkspaceId } = useAuth()

  const [config, setConfig] = useState<AiAssistantWorkspaceConfig | null>(null)
  const [deployments, setDeployments] = useState<DeploymentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // form state
  const [deploymentId, setDeploymentId] = useState<string>('')
  const [modelProvider, setModelProvider] = useState('')
  const [modelName, setModelName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState('')
  const [maxTokens, setMaxTokens] = useState('')

  useEffect(() => {
    if (!currentWorkspaceId) return
    void loadData(currentWorkspaceId)
  }, [currentWorkspaceId])

  async function loadData(workspaceId: string) {
    setLoading(true)
    setLoadError(null)
    try {
      const [cfg, deploymentsRes] = await Promise.all([
        api.getAiAssistantWorkspaceConfig(workspaceId),
        apiClient.get<{ items: DeploymentOption[] }>(
          AI_AGENT_ADMIN_ENDPOINTS.modelDeployments({ status: 'ACTIVE', size: 100 })
        ),
      ])

      const items = deploymentsRes?.items ?? []
      setDeployments(items)
      setConfig(cfg)

      if (cfg) {
        setDeploymentId(cfg.modelDeploymentId ?? '')
        setModelProvider(cfg.modelProvider ?? '')
        setModelName(cfg.modelName ?? '')
        setSystemPrompt(cfg.systemPromptOverride ?? '')
        setTemperature(cfg.temperatureOverride != null ? String(cfg.temperatureOverride) : '')
        setMaxTokens(cfg.maxOutputTokensOverride != null ? String(cfg.maxOutputTokensOverride) : '')
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  function handleDeploymentChange(id: string) {
    setDeploymentId(id)
    if (!id) {
      setModelProvider('')
      setModelName('')
      return
    }
    const dep = deployments.find((d) => d.id === id)
    if (dep) {
      setModelProvider(dep.providerCode ?? '')
      setModelName(dep.providerDeploymentId ?? '')
    }
  }

  async function handleSave() {
    if (!currentWorkspaceId) return
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const tempNum = temperature.trim() ? parseFloat(temperature) : null
      const tokensNum = maxTokens.trim() ? parseInt(maxTokens, 10) : null

      if (tempNum != null && (tempNum < 0 || tempNum > 2)) {
        setSaveError('Temperature must be between 0.0 and 2.0')
        return
      }
      if (tokensNum != null && (tokensNum < 1 || tokensNum > 32000)) {
        setSaveError('Max output tokens must be between 1 and 32000')
        return
      }

      const updated = await api.upsertAiAssistantWorkspaceConfig(currentWorkspaceId, {
        modelDeploymentId: deploymentId || null,
        modelProvider: modelProvider || null,
        modelName: modelName || null,
        systemPromptOverride: systemPrompt.trim() || null,
        temperatureOverride: tempNum,
        maxOutputTokensOverride: tokensNum,
      })
      setConfig(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setDeploymentId(config?.modelDeploymentId ?? '')
    setModelProvider(config?.modelProvider ?? '')
    setModelName(config?.modelName ?? '')
    setSystemPrompt(config?.systemPromptOverride ?? '')
    setTemperature(config?.temperatureOverride != null ? String(config.temperatureOverride) : '')
    setMaxTokens(
      config?.maxOutputTokensOverride != null ? String(config.maxOutputTokensOverride) : ''
    )
    setSaveError(null)
    setSaved(false)
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-6">
        <Typography variant="small" tone="danger">
          {loadError}
        </Typography>
      </div>
    )
  }

  const deploymentOptions = [
    { value: '', label: 'Use global default (application.yml)' },
    ...deployments.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.providerDeploymentId})`,
    })),
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <Typography variant="h3">AI Assistant Settings</Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Per-workspace configuration for the AI chat assistant. Leave fields empty to use global
          defaults from application.yml.
        </Typography>
      </div>

      {/* Model deployment */}
      <div className="space-y-3">
        <Typography variant="small" weight="semibold">Model Deployment</Typography>
        <Typography variant="small" tone="muted">
          Select an active deployment to use. This controls which provider and model ID are used.
        </Typography>
        <Select
          value={deploymentId}
          onValueChange={(v: string) => handleDeploymentChange(v)}
          options={deploymentOptions}
          placeholder="Select deployment..."
        />
        {deploymentId && (
          <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span className="font-medium">Provider:</span> {modelProvider || '—'} &nbsp;·&nbsp;
            <span className="font-medium">Model ID:</span> {modelName || '—'}
          </div>
        )}
        {!deploymentId && (
          <Typography variant="small" tone="muted">
            Defaults: provider <code>OPENAI</code>, model <code>gpt-4o</code>
          </Typography>
        )}
      </div>

      {/* System prompt */}
      <div className="space-y-3">
        <Typography variant="small" weight="semibold">System Prompt</Typography>
        <Typography variant="small" tone="muted">
          Override the assistant system prompt. Leave empty to use the default.
        </Typography>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder={DEFAULT_SYSTEM_PROMPT}
          rows={6}
          resize="vertical"
        />
        <Typography variant="small" tone="muted">
          Default: <em>&quot;{DEFAULT_SYSTEM_PROMPT}&quot;</em>
        </Typography>
      </div>

      {/* Temperature */}
      <div className="space-y-3">
        <Typography variant="small" weight="semibold">Temperature</Typography>
        <Typography variant="small" tone="muted">
          Controls randomness (0.0 = deterministic, 2.0 = very creative). Default: {DEFAULT_TEMPERATURE}
        </Typography>
        <Input
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder={DEFAULT_TEMPERATURE}
          min={0}
          max={2}
          step={0.1}
        />
      </div>

      {/* Max output tokens */}
      <div className="space-y-3">
        <Typography variant="small" weight="semibold">Max Output Tokens</Typography>
        <Typography variant="small" tone="muted">
          Maximum tokens in the AI response. Default: {DEFAULT_MAX_TOKENS}
        </Typography>
        <Input
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
          placeholder={DEFAULT_MAX_TOKENS}
          min={1}
          max={32000}
          step={100}
        />
      </div>

      {/* Actions */}
      {saveError && (
        <Typography variant="small" tone="danger">
          {saveError}
        </Typography>
      )}
      {saved && (
        <Typography variant="small" tone="success">
          Settings saved successfully.
        </Typography>
      )}

      <div className="flex gap-3">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
        <Button variant="ghost" onClick={handleReset} disabled={saving}>
          Reset
        </Button>
      </div>

      {config && (
        <Typography variant="small" tone="muted">
          Last updated: {new Date(config.updatedAt).toLocaleString()}
        </Typography>
      )}
    </div>
  )
}
