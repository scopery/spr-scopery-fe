'use client'

import { Typography, Button, ContentLoader, Select, Textarea, ConfirmDialog } from '@/shared/ui'
import {
  AIAgentVersionStatusBadge,
  formatEstimatedCost,
  formatTokens,
} from '@/modules/admin/ai-agents/ui/ai-agent-badges'
import { AIRunFeedbackControls } from '@/modules/admin/ai-feedback/ui/ai-run-feedback-controls'
import type { AIRunMode } from '@/modules/admin/ai-agents'
import { useAIAgentPlaygroundPanel } from '../hooks/useAIAgentPlaygroundPanel'

const MODE_OPTIONS: { value: AIRunMode; label: string }[] = [
  { value: 'generate', label: 'Generate' },
  { value: 'improve', label: 'Improve' },
  { value: 'assess', label: 'Assess' },
  { value: 'summarize', label: 'Summarize' },
  { value: 'extract', label: 'Extract' },
  { value: 'classify', label: 'Classify' },
  { value: 'compare', label: 'Compare' },
  { value: 'recommend', label: 'Recommend' },
  { value: 'validate', label: 'Validate' },
]

interface AIAgentPlaygroundPanelProps {
  agentId: string
  orgId?: string
}

export function AIAgentPlaygroundPanel({ agentId, orgId }: AIAgentPlaygroundPanelProps) {
  const panel = useAIAgentPlaygroundPanel({ agentId, orgId })

  if (panel.loading || !panel.context) return <ContentLoader />

  const versionOptions = panel.testableVersions.map((version) => ({
    value: version.versionId,
    label: `v${version.versionNumber} (${version.status})`,
  }))

  return (
    <div className="space-y-6">
      <Typography variant="small" tone="muted">
        Dry run validates prompt rendering without calling the AI provider. Run test will call the
        AI provider and may consume budget. Testing a draft version does not publish it. Output is
        not saved to production data.
      </Typography>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
          <Typography weight="medium">Configuration</Typography>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Version</label>
            <Select
              options={versionOptions}
              value={panel.versionId}
              onValueChange={panel.setVersionId}
              className="w-full"
              size="sm"
            />
            {panel.selectedVersion ? (
              <div className="mt-2 flex items-center gap-2">
                <AIAgentVersionStatusBadge status={panel.selectedVersion.status} />
                {panel.selectedVersion.status !== 'published' ? (
                  <Typography variant="xs" className="text-amber-700">
                    Draft/testing — not used in production until published
                  </Typography>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Mode</label>
            <Select
              options={MODE_OPTIONS}
              value={panel.mode}
              onValueChange={(value: string) => panel.setMode(value as AIRunMode)}
              className="w-full"
              size="sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={panel.skipRouting}
              onChange={(event) => panel.setSkipRouting(event.target.checked)}
            />
            Bypass routing (test version model only)
          </label>

          {panel.versionDetail ? (
            <div className="rounded-md border border-neutral-100 bg-neutral-50 p-3 text-sm">
              <Typography variant="small" weight="medium" className="mb-1">
                Prompt preview
              </Typography>
              <Typography variant="xs" tone="muted">
                System: {panel.versionDetail.systemPrompt ? 'configured' : 'none'} · Developer:{' '}
                {panel.versionDetail.developerPrompt ? 'configured' : 'none'} · User template:{' '}
                {panel.versionDetail.userPromptTemplate
                  ? `${panel.versionDetail.userPromptTemplate.length} chars`
                  : 'default'}
              </Typography>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
          <Typography weight="medium">Test input</Typography>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Test input (JSON object or plain text wrapped as object)
            </label>
            <Textarea
              value={panel.testInput}
              onChange={(event) => panel.setTestInput(event.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Prompt variables (JSON object)
            </label>
            <Textarea
              value={panel.promptVariables}
              onChange={(event) => panel.setPromptVariables(event.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          <Typography variant="xs" tone="muted">
            Avoid pasting sensitive production data. Test input is not stored by default.
          </Typography>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void panel.handleDryRun()} disabled={panel.dryRunning}>
          {panel.dryRunning ? 'Dry running…' : 'Dry run'}
        </Button>
        <Button
          size="sm"
          onClick={panel.requestRunTest}
          disabled={panel.running || panel.dryRunResult?.success === false}
        >
          {panel.running ? 'Running test…' : 'Run test'}
        </Button>
      </div>

      {panel.dryRunResult ? (
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <Typography weight="medium">Dry-run result</Typography>
          <p>User message length: {panel.dryRunResult.renderedPromptSummary.userMessageLength}</p>
          <p>
            Variables: {panel.dryRunResult.renderedPromptSummary.variableKeys.join(', ') || 'none'}
          </p>
          <p>
            Model: {panel.dryRunResult.routingDecision.selectedModelName}
            {panel.dryRunResult.routingDecision.routingApplied ? ' (routing applied)' : ''}
          </p>
          <p>{panel.dryRunResult.routingDecision.routingReason}</p>
          <p>
            Estimated tokens: {formatTokens(panel.dryRunResult.estimatedUsage.estimatedTotalTokens)}
            {panel.dryRunResult.estimatedUsage.estimatedCost != null
              ? ` · ~${formatEstimatedCost(panel.dryRunResult.estimatedUsage.estimatedCost, panel.dryRunResult.estimatedUsage.currency)}`
              : ' · cost estimate unavailable'}
          </p>
          {panel.dryRunResult.validationErrors.length > 0 ? (
            <div className="text-red-700">
              {panel.dryRunResult.validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
          {panel.dryRunResult.warnings.map((warning) => (
            <p key={warning} className="text-amber-700">
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      {panel.testResult ? (
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <Typography weight="medium">Test result</Typography>
          {!panel.testResult.success ? (
            <p className="text-red-700">{panel.testResult.error?.message ?? 'Test failed'}</p>
          ) : (
            <>
              {panel.testResult.runId ? <p>Run ID: {panel.testResult.runId}</p> : null}
              {panel.testResult.modelName ? (
                <p>
                  Model: {panel.testResult.provider}/{panel.testResult.modelName}
                </p>
              ) : null}
              {panel.testResult.usage ? (
                <p>
                  Tokens: {formatTokens(panel.testResult.usage.totalTokens)} (in{' '}
                  {formatTokens(panel.testResult.usage.inputTokens)} / out{' '}
                  {formatTokens(panel.testResult.usage.outputTokens)})
                </p>
              ) : null}
              {panel.testResult.estimatedCost != null ? (
                <p>
                  Cost:{' '}
                  {formatEstimatedCost(panel.testResult.estimatedCost, panel.testResult.currency ?? 'USD')}
                </p>
              ) : null}
              {panel.testResult.latencyMs != null ? <p>Latency: {panel.testResult.latencyMs}ms</p> : null}
              {panel.testResult.outputValidation ? (
                <p
                  className={
                    panel.testResult.outputValidation.valid ? 'text-green-700' : 'text-amber-700'
                  }
                >
                  Output validation:{' '}
                  {!panel.testResult.outputValidation.schemaConfigured
                    ? 'No output schema configured'
                    : panel.testResult.outputValidation.valid
                      ? 'Passed'
                      : panel.testResult.outputValidation.errors.join('; ')}
                </p>
              ) : null}
              {panel.testResult.output != null ? (
                <pre className="max-h-96 overflow-auto rounded-md bg-neutral-50 p-3 text-xs">
                  {typeof panel.testResult.output === 'string'
                    ? panel.testResult.output
                    : JSON.stringify(panel.testResult.output, null, 2)}
                </pre>
              ) : null}
              {panel.testResult.runId && orgId ? (
                <AIRunFeedbackControls orgId={orgId} runId={panel.testResult.runId} compact />
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <ConfirmDialog
        open={panel.confirmRunOpen}
        onClose={() => panel.setConfirmRunOpen(false)}
        title="Run prompt test?"
        message="This will call the AI provider and may consume budget. Estimated cost is higher than usual for this test."
        confirmLabel="Run test"
        onConfirm={() => void panel.handleRunTest()}
      />
    </div>
  )
}
