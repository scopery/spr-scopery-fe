export interface AiAdminPage<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
}

export function normalizeAiAdminPage<T>(res: unknown): AiAdminPage<T> {
  if (!res || typeof res !== 'object') {
    return { items: [], page: 0, size: 20, totalElements: 0 }
  }
  const p = res as Record<string, unknown>
  const items = Array.isArray(p.items)
    ? (p.items as T[])
    : Array.isArray(p.content)
      ? (p.content as T[])
      : []
  const page = typeof p.page === 'number' ? p.page : 0
  const size = typeof p.size === 'number' ? p.size : items.length
  const totalElements =
    typeof p.totalElements === 'number'
      ? p.totalElements
      : typeof p.total === 'number'
        ? p.total
        : items.length
  const totalPages = typeof p.totalPages === 'number' ? p.totalPages : undefined
  return { items, page, size, totalElements, totalPages }
}
