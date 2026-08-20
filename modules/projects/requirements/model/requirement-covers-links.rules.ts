export const CoversLinkType = 'COVERS' as const

export interface CoversFunctionRef {
  id: string
  code: string
  title: string
}

export interface CoversTraceLinkLike {
  sourceId?: string
  sourceType?: string
  targetId?: string
  targetType?: string
  targetCode?: string | null
  targetTitle?: string | null
  linkType?: string
}

export function isCoversReqToFunctionLink(link: CoversTraceLinkLike): boolean {
  return (
    link.sourceType?.toUpperCase() === 'REQUIREMENT' &&
    link.targetType?.toUpperCase() === 'FUNCTIONAL_ITEM' &&
    link.linkType?.toUpperCase() === CoversLinkType &&
    Boolean(link.sourceId) &&
    Boolean(link.targetId)
  )
}

/** Group COVERS links by requirement id. One function appears once per requirement. */
export function buildCoversReqFunctionIndex(
  links: CoversTraceLinkLike[]
): Map<string, CoversFunctionRef[]> {
  const index = new Map<string, CoversFunctionRef[]>()
  for (const link of links) {
    if (!isCoversReqToFunctionLink(link) || !link.sourceId || !link.targetId) continue
    const list = index.get(link.sourceId) ?? []
    if (list.some((fn) => fn.id === link.targetId)) continue
    list.push({
      id: link.targetId,
      code: link.targetCode?.trim() ?? '',
      title: link.targetTitle?.trim() || link.targetCode?.trim() || link.targetId,
    })
    index.set(link.sourceId, list)
  }
  return index
}
