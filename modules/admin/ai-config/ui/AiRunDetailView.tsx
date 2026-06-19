'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Typography, Button, Badge } from '@/shared/ui'
import { FEATURES } from '@/config/features'
import { useAiRunDetail } from '@/modules/admin'

export function AiRunDetailView() {
  const router = useRouter()
  const params = useParams()
  const runId = params.runId as string

  const { run, loading: isLoading } = useAiRunDetail(runId)
  const [showPayload, setShowPayload] = useState(false)
  const [showOutput, setShowOutput] = useState(false)

  useEffect(() => {
    if (!FEATURES.aiAdminConfig) {
      router.replace('/admin/templates')
    }
  }, [router])

  const PURPOSE_LABELS: Record<string, string> = {
    improve_answer: 'Improve Answer',
    qgen_clarifying_questions: 'Generate Clarifying Questions',
    clarity_assess_one: 'Clarity Assessment',
    impact_analysis: 'Impact Analysis',
  }

  const ENGINE_LABELS: Record<string, string> = {
    legacy_chat: 'Legacy Chat',
    workflow_api: 'Workflow API',
    agents_sdk: 'Agents SDK',
  }

  const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
    success: 'success',
    fallback_success: 'warning',
    failed: 'error',
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Typography variant="2xl" className="mb-6 font-semibold">
          AI Run Details
        </Typography>
        <div className="text-center">
          <Typography variant="base" className="text-neutral-500">
            Loading...
          </Typography>
        </div>
      </div>
    )
  }

  if (!FEATURES.aiAdminConfig || !run) {
    return null
  }

  return (
    <div className="container mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Typography variant="2xl" className="mb-2 font-semibold">
            AI Run Details
          </Typography>
          <Typography variant="sm" className="text-neutral-600">
            Run ID: {run.id}
          </Typography>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/ai/runs')}>
          Back to Runs
        </Button>
      </div>

      <div className="space-y-6">
        {/* Status Card */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <Typography variant="lg" className="font-semibold">
              Run Status
            </Typography>
            <Badge variant={STATUS_COLORS[run.status]} size="lg">
              {run.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                Purpose
              </Typography>
              <Typography variant="sm" className="text-neutral-800">
                {PURPOSE_LABELS[run.purpose] || run.purpose}
              </Typography>
            </div>

            <div>
              <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                Engine Used
              </Typography>
              <Badge variant="neutral">{ENGINE_LABELS[run.engine_used] || run.engine_used}</Badge>
            </div>

            <div>
              <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                Latency
              </Typography>
              <Typography variant="sm" className="text-neutral-800">
                {run.latency_ms} ms
              </Typography>
            </div>

            {run.model && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  Model
                </Typography>
                <Typography variant="sm" className="text-neutral-800">
                  {run.model}
                </Typography>
              </div>
            )}

            {run.workflow_id && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  Workflow ID
                </Typography>
                <Typography variant="xs" className="font-mono text-neutral-800">
                  {run.workflow_id}
                </Typography>
              </div>
            )}

            {run.agent_entry && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  Agent Entry
                </Typography>
                <Typography variant="sm" className="text-neutral-800">
                  {run.agent_entry}
                </Typography>
              </div>
            )}

            <div>
              <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                Created At
              </Typography>
              <Typography variant="sm" className="text-neutral-800">
                {new Date(run.created_at).toLocaleString()}
              </Typography>
            </div>

            {run.request_id && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  Request ID
                </Typography>
                <Typography variant="xs" className="font-mono text-neutral-800">
                  {run.request_id}
                </Typography>
              </div>
            )}
          </div>
        </div>

        {/* Context IDs */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <Typography variant="lg" className="mb-4 font-semibold">
            Context
          </Typography>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {run.org_id && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  Organization ID
                </Typography>
                <Typography variant="xs" className="font-mono text-neutral-800">
                  {run.org_id}
                </Typography>
              </div>
            )}

            {run.project_id && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  Project ID
                </Typography>
                <Typography variant="xs" className="font-mono text-neutral-800">
                  {run.project_id}
                </Typography>
              </div>
            )}

            {run.session_id && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  Session ID
                </Typography>
                <Typography variant="xs" className="font-mono text-neutral-800">
                  {run.session_id}
                </Typography>
              </div>
            )}

            {run.user_id && (
              <div>
                <Typography variant="xs" className="mb-1 font-semibold uppercase text-neutral-500">
                  User ID
                </Typography>
                <Typography variant="xs" className="font-mono text-neutral-800">
                  {run.user_id}
                </Typography>
              </div>
            )}
          </div>
        </div>

        {/* Error Details (if failed) */}
        {run.status === 'failed' && (
          <div className="border-error-200 bg-error-50 rounded-lg border p-6">
            <Typography variant="lg" className="text-error-900 mb-4 font-semibold">
              Error Details
            </Typography>

            {run.error_code && (
              <div className="mb-3">
                <Typography variant="xs" className="text-error-700 mb-1 font-semibold uppercase">
                  Error Code
                </Typography>
                <Badge variant="error" size="lg">
                  {run.error_code}
                </Badge>
              </div>
            )}

            {run.error_detail && (
              <div>
                <Typography variant="xs" className="text-error-700 mb-1 font-semibold uppercase">
                  Error Detail
                </Typography>
                <div className="rounded-md bg-white p-3">
                  <Typography variant="sm" className="text-error-900 whitespace-pre-wrap">
                    {run.error_detail}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payload Redacted */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Typography variant="lg" className="font-semibold">
                Input Payload (Redacted)
              </Typography>
              <Typography variant="xs" className="text-neutral-500">
                Metadata only - raw answers/notes are not logged
              </Typography>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowPayload(!showPayload)}>
              {showPayload ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showPayload && (
            <div className="max-h-96 overflow-auto rounded-md bg-neutral-50 p-4">
              <pre className="text-xs text-neutral-800">
                {JSON.stringify(run.payload_redacted, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Output Redacted */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Typography variant="lg" className="font-semibold">
                Output (Redacted)
              </Typography>
              <Typography variant="xs" className="text-neutral-500">
                Truncated for security and performance
              </Typography>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowOutput(!showOutput)}>
              {showOutput ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showOutput && (
            <div className="max-h-96 overflow-auto rounded-md bg-neutral-50 p-4">
              <pre className="text-xs text-neutral-800">
                {JSON.stringify(run.output_redacted, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Fallback Warning */}
        {run.status === 'fallback_success' && (
          <div className="border-warning-200 bg-warning-50 rounded-lg border p-4">
            <Typography variant="sm" className="text-warning-900">
              <strong>Note:</strong> This run used the fallback engine because the primary engine
              failed. Consider investigating the primary engine configuration or provider issues.
            </Typography>
          </div>
        )}
      </div>
    </div>
  )
}
