export const EvidenceType = {
  Document: 'DOCUMENT',
  TestResult: 'TEST_RESULT',
  Screenshot: 'SCREENSHOT',
  External: 'EXTERNAL',
  Other: 'OTHER',
} as const
export type EvidenceType = (typeof EvidenceType)[keyof typeof EvidenceType]
