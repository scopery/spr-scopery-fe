import type { ExecuteByEventPayload } from '../model/execution'

/** Same identification rules as event resolve: definition XOR code XOR source+key. */
export function validateExecuteByEventPayload(
  body: ExecuteByEventPayload
): string | null {
  const hasDef = Boolean(body.eventDefinitionId?.trim())
  const hasCode = Boolean(body.eventCode?.trim())
  const hasPair =
    Boolean(body.sourceSystem?.trim()) && Boolean(body.eventKey?.trim())
  const hasPartialPair =
    Boolean(body.sourceSystem?.trim()) !== Boolean(body.eventKey?.trim())

  if (hasPartialPair) {
    return 'Provide both sourceSystem and eventKey together'
  }
  const modes = [hasDef, hasCode, hasPair].filter(Boolean).length
  if (modes === 0) {
    return 'Provide eventDefinitionId, eventCode, or sourceSystem+eventKey'
  }
  if (modes > 1) {
    return 'Use only one identification mode'
  }
  return null
}

export function parseInputVariablesJson(raw: string): {
  value: Record<string, unknown> | undefined
  error: string | null
} {
  if (!raw.trim()) return { value: undefined, error: null }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { value: undefined, error: 'inputVariables must be a JSON object' }
    }
    return { value: parsed as Record<string, unknown>, error: null }
  } catch {
    return { value: undefined, error: 'inputVariables JSON is invalid' }
  }
}
