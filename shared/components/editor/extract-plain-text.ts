import type { Value } from 'platejs'
import { isPlateContent, isPlainContent } from './editor.types'

type TextNode = {
  text?: string
  type?: string
  url?: string
  children?: unknown[]
}

/** Block types that carry no searchable text */
const SKIP_TYPES = new Set(['hr'])

function extractFromNodes(nodes: unknown[]): string {
  const parts: string[] = []

  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue
    const n = node as TextNode

    if (n.type && SKIP_TYPES.has(n.type)) continue

    if (typeof n.text === 'string') {
      parts.push(n.text)
      continue
    }

    if (Array.isArray(n.children)) {
      const childText = extractFromNodes(n.children)
      if (!childText) continue

      if (n.type === 'a' && typeof n.url === 'string' && n.url.trim()) {
        parts.push(childText === n.url ? childText : `${childText} (${n.url})`)
      } else {
        parts.push(childText)
      }
    }
  }

  return parts.join('\n')
}

export function extractPlainTextFromPlateValue(value: Value): string {
  return extractFromNodes(value as unknown[]).trim()
}

/** Extract searchable plain text from any stored document content shape */
export function extractPlainTextFromDocumentContent(content: unknown): string {
  if (isPlateContent(content)) {
    return extractPlainTextFromPlateValue(content.value)
  }
  if (isPlainContent(content)) {
    return content.body.trim()
  }
  if (content && typeof content === 'object' && 'body' in content) {
    const body = (content as { body: unknown }).body
    if (typeof body === 'string') return body.trim()
  }
  if (typeof content === 'string') return content.trim()
  return ''
}
