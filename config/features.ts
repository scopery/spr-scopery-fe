/**
 * Central feature flags for the simplified MVP.
 * In mock mode (NEXT_PUBLIC_DATA_MODE=mock) all flags are enabled so every page
 * renders with mock data. In production only the explicitly enabled flags are on.
 */
const isMock = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DATA_MODE === 'mock'

export const FEATURES = {
  aiImproveAnswer: true,
  aiGenerateQuestions: true,
  aiClarityAssessment: true,
  aiImpactAnalysis: true,
  aiAdminConfig: isMock || false,
  aiAdminAgents: true,
  traceability: isMock || true,
  governanceEnforcement: true, // Display hint only; server GOVERNANCE_ENFORCEMENT env is authoritative
  advancedMembers: isMock || false,
  orgInvites: true,
  /** Wave 3 — quote PDF/email send until BE document/send contract exists */
  wave3QuoteDocuments: false,
  /** Wave 3 — baseline compare-current (typed deltas + change counts) */
  wave3BaselineCompare: true,
  /** Wave 3 — CR apply until atomic apply contract is confirmed */
  wave3CrApply: false,

  // ── Document Hub / Productivity / Knowledge / AI / Quality … ──
  globalSearch: true,
  workInbox: true,
  myWork: true,
  savedItems: true,
  documentHub: true,
  knowledge: true,
  aiAssistant: true,
  projectGovernance: true,
  reporting: true,
  quality: true,
  /** Requirements register + coverage matrix (distinct from legacy `traceability`) */
  requirementsTraceability: true,
  aiPlanning: true,
  aiRecommendations: true,
  /** Client portal shell — login + project views wired; UAT still gated (W4-EX-PORTAL-UAT) */
  clientPortal: true,
  clientCollaboration: true,
  integrations: true,
  trust: true,
  serviceSupport: true,
  /** Wave 4.1 — native document editor (/content + Plate) */
  wave41NativeEditor: true,
  /** Wave 4.1 — sub-page tree (off until BE Subpage controller exists) */
  wave41DocumentSubpages: false,
  /**
   * Wave 4.1 — native template publish/instantiate (/native-versions).
   * BE DocumentTemplateController now exposes these paths.
   */
  wave41NativeTemplates: true,
  /**
   * Wave 4.1 — Smart Blocks picker/resolve.
   * Off until /smart-blocks/* typed APIs exist (GAP-09).
   */
  wave41SmartBlocks: false,
  /**
   * Wave 5 — AI Agent Playground (maps to AIAGENT_PLAYGROUND_ENABLED).
   * Set NEXT_PUBLIC_AIAGENT_PLAYGROUND_ENABLED=false to force unavailable UI.
   */
  aiAgentPlayground:
    isMock || process.env.NEXT_PUBLIC_AIAGENT_PLAYGROUND_ENABLED !== 'false',
} as const

export type FeatureFlag = keyof typeof FEATURES
