/**
 * Security rules for provider secrets (E2E-W5-035).
 * Raw values must never enter React query caches, localStorage, or logs.
 */

export function assertNoRawSecretInRecord(record: Record<string, unknown>): boolean {
  return !('secretValue' in record)
}

export function isSecretValueWithinLimit(value: string, max = 5000): boolean {
  return value.length > 0 && value.length <= max
}
