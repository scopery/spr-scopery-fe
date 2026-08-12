import { architectureToAnchorNodeType } from './anchor-mapping'
import type { BrowseCatalogNode } from './architecture-workbench'
import type { StructureRelation } from './structure-relation'

/** Structure relations are polymorphic UUIDs with no FK cascade on node delete. */
export function countStructureRelationsForNode(
  relations: StructureRelation[],
  node: BrowseCatalogNode
): number {
  if (node.type === 'FUNCTION' || node.type === 'COMMUNICATION') return 0
  const nodeType = architectureToAnchorNodeType(node.type)
  if (!nodeType) return 0
  return relations.filter(
    (r) =>
      (r.fromNodeType === nodeType && r.fromNodeId === node.id) ||
      (r.toNodeType === nodeType && r.toNodeId === node.id)
  ).length
}

/**
 * Temporary FE guard: block delete when structure links would orphan
 * (BE delete does not cascade `app_structure_relation`).
 * Communications archive safely; Functions are not deleted from architecture browse.
 */
export function getArchitectureDeleteBlockReason(
  node: BrowseCatalogNode,
  relations: StructureRelation[]
): string | null {
  if (node.type === 'FUNCTION') {
    return 'Functions are deleted from the project catalog, not here.'
  }
  if (node.type === 'COMMUNICATION') {
    return null
  }
  const count = countStructureRelationsForNode(relations, node)
  if (count > 0) {
    return `Unlink ${count} structure relation${count === 1 ? '' : 's'} on the Structure tab before deleting.`
  }
  return null
}

export function isArchitectureNodeDeletable(
  node: BrowseCatalogNode,
  relations: StructureRelation[]
): boolean {
  return getArchitectureDeleteBlockReason(node, relations) === null
}
