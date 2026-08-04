import type { SpecPackPreviewDocument } from './spec-pack-preview'

/** Reorder preview chapters to match an explicit requirement-id sequence (FE-only). */
export function reorderSpecPackChapters(
  doc: SpecPackPreviewDocument,
  orderedRequirementIds: string[]
): SpecPackPreviewDocument {
  const byId = new Map(doc.chapters.map((c) => [c.requirement.id, c]))
  const chapters = orderedRequirementIds
    .map((id) => byId.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  // Keep any unexpected chapters at the end (defensive).
  for (const c of doc.chapters) {
    if (!orderedRequirementIds.includes(c.requirement.id)) {
      chapters.push(c)
    }
  }

  return { ...doc, chapters }
}
