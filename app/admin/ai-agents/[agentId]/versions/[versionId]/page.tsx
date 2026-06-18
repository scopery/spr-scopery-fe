'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Typography,
  Button,
  ContentLoader,
  Textarea,
  Select,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import * as aiAgentService from '@/services/ai-agent-control.service'
import { useAiAgentVersion } from '@/hooks/useAiAgents'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import {
  AIAgentVersionStatusBadge,
  formatEstimatedCost,
} from '@/shared/components/ai-agent-control/ai-agent-badges'

function parseJsonField(value: string, fieldName: string): Record<string, unknown> | null {
  if (!value.trim()) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON object`)
    }
    return parsed as Record<string, unknown>
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON'
    throw new Error(`${fieldName}: ${message}`)
  }
}

export default function AdminAIAgentVersionEditorPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.agentId as string
  const versionId = params.versionId as string

  const { version, models, loading, refetch: refetchVersion } = useAiAgentVersion(agentId, versionId)
  const [saving, setSaving] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [modelId, setModelId] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [developerPrompt, setDeveloperPrompt] = useState('')
  const [userPromptTemplate, setUserPromptTemplate] = useState('')
  const [parametersJson, setParametersJson] = useState('')
  const [outputSchemaJson, setOutputSchemaJson] = useState('')

  const isEditable =
    version?.status === 'draft' || version?.status === 'testing'

  const selectedModel = useMemo(
    () => models.find((m) => m.id === modelId) ?? version?.model ?? null,
    [models, modelId, version?.model],
  )

  useEffect(() => {
    if (!FEATURES.aiAdminAgents) {
      router.replace(ROUTES.admin.templates)
    }
  }, [router])

  useEffect(() => {
    if (!version) return
    setModelId(version.modelId ?? '')
    setSystemPrompt(version.systemPrompt ?? '')
    setDeveloperPrompt(version.developerPrompt ?? '')
    setUserPromptTemplate(version.userPromptTemplate ?? '')
    setParametersJson(
      version.parametersJson
        ? JSON.stringify(version.parametersJson, null, 2)
        : '',
    )
    setOutputSchemaJson(
      version.outputSchemaJson
        ? JSON.stringify(version.outputSchemaJson, null, 2)
        : '',
    )
  }, [version])

  const handleSave = async () => {
    if (!isEditable) return
    setSaving(true)
    try {
      const parameters = parseJsonField(parametersJson, 'parameters_json')
      const outputSchema = parseJsonField(outputSchemaJson, 'output_schema_json')
      await aiAgentService.updateAgentVersion(agentId, versionId, {
        model_id: modelId || null,
        system_prompt: systemPrompt || null,
        developer_prompt: developerPrompt || null,
        user_prompt_template: userPromptTemplate || null,
        parameters_json: parameters,
        output_schema_json: outputSchema,
      })
      await refetchVersion()
      toast.success('Version saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await aiAgentService.publishAgentVersion(agentId, versionId)
      toast.success('Version published')
      router.push(ROUTES.admin.aiAgent(agentId))
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setPublishing(false)
    }
  }

  if (!FEATURES.aiAdminAgents) return null

  if (loading || !version) {
    return (
      <div className="mx-auto max-w-4xl">
        <ContentLoader />
      </div>
    )
  }

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: `${m.displayName ?? m.modelName} (${m.provider}, ${m.modelTier})`,
  }))

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={ROUTES.admin.aiAgent(agentId)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={16} />
        Back to agent
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Typography as="h1" size="xl" weight="bold">
              Version v{version.versionNumber}
            </Typography>
            <AIAgentVersionStatusBadge status={version.status} />
          </div>
          {!isEditable ? (
            <Typography variant="small" tone="muted">
              Read-only — published and archived versions cannot be edited.
            </Typography>
          ) : null}
        </div>
        <div className="flex gap-2">
          {isEditable ? (
            <>
              <Button variant="outline" size="md" onClick={handleSave} disabled={saving}>
                Save draft
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-neutral-900"
                onClick={() => setPublishOpen(true)}
              >
                Publish
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Model</label>
          <Select
            options={modelOptions}
            value={modelId}
            onValueChange={setModelId}
            disabled={!isEditable}
            className="w-full max-w-lg"
            size="sm"
          />
          {selectedModel ? (
            <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
              <Typography variant="small">
                {selectedModel.provider} / {selectedModel.modelName} · {selectedModel.modelTier}
              </Typography>
              <Typography variant="xs" tone="muted" className="mt-1">
                JSON: {selectedModel.supportsJson ? 'yes' : 'no'} · Streaming:{' '}
                {selectedModel.supportsStreaming ? 'yes' : 'no'} · Vision:{' '}
                {selectedModel.supportsVision ? 'yes' : 'no'}
              </Typography>
              {!selectedModel.active ? (
                <Typography variant="xs" className="mt-2 text-amber-700">
                  Warning: selected model is inactive.
                </Typography>
              ) : null}
              {!selectedModel.pricing ? (
                <Typography variant="xs" className="mt-2 text-amber-700">
                  Pricing not configured for this model. Cost estimates will be unavailable.
                </Typography>
              ) : (
                <Typography variant="xs" tone="muted" className="mt-2">
                  Pricing: {formatEstimatedCost(
                    selectedModel.pricing.inputPricePer1kTokens,
                    selectedModel.pricing.currency,
                  )}{' '}
                  / 1k input ·{' '}
                  {formatEstimatedCost(
                    selectedModel.pricing.outputPricePer1kTokens,
                    selectedModel.pricing.currency,
                  )}{' '}
                  / 1k output
                </Typography>
              )}
            </div>
          ) : null}
        </div>

        {[
          { label: 'System prompt', value: systemPrompt, setter: setSystemPrompt },
          { label: 'Developer prompt', value: developerPrompt, setter: setDeveloperPrompt },
          { label: 'User prompt template', value: userPromptTemplate, setter: setUserPromptTemplate },
        ].map((field) => (
          <div key={field.label}>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {field.label}
            </label>
            <Textarea
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              disabled={!isEditable}
              rows={6}
              className="font-mono text-sm"
            />
            <Typography variant="xs" tone="muted" className="mt-1">
              {field.value.length} characters
            </Typography>
          </div>
        ))}

        {[
          { label: 'parameters_json', value: parametersJson, setter: setParametersJson },
          { label: 'output_schema_json', value: outputSchemaJson, setter: setOutputSchemaJson },
        ].map((field) => (
          <div key={field.label}>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {field.label}
            </label>
            <Textarea
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              disabled={!isEditable}
              rows={8}
              className="font-mono text-sm"
              placeholder="{}"
            />
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish agent version"
        message="Publishing this version will make it active for future AI runs using this agent."
        confirmLabel="Publish"
        onConfirm={handlePublish}
        loading={publishing}
      />
    </div>
  )
}
