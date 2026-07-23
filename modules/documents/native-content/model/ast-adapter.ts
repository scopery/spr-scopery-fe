import type { Value } from 'platejs'
import { emptyPlateValue } from '@/modules/documents/document/ui/editor/empty-plate-value'
import { normalizeToPlateValue } from './normalize-plate-value'

/**
 * Parse BE `ast` JSON string into Plate Value.
 * Accepts Plate nodes, TipTap/ProseMirror nodes, or `{ type: 'doc', content: [...] }`.
 */
export function parseAstToPlateValue(ast: string | null | undefined): Value {
  if (!ast || !ast.trim()) return emptyPlateValue()
  return normalizeToPlateValue(ast)
}

/** Serialize Plate Value for BE `ast` — must be a JSON object (DB CHECK jsonb_typeof = object). */
export function plateValueToAst(value: Value): string {
  const content = value?.length ? value : emptyPlateValue()
  return JSON.stringify({ type: 'doc', content })
}
