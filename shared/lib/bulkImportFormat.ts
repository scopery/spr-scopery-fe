export interface BulkImportFieldGuide {
  name: string
  required: boolean
  type: string
  description: string
  /** Allowed enum values, when applicable. */
  enumValues?: readonly string[]
  /** Short note about how to choose an enum value. */
  enumNotes?: string
}

export interface BulkImportFormatGuide {
  /** Short entity name shown in the help header, e.g. "Requirement". */
  entityLabel: string
  /** Max items per request (shown in notes). */
  maxItems?: number
  /** Extra notes shown above the field table. */
  notes?: readonly string[]
  fields: readonly BulkImportFieldGuide[]
  /**
   * Sample payload to copy for a third-party agent.
   * Prefer `{ "items": [ ... ] }` matching the bulk API body.
   */
  sample: { items: Record<string, unknown>[] }
}

export function formatBulkImportSampleJson(guide: BulkImportFormatGuide): string {
  return JSON.stringify(guide.sample, null, 2)
}

/**
 * Full English guide text for a third-party agent: instructions, field rules,
 * enums, required notes, and a sample JSON payload.
 */
export function formatBulkImportGuideForAgent(guide: BulkImportFormatGuide): string {
  const lines: string[] = [
    `# ${guide.entityLabel} — JSON bulk import format`,
    '',
    'Produce a JSON payload that matches this specification exactly.',
    'Return only valid JSON (or a complete `{ "items": [...] }` object) unless the user asks otherwise.',
    'Do not invent enum values outside the lists below.',
    '',
  ]

  if (guide.maxItems != null) {
    lines.push(`Maximum items per request: ${guide.maxItems}.`)
    lines.push('')
  }

  if (guide.notes?.length) {
    lines.push('## Notes')
    for (const note of guide.notes) {
      lines.push(`- ${note}`)
    }
    lines.push('')
  }

  lines.push('## Fields')
  for (const field of guide.fields) {
    const requiredLabel = field.required ? 'REQUIRED' : 'optional'
    lines.push(`- \`${field.name}\` (${requiredLabel}, ${field.type}): ${field.description}`)
    if (field.enumValues?.length) {
      lines.push(`  - Enum values: ${field.enumValues.join(' | ')}`)
      if (field.enumNotes) {
        lines.push(`  - Enum note: ${field.enumNotes}`)
      }
    }
  }

  lines.push('')
  lines.push('## Sample JSON')
  lines.push('```json')
  lines.push(formatBulkImportSampleJson(guide))
  lines.push('```')
  lines.push('')
  lines.push(
    'Fill the sample with real project data, keep the same keys and enum casing, then return the JSON so it can be pasted back into the import dialog.'
  )

  return lines.join('\n')
}

/**
 * Detect clipboard text that is a bulk JSON payload (`{ items: [...] }` or a bare array).
 * Returns null when the text is not JSON (e.g. TSV/CSV spreadsheet paste).
 */
export function tryParseBulkImportJson(text: string): Record<string, unknown>[] | null {
  const raw = text.trim()
  if (!raw || (raw[0] !== '{' && raw[0] !== '[')) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((row): row is Record<string, unknown> =>
        Boolean(row) && typeof row === 'object' && !Array.isArray(row)
      )
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: unknown[] }).items.filter(
        (row): row is Record<string, unknown> =>
          Boolean(row) && typeof row === 'object' && !Array.isArray(row)
      )
    }
  } catch {
    return null
  }
  return null
}

export function stringField(row: Record<string, unknown>, key: string): string {
  const value = row[key]
  if (value == null) return ''
  return String(value).trim()
}
