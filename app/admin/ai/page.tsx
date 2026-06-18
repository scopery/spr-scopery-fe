'use client'

import { useEffect } from 'react'
import { Typography, Button, Badge } from '@/shared/ui'
import { useAdminAiConfigs } from '@/hooks/useAdminAi'
import { useRouter } from 'next/navigation'
import { FEATURES } from '@/config/features'
import { ROUTES } from '@/constants/routes'

export default function AdminAIConfigsPage() {
  const router = useRouter()
  const { configs, loading: isLoading } = useAdminAiConfigs()

  useEffect(() => {
    if (!FEATURES.aiAdminConfig) {
      router.replace(ROUTES.admin.templates)
    }
  }, [])

  const PURPOSE_LABELS: Record<string, string> = {
    improve_answer: 'Improve Answer',
    qgen_clarifying_questions: 'Generate Questions',
    clarity_assess_one: 'Clarity Assessment',
    impact_analysis: 'Impact Analysis',
  }

  const ENGINE_LABELS: Record<string, string> = {
    legacy_chat: 'Legacy Chat',
    workflow_api: 'Workflow API',
    agents_sdk: 'Agents SDK',
  }

  if (!FEATURES.aiAdminConfig) return null

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Typography variant="2xl" className="mb-6 font-semibold">
          AI Configuration
        </Typography>
        <div className="text-center">
          <Typography variant="base" className="text-neutral-500">
            Loading...
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Typography variant="2xl" className="mb-2 font-semibold">
            AI Configuration
          </Typography>
          <Typography variant="sm" className="text-neutral-600">
            Manage AI orchestration settings for each purpose
          </Typography>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/ai/runs')}
        >
          View Audit Logs
        </Button>
      </div>

      <div className="space-y-4">
        {configs.map((config) => (
          <div
            key={config.purpose}
            className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Typography variant="lg" className="font-semibold">
                    {PURPOSE_LABELS[config.purpose] || config.purpose}
                  </Typography>
                  <Badge variant={config.enabled ? 'success' : 'error'} size="sm">
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <Typography variant="sm" className="text-neutral-600">
                  Purpose: <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{config.purpose}</code>
                </Typography>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/ai/configs/${config.purpose}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/ai/configs/${config.purpose}/test`)}
                >
                  Test Run
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Primary Engine */}
              <div>
                <Typography variant="xs" className="mb-1 font-semibold text-neutral-500 uppercase">
                  Primary Engine
                </Typography>
                <Typography variant="sm" className="text-neutral-800">
                  {ENGINE_LABELS[config.primary_engine] || config.primary_engine}
                </Typography>
              </div>

              {/* Fallback Engine */}
              <div>
                <Typography variant="xs" className="mb-1 font-semibold text-neutral-500 uppercase">
                  Fallback Engine
                </Typography>
                <Typography variant="sm" className="text-neutral-800">
                  {config.fallback_engine
                    ? ENGINE_LABELS[config.fallback_engine] || config.fallback_engine
                    : 'None'}
                </Typography>
              </div>

              {/* Model */}
              <div>
                <Typography variant="xs" className="mb-1 font-semibold text-neutral-500 uppercase">
                  Model
                </Typography>
                <Typography variant="sm" className="text-neutral-800">
                  {config.model || 'Default'}
                </Typography>
              </div>

              {/* Workflow ID */}
              {config.workflow_id && (
                <div>
                  <Typography variant="xs" className="mb-1 font-semibold text-neutral-500 uppercase">
                    Workflow ID
                  </Typography>
                  <Typography variant="xs" className="font-mono text-neutral-800">
                    {config.workflow_id}
                  </Typography>
                </div>
              )}

              {/* Agent Entry */}
              {config.agent_entry && (
                <div>
                  <Typography variant="xs" className="mb-1 font-semibold text-neutral-500 uppercase">
                    Agent Entry
                  </Typography>
                  <Typography variant="sm" className="text-neutral-800">
                    {config.agent_entry}
                  </Typography>
                </div>
              )}

              {/* Timeout */}
              {config.timeout_ms && (
                <div>
                  <Typography variant="xs" className="mb-1 font-semibold text-neutral-500 uppercase">
                    Timeout
                  </Typography>
                  <Typography variant="sm" className="text-neutral-800">
                    {config.timeout_ms / 1000}s
                  </Typography>
                </div>
              )}
            </div>

            {/* Notes */}
            {config.notes && (
              <div className="mt-4 rounded-md bg-neutral-50 p-3">
                <Typography variant="xs" className="mb-1 font-semibold text-neutral-700">
                  Notes:
                </Typography>
                <Typography variant="xs" className="text-neutral-600">
                  {config.notes}
                </Typography>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
              <Typography variant="xs" className="text-neutral-400">
                Schema v{config.schema_version}
              </Typography>
              <Typography variant="xs" className="text-neutral-400">
                Updated: {new Date(config.updated_at).toLocaleString()}
              </Typography>
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <Typography variant="base" className="text-neutral-600">
            No AI configurations found
          </Typography>
        </div>
      )}
    </div>
  )
}
