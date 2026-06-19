'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Typography, Button, Input, Textarea, Select, Switch } from '@/shared/ui'
import { adminAiApi } from '@/modules/admin'
import {
  getProblemToastMessage,
  getProblemRequestId,
  getFieldErrors,
} from '@/shared/lib/errorHandling'
import type { AiConfigUpdateRequest, AiPurpose, AiEngineType } from '@/modules/admin'
import { FEATURES } from '@/config/features'
import { useAdminAiConfigs } from '@/modules/admin'

const VALID_AGENT_ENTRIES = ['qgen_v2', 'improve_answer', 'clarity_assess_one', 'impact_analysis']

export function AdminAiConfigEditView() {
  const router = useRouter()
  const params = useParams()
  const purpose = params.purpose as AiPurpose

  const { configs, loading: isLoading } = useAdminAiConfigs()
  const config = configs.find((c) => c.purpose === purpose) ?? null
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<AiConfigUpdateRequest>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!FEATURES.aiAdminConfig) {
      router.replace('/admin/templates')
    }
  }, [router])

  useEffect(() => {
    if (!config) return
    setFormData({
      enabled: config.enabled,
      primary_engine: config.primary_engine,
      fallback_engine: config.fallback_engine,
      workflow_id: config.workflow_id,
      agent_entry: config.agent_entry,
      model: config.model,
      temperature: config.temperature,
      max_output_tokens: config.max_output_tokens,
      timeout_ms: config.timeout_ms,
      notes: config.notes,
    })
  }, [config])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (formData.primary_engine === 'workflow_api' && !formData.workflow_id?.trim()) {
      errors.workflow_id = 'Workflow ID is required when using Workflow API engine'
    }

    if (formData.primary_engine === 'agents_sdk') {
      if (!formData.agent_entry?.trim()) {
        errors.agent_entry = 'Agent Entry is required when using Agents SDK engine'
      } else if (!VALID_AGENT_ENTRIES.includes(formData.agent_entry)) {
        errors.agent_entry = `Must be one of: ${VALID_AGENT_ENTRIES.join(', ')}`
      }
    }

    if (formData.temperature !== null && formData.temperature !== undefined) {
      const temp = Number(formData.temperature)
      if (isNaN(temp) || temp < 0 || temp > 1) {
        errors.temperature = 'Temperature must be between 0 and 1'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors')
      return
    }

    setIsSaving(true)
    try {
      await adminAiApi.updateAiConfig(purpose, formData)
      toast.success('Config updated successfully')
      router.push('/admin/ai')
    } catch (err) {
      const message = getProblemToastMessage(err)
      const requestId = getProblemRequestId(err)
      const errors = getFieldErrors(err)
      setFieldErrors(errors)
      toast.error(message, {
        description: requestId ? `Request ID: ${requestId}` : undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const PURPOSE_LABELS: Record<string, string> = {
    improve_answer: 'Improve Answer',
    qgen_clarifying_questions: 'Generate Clarifying Questions',
    clarity_assess_one: 'Clarity Assessment',
    impact_analysis: 'Impact Analysis',
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Typography variant="2xl" className="mb-6 font-semibold">
          Edit AI Configuration
        </Typography>
        <div className="text-center">
          <Typography variant="base" className="text-neutral-500">
            Loading...
          </Typography>
        </div>
      </div>
    )
  }

  if (!FEATURES.aiAdminConfig || !config) {
    return null
  }

  return (
    <div className="container mx-auto max-w-3xl p-8">
      <div className="mb-6">
        <Typography variant="2xl" className="mb-2 font-semibold">
          Edit AI Configuration
        </Typography>
        <Typography variant="lg" className="text-neutral-600">
          {PURPOSE_LABELS[purpose] || purpose}
        </Typography>
      </div>

      <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6">
        {/* Enabled */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="sm" className="font-semibold text-neutral-700">
                Enabled
              </Typography>
              <Typography variant="xs" className="text-neutral-500">
                Enable or disable this AI purpose
              </Typography>
            </div>
            <Switch
              checked={formData.enabled ?? true}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            />
          </div>
        </div>

        {/* Primary Engine */}
        <div>
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Primary Engine *
          </Typography>
          <Select
            value={formData.primary_engine || config.primary_engine}
            onValueChange={(v: string) =>
              setFormData({ ...formData, primary_engine: v as AiEngineType })
            }
            options={[
              { value: 'legacy_chat', label: 'Legacy Chat (OpenAI Chat Completions)' },
              { value: 'workflow_api', label: 'Workflow API (Agent Builder)' },
              { value: 'agents_sdk', label: 'Agents SDK (In-process)' },
            ]}
          />
        </div>

        {/* Fallback Engine */}
        <div>
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Fallback Engine
          </Typography>
          <Select
            value={formData.fallback_engine ?? config.fallback_engine ?? ''}
            onValueChange={(v: string) =>
              setFormData({ ...formData, fallback_engine: v ? (v as AiEngineType) : null })
            }
            options={[
              { value: '', label: 'None (No fallback)' },
              { value: 'legacy_chat', label: 'Legacy Chat' },
              { value: 'workflow_api', label: 'Workflow API' },
              { value: 'agents_sdk', label: 'Agents SDK' },
            ]}
          />
          <Typography variant="xs" className="mt-1 text-neutral-500">
            If primary engine fails, use this engine as fallback
          </Typography>
        </div>

        {/* Workflow ID (required if primary = workflow_api) */}
        {formData.primary_engine === 'workflow_api' && (
          <div>
            <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
              Workflow ID *
            </Typography>
            <Input
              value={formData.workflow_id ?? config.workflow_id ?? ''}
              onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
              placeholder="wf_abc123xyz"
            />
            {fieldErrors.workflow_id && (
              <Typography variant="xs" className="text-error-600 mt-1">
                {fieldErrors.workflow_id}
              </Typography>
            )}
            <Typography variant="xs" className="mt-1 text-neutral-500">
              OpenAI Agent Builder workflow ID
            </Typography>
          </div>
        )}

        {/* Agent Entry (required if primary = agents_sdk) */}
        {formData.primary_engine === 'agents_sdk' && (
          <div>
            <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
              Agent Entry *
            </Typography>
            <Select
              value={formData.agent_entry ?? config.agent_entry ?? ''}
              onValueChange={(v: string) => setFormData({ ...formData, agent_entry: v })}
              options={[
                { value: '', label: 'Select agent...' },
                { value: 'qgen_v2', label: 'qgen_v2 (Question Generation v2)' },
                { value: 'improve_answer', label: 'improve_answer (Answer Improvement)' },
                { value: 'clarity_assess_one', label: 'clarity_assess_one (Clarity Assessment)' },
                { value: 'impact_analysis', label: 'impact_analysis (Impact Analysis)' },
              ]}
            />
            {fieldErrors.agent_entry && (
              <Typography variant="xs" className="text-error-600 mt-1">
                {fieldErrors.agent_entry}
              </Typography>
            )}
            <Typography variant="xs" className="mt-1 text-neutral-500">
              Agent runner key in the registry
            </Typography>
          </div>
        )}

        {/* Model */}
        <div>
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Model (Optional)
          </Typography>
          <Input
            value={formData.model ?? config.model ?? ''}
            onChange={(e) => setFormData({ ...formData, model: e.target.value || null })}
            placeholder="e.g., gpt-4o, gpt-3.5-turbo"
          />
          <Typography variant="xs" className="mt-1 text-neutral-500">
            Override default model. Leave empty to use ENV default.
          </Typography>
        </div>

        {/* Temperature */}
        <div>
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Temperature (Optional)
          </Typography>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={formData.temperature ?? config.temperature ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                temperature: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="0.0 - 1.0"
          />
          {fieldErrors.temperature && (
            <Typography variant="xs" className="text-error-600 mt-1">
              {fieldErrors.temperature}
            </Typography>
          )}
          <Typography variant="xs" className="mt-1 text-neutral-500">
            Sampling temperature (0 = deterministic, 1 = creative)
          </Typography>
        </div>

        {/* Max Output Tokens */}
        <div>
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Max Output Tokens (Optional)
          </Typography>
          <Input
            type="number"
            step="1"
            min="1"
            value={formData.max_output_tokens ?? config.max_output_tokens ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                max_output_tokens: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="e.g., 4000"
          />
          <Typography variant="xs" className="mt-1 text-neutral-500">
            Maximum tokens in AI output
          </Typography>
        </div>

        {/* Timeout */}
        <div>
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Timeout (ms) (Optional)
          </Typography>
          <Input
            type="number"
            step="1000"
            min="1000"
            value={formData.timeout_ms ?? config.timeout_ms ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                timeout_ms: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="e.g., 30000"
          />
          <Typography variant="xs" className="mt-1 text-neutral-500">
            Request timeout in milliseconds
          </Typography>
        </div>

        {/* Notes */}
        <div>
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Notes (Optional)
          </Typography>
          <Textarea
            value={formData.notes ?? config.notes ?? ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            placeholder="Internal notes about this configuration..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
          <Button variant="outline" onClick={() => router.push('/admin/ai')}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 rounded-lg bg-neutral-50 p-4">
        <Typography variant="xs" className="text-neutral-500">
          Last updated: {new Date(config.updated_at).toLocaleString()}
          {config.updated_by && ` by user ${config.updated_by}`}
        </Typography>
      </div>
    </div>
  )
}
