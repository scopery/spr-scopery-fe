/**
 * Normalize BE list payloads after apiClient unwraps `{ success, data }`.
 *
 * Scopery BE often returns `ApiResponse.success(List<T>)` → client sees `T[]`.
 * Some endpoints return `{ items }`, Spring page `{ content }`, or nested `{ data: { items } }`.
 * Hooks must never call `.map` / `.length` on undefined — always go through this helper.
 */

export type ListPayload<T> =
  | T[]
  | {
      items?: T[]
      content?: T[]
      data?: { items?: T[] } | T[]
      page?: unknown
      total?: number
    }
  | null
  | undefined

export function normalizeList<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.content)) return payload.content
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.items)) {
    return payload.data.items
  }
  return []
}

/** Prefer this when the module API contract is `{ items: T[] }`. */
export function normalizeItemList<T>(payload: ListPayload<T>): { items: T[] } {
  return { items: normalizeList(payload) }
}
