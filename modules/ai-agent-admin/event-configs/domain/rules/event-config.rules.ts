import type { ResolveEventConfigParams } from '../model/event-config'

/** Enforce eventDefinitionId XOR (sourceSystem + eventKey). */
export function validateResolveIdentification(
  params: ResolveEventConfigParams
): string | null {
  const hasDef = Boolean(params.eventDefinitionId?.trim())
  const hasPair =
    Boolean(params.sourceSystem?.trim()) && Boolean(params.eventKey?.trim())
  const hasPartialPair =
    Boolean(params.sourceSystem?.trim()) !== Boolean(params.eventKey?.trim())

  if (hasPartialPair) {
    return 'Provide both sourceSystem and eventKey together'
  }
  if (hasDef && hasPair) {
    return 'Use either eventDefinitionId or sourceSystem+eventKey, not both'
  }
  if (!hasDef && !hasPair) {
    return 'Provide eventDefinitionId or sourceSystem+eventKey'
  }
  return null
}
