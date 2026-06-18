import type { Value } from 'platejs'
import type { DocumentContent, PlateDocumentContent } from './editor.types'
import { emptyPlateValue } from './plate-config'

/** Safe default when content is missing or invalid */
export function emptyDocumentContent(): PlateDocumentContent {
  return { format: 'plate', value: emptyPlateValue() }
}

export function plainTextToPlateValue(text: string): Value {
  const trimmed = text.trim()
  if (!trimmed) return emptyPlateValue()

  return trimmed.split('\n').map((line) => ({
    type: 'p',
    children: [{ text: line }],
  })) as Value
}

/**
 * Normalize DB content to Plate Value.
 * Preserves Phase 1 plain documents by converting to paragraphs.
 */
export function contentToPlateValue(content: unknown): Value {
  if (!content) return emptyPlateValue()

  if (typeof content === 'object' && content !== null) {
    const obj = content as DocumentContent & { body?: string; value?: Value }

    if (obj.format === 'plate' && Array.isArray(obj.value) && obj.value.length > 0) {
      return obj.value
    }

    if (obj.format === 'plain' && typeof obj.body === 'string') {
      return plainTextToPlateValue(obj.body)
    }

    if (typeof obj.body === 'string') {
      return plainTextToPlateValue(obj.body)
    }
  }

  if (typeof content === 'string') {
    return plainTextToPlateValue(content)
  }

  return emptyPlateValue()
}

export function plateValueToContent(value: Value): PlateDocumentContent {
  return { format: 'plate', value }
}

export function isValidPlateValue(value: unknown): value is Value {
  return Array.isArray(value) && value.length >= 0
}
