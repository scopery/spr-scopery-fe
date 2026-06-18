/**
 * Central feature flags for the simplified MVP.
 * In mock mode (NEXT_PUBLIC_DATA_MODE=mock) all flags are enabled so every page
 * renders with mock data. In production only the explicitly enabled flags are on.
 */
const isMock =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DATA_MODE === 'mock'

export const FEATURES = {
  aiImproveAnswer: true,
  aiGenerateQuestions: true,
  aiClarityAssessment: true,
  aiImpactAnalysis: true,
  aiAdminConfig: isMock || false,
  aiAdminAgents: true,
  traceability: isMock || false,
  governanceEnforcement: true, // Display hint only; server GOVERNANCE_ENFORCEMENT env is authoritative
  advancedMembers: isMock || false,
  orgInvites: isMock || false,
} as const

export type FeatureFlag = keyof typeof FEATURES
