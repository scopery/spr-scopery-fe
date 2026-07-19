/**
 * Service-orchestrated execution-log transition endpoints (#80–84).
 * Intentionally NOT exported on AI_AGENT_ADMIN_ENDPOINTS and MUST NEVER be called from the browser.
 *
 * - POST   /api/ai-agent/execution-logs
 * - PATCH  /api/ai-agent/execution-logs/{id}/running
 * - PATCH  /api/ai-agent/execution-logs/{id}/succeeded
 * - PATCH  /api/ai-agent/execution-logs/{id}/failed
 * - PATCH  /api/ai-agent/execution-logs/{id}/cancel
 *
 * FE coverage: SERVICE_ORCHESTRATED — evidence from worker/integration tests (W5-GAP-06/07).
 */
export const EXECUTION_LOG_SERVICE_ONLY_PATHS = [
  'POST /api/ai-agent/execution-logs',
  'PATCH /api/ai-agent/execution-logs/{id}/running',
  'PATCH /api/ai-agent/execution-logs/{id}/succeeded',
  'PATCH /api/ai-agent/execution-logs/{id}/failed',
  'PATCH /api/ai-agent/execution-logs/{id}/cancel',
] as const
