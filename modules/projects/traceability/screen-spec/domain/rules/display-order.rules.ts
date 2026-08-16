export function moveOrderedId(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return ids
  const from = ids.indexOf(fromId)
  const to = ids.indexOf(toId)
  if (from < 0 || to < 0) return ids
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function ordersNeedingUpdate(
  items: Array<{ id: string; displayOrder: number | null }>,
  orderedIds: string[]
): Array<{ id: string; displayOrder: number }> {
  const byId = new Map(items.map((item) => [item.id, item]))
  return orderedIds.flatMap((id, index) => {
    const item = byId.get(id)
    if (!item || item.displayOrder === index) return []
    return [{ id, displayOrder: index }]
  })
}

export function sortByDisplayOrder<T extends { displayOrder: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}
