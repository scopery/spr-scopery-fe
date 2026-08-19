import { describe, expect, it } from 'vitest'
import { AI_AGENT_ADMIN_ENDPOINTS } from '@/modules/ai-agent-admin'
import { AI_ASSISTANT_ENDPOINTS } from '@/modules/ai-assistant'
import { WAVE5_AI_PERMISSIONS } from '@/modules/ai-assistant'
import { resolveMessageStreamUrl } from './ai-assistant.api'

describe('Wave 5 endpoint scaffolding (W5-A)', () => {
  it('AI Assistant paths stay under /api/v1/ai-assistant', () => {
    expect(AI_ASSISTANT_ENDPOINTS.conversations()).toContain('/api/v1/ai-assistant/conversations')
    expect(AI_ASSISTANT_ENDPOINTS.messageStream('m1')).toContain(
      '/api/v1/ai-assistant/messages/m1/stream'
    )
    expect(AI_ASSISTANT_ENDPOINTS.explainField()).toContain('/guides/explain-field')
    expect(AI_ASSISTANT_ENDPOINTS.explainDisabledAction()).toContain(
      '/guides/explain-disabled-action'
    )
  })

  it('AI Agent Admin paths stay under /api/ai-agent (not /api/v1)', () => {
    expect(AI_AGENT_ADMIN_ENDPOINTS.providers()).toMatch(/\/api\/ai-agent\/providers$/)
    expect(AI_AGENT_ADMIN_ENDPOINTS.providers()).not.toContain('/api/v1/ai-agent')
    expect(AI_AGENT_ADMIN_ENDPOINTS.executionLog('e1')).toContain('/ai-agent/execution-logs/e1')
    expect(AI_AGENT_ADMIN_ENDPOINTS.playgroundOptions()).toContain('/ai-agent/playground/options')
  })

  it('never uses the BE stream host from streamUrl', () => {
    expect(
      resolveMessageStreamUrl({
        streamUrl: 'https://136-85-104-51.sslip.io/api/v1/ai-assistant/messages/abc/stream',
        assistantMessageId: 'abc',
      })
    ).toBe(AI_ASSISTANT_ENDPOINTS.messageStream('abc'))
    expect(resolveMessageStreamUrl({
      streamUrl: 'https://136-85-104-51.sslip.io/api/v1/ai-assistant/messages/abc/stream',
    })).toBe(AI_ASSISTANT_ENDPOINTS.messageStream('abc'))
    expect(AI_ASSISTANT_ENDPOINTS.messageStream('abc')).not.toContain('sslip.io')
  })

  it('locks provisional Wave 5 permission catalog size', () => {
    expect(Object.keys(WAVE5_AI_PERMISSIONS)).toHaveLength(11)
  })
})
