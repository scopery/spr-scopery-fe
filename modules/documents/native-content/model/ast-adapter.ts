import type { Value } from 'platejs'

function emptyPlateValue(): Value {
  return [{ type: 'p', children: [{ text: '' }] }] as Value
}

/**
 * Parse BE `ast` JSON string into Plate Value.
 * Accepts a Plate node array or a ProseMirror-like `{ type: 'doc', content: [...] }`.
 */
export function parseAstToPlateValue(ast: string | null | undefined): Value {
  if (!ast || !ast.trim()) return emptyPlateValue()
  try {
    const parsed: unknown = JSON.parse(ast)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Value
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { content?: unknown }).content)
    ) {
      const content = (parsed as { content: Value }).content
      return content.length > 0 ? content : emptyPlateValue()
    }
  } catch {
    // fall through
  }
  return emptyPlateValue()
}

/** Serialize Plate Value for BE `ast` — must be a JSON object (DB CHECK jsonb_typeof = object). */
export function plateValueToAst(value: Value): string {
  const content = value?.length ? value : emptyPlateValue()
  return JSON.stringify({ type: 'doc', content })
}
