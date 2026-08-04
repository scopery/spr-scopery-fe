import type { SpecPackGroup } from './spec-pack'
import type { SpecPackPreviewDocument } from './spec-pack-preview'

/**
 * Rebuild preview sections/chapters from an explicit group structure
 * without network — used for optimistic reorder.
 */
export function applySpecPackGroupsToPreview(
  doc: SpecPackPreviewDocument,
  groups: SpecPackGroup[]
): SpecPackPreviewDocument {
  const chapterByReqId = new Map(
    doc.chapters.map((c) => [c.requirement.id, c] as const)
  )

  const sections = groups.map((g) => ({
    group: {
      id: g.id,
      name: g.name,
      description: g.description ?? null,
    },
    chapters: g.requirements
      .map((r) => chapterByReqId.get(r.id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c)),
  }))

  const chapters = sections.flatMap((s) => s.chapters)
  return { ...doc, sections, chapters }
}
