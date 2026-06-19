import type { Value } from 'platejs'

/** Phase 1 legacy plain text wrapper */
export interface PlainDocumentContent {
  format: 'plain'
  body: string
}

/** Phase 2+ Plate editor storage format */
export interface PlateDocumentContent {
  format: 'plate'
  value: Value
}

export type DocumentContent = PlainDocumentContent | PlateDocumentContent

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export function isPlateContent(content: unknown): content is PlateDocumentContent {
  return (
    !!content &&
    typeof content === 'object' &&
    (content as PlateDocumentContent).format === 'plate' &&
    Array.isArray((content as PlateDocumentContent).value)
  )
}

export function isPlainContent(content: unknown): content is PlainDocumentContent {
  return (
    !!content &&
    typeof content === 'object' &&
    (content as PlainDocumentContent).format === 'plain' &&
    typeof (content as PlainDocumentContent).body === 'string'
  )
}
