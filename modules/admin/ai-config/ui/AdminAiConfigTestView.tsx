'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Typography, Button, Textarea, Switch, Badge } from '@/shared/ui'
import { testRunAiConfig } from '@/modules/admin'
import { getProblemToastMessage, getProblemRequestId } from '@/shared/lib/errorHandling'
import type { AiPurpose, AiTestRunResponse } from '@/modules/admin'
import { FEATURES } from '@/config/features'
import { useEffect } from 'react'

const EXAMPLE_INPUTS: Record<string, string> = {
  improve_answer: JSON.stringify(
    {
      question_id: '00000000-0000-0000-0000-000000000001',
      current_value: 'Original answer text here',
      question: {
        id: '00000000-0000-0000-0000-000000000001',
        prompt: 'What is the main goal of the project?',
        section: 'overview',
        q_type: 'textarea',
        required: true,
        answer_schema: { type: 'string' },
      },
    },
    null,
    2
  ),
  qgen_clarifying_questions: JSON.stringify(
    {
      base_session_id: '00000000-0000-0000-0000-000000000002',
      instruction: 'Focus on technical risks and integration points',
      max_items: 20,
    },
    null,
    2
  ),
  clarity_assess_one: JSON.stringify(
    {
      question_order: 5,
      section: 'scope',
      question_text: 'What are the key functional requirements?',
      answer_text: 'User authentication, data export, reporting dashboard.',
      q_type: 'textarea',
      required: true,
    },
    null,
    2
  ),
  impact_analysis: JSON.stringify(
    {
      note_text: 'New requirement: Add 2FA authentication for all users.',
      baseline_answers: [],
      questions: [],
      project_id: '00000000-0000-0000-0000-000000000003',
      base: { session_id: '00000000-0000-0000-0000-000000000004' },
      intake_id: '00000000-0000-0000-0000-000000000005',
    },
    null,
    2
  ),
}

export function AdminAiConfigTestView() {
  const router = useRouter()
  const params = useParams()
  const purpose = params.purpose as AiPurpose

  const [inputJson, setInputJson] = useState(EXAMPLE_INPUTS[purpose] || '{}')
  const [useFallback, setUseFallback] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<AiTestRunResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!FEATURES.aiAdminConfig) router.replace('/admin/templates')
  }, [router])

  const handleTestRun = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      // Parse input JSON
      let input: unknown
      try {
        input = JSON.parse(inputJson)
      } catch (e) {
        toast.error('Invalid JSON input')
        setIsRunning(false)
        return
      }

      const response = await testRunAiConfig(purpose, {
        input,
        use_fallback: useFallback,
      })

      setResult(response)
      toast.success('Test run completed successfully')
    } catch (err) {
      const message = getProblemToastMessage(err)
      const requestId = getProblemRequestId(err)
      setError(message + (requestId ? `\nRequest ID: ${requestId}` : ''))
      toast.error(message, {
        description: requestId ? `Request ID: ${requestId}` : undefined,
      })
    } finally {
      setIsRunning(false)
    }
  }

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

  if (!FEATURES.aiAdminConfig) return null

  return (
    <div className="container mx-auto max-w-5xl p-8">
      <div className="mb-6">
        <Typography variant="2xl" className="mb-2 font-semibold">
          Test Run: {PURPOSE_LABELS[purpose] || purpose}
        </Typography>
        <Typography variant="sm" className="text-neutral-600">
          Test this AI configuration without side effects (no batch token, no DB writes)
        </Typography>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <Typography variant="lg" className="mb-4 font-semibold">
              Input JSON
            </Typography>

            <Textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              rows={20}
              className="font-mono text-xs"
              placeholder="Enter test input JSON..."
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Typography variant="sm" className="text-neutral-700">
                  Use Fallback
                </Typography>
                <Switch checked={useFallback} onChange={(e) => setUseFallback(e.target.checked)} />
              </div>
              <Button onClick={handleTestRun} isLoading={isRunning}>
                Run Test
              </Button>
            </div>

            <div className="mt-4 rounded-md bg-blue-50 p-3">
              <Typography variant="xs" className="text-blue-900">
                <strong>Note:</strong> Test runs do not create batch tokens or write to domain
                tables. They only log to ai_orchestrator_runs for audit purposes.
              </Typography>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {/* Result */}
          {result && (
            <div className="border-success-200 bg-success-50 rounded-lg border p-6">
              <div className="mb-4 flex items-center justify-between">
                <Typography variant="lg" className="text-success-900 font-semibold">
                  Test Run Succeeded
                </Typography>
                <Badge variant="success">Success</Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Typography
                    variant="xs"
                    className="text-success-700 mb-1 font-semibold uppercase"
                  >
                    Engine Used
                  </Typography>
                  <Badge variant="neutral">
                    {ENGINE_LABELS[result.engine_used] || result.engine_used}
                  </Badge>
                </div>

                <div>
                  <Typography
                    variant="xs"
                    className="text-success-700 mb-1 font-semibold uppercase"
                  >
                    Run ID
                  </Typography>
                  <Typography variant="xs" className="text-success-900 font-mono">
                    {result.run_id}
                  </Typography>
                </div>

                <div>
                  <Typography
                    variant="xs"
                    className="text-success-700 mb-2 font-semibold uppercase"
                  >
                    Output
                  </Typography>
                  <div className="max-h-96 overflow-auto rounded-md bg-white p-3">
                    <pre className="text-xs text-neutral-800">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/ai/runs/${result.run_id}`)}
                >
                  View Run Details
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-error-200 bg-error-50 rounded-lg border p-6">
              <div className="mb-4 flex items-center justify-between">
                <Typography variant="lg" className="text-error-900 font-semibold">
                  Test Run Failed
                </Typography>
                <Badge variant="error">Failed</Badge>
              </div>

              <div className="rounded-md bg-white p-3">
                <pre className="text-error-900 whitespace-pre-wrap text-sm">{error}</pre>
              </div>
            </div>
          )}

          {/* Placeholder */}
          {!result && !error && (
            <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
              <Typography variant="base" className="text-neutral-600">
                Click &quot;Run Test&quot; to execute the AI orchestrator with your input
              </Typography>
            </div>
          )}

          {/* Example Input Info */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
              Expected Input Fields
            </Typography>
            <Typography variant="xs" className="text-neutral-600">
              {purpose === 'improve_answer' &&
                'question_id (UUID), current_value (any), question (object with id, prompt, section, q_type, required, answer_schema)'}
              {purpose === 'qgen_clarifying_questions' &&
                'base_session_id (UUID), instruction (optional string), max_items (optional number)'}
              {purpose === 'clarity_assess_one' &&
                'question_order (number), section (string), question_text (string), answer_text (string), q_type (string), required (boolean)'}
              {purpose === 'impact_analysis' &&
                'note_text (string), baseline_answers (array), questions (array), project_id (UUID), base (object with session_id), intake_id (UUID)'}
            </Typography>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6 flex justify-start">
        <Button variant="outline" onClick={() => router.push('/admin/ai')}>
          Back to Configs
        </Button>
      </div>
    </div>
  )
}
