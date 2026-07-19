import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXECUTION_LOG_SERVICE_ONLY_PATHS } from './executions/domain/messages/service-orchestrated.messages'
import { AI_AGENT_ADMIN_ENDPOINTS } from './infrastructure/api/endpoints'

describe('Wave 5 security locks', () => {
  it('documents all five service-orchestrated execution-log transitions', () => {
    expect(EXECUTION_LOG_SERVICE_ONLY_PATHS).toHaveLength(5)
    expect(EXECUTION_LOG_SERVICE_ONLY_PATHS.join('\n')).toContain('/running')
    expect(EXECUTION_LOG_SERVICE_ONLY_PATHS.join('\n')).toContain('/cancel')
  })

  it('does not export service-only execution-log mutations on AI_AGENT_ADMIN_ENDPOINTS', () => {
    const keys = Object.keys(AI_AGENT_ADMIN_ENDPOINTS)
    expect(keys).toContain('executionLogs')
    expect(keys).toContain('executionLog')
    expect(keys).not.toContain('createExecutionLog')
    expect(keys).not.toContain('markExecutionRunning')
    expect(keys).not.toContain('markExecutionSucceeded')
    expect(keys).not.toContain('markExecutionFailed')
    expect(keys).not.toContain('cancelExecutionLog')

    const src = readFileSync(
      join(process.cwd(), 'modules/ai-agent-admin/infrastructure/api/endpoints.ts'),
      'utf8'
    )
    for (const suffix of ['/running', '/succeeded', '/failed', '/cancel']) {
      expect(src).not.toContain(`execution-logs/\${id}${suffix}`)
    }
  })

  it('keeps AI Agent base path at /ai-agent (not /v1/ai-agent)', () => {
    expect(AI_AGENT_ADMIN_ENDPOINTS.providers()).toContain('/api/ai-agent/providers')
    expect(AI_AGENT_ADMIN_ENDPOINTS.providers()).not.toContain('/api/v1/ai-agent')
  })
})
