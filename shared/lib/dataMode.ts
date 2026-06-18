/**
 * Data mode configuration.
 *
 * When NEXT_PUBLIC_DATA_MODE=mock the app operates entirely on mock data:
 *   - apiClient intercepts every request and returns mock fixtures
 *   - No real network calls are made
 *   - Auth is satisfied by a mock session cookie written at boot
 *
 * Switch between modes by setting the env var in .env:
 *   NEXT_PUBLIC_DATA_MODE=mock    → mock mode (no backend needed)
 *   NEXT_PUBLIC_DATA_MODE=        → live mode (default)
 */
export const isMockMode =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DATA_MODE === 'mock'

/** Artificial network latency in ms to make mock responses feel realistic. */
export const MOCK_DELAY_MS = 120

export const MOCK_USER_ID = 'mock-user-001'
export const MOCK_ORG_ID = 'mock-org-001'
export const MOCK_PROJECT_ID_1 = 'mock-project-001'
export const MOCK_PROJECT_ID_2 = 'mock-project-002'
export const MOCK_SESSION_ID = 'mock-session-001'
export const MOCK_DOCUMENT_ID_1 = 'mock-doc-001'
export const MOCK_DOCUMENT_ID_2 = 'mock-doc-002'
export const MOCK_POLICY_ID = 'mock-policy-001'
export const MOCK_TEMPLATE_ID = 'mock-template-001'
export const MOCK_AGENT_ID = 'mock-agent-001'
