export type ArchitectureNodeType =
  | 'MODULE'
  | 'SCREEN'
  | 'API_ENDPOINT'
  | 'COMPONENT'
  | 'DATA_ENTITY'
  | 'COMMUNICATION'

/** Browse catalog may also list related project Functions (read-only). */
export type CatalogBrowseNodeType = ArchitectureNodeType | 'FUNCTION'

export type WorkbenchSection =
  | 'overview'
  | 'architectureCatalog'
  | 'relationshipExplorer'
  | 'functionalMapping'
  | 'coverage'
  | 'unlinked'
  | 'catalogModules'
  | 'catalogScreens'
  | 'catalogApis'
  | 'catalogComponents'
  | 'catalogEntities'
  | 'catalogCommunications'
  | 'toolsImport'

interface CatalogNodeBase {
  id: string
  code: string
  name: string
  status?: string | null
  secondary?: string | null
  /** Extra detail for read-only Function rows. */
  description?: string | null
  /** Set on Function rows — owning module. */
  moduleId?: string | null
  /** Set on Function rows — source project. */
  projectId?: string | null
  projectName?: string | null
}

/** Architecture-only nodes (Structure / relations). */
export interface ArchitectureCatalogNode extends CatalogNodeBase {
  type: ArchitectureNodeType
}

/** Browse list: architecture nodes plus related Functions. */
export interface BrowseCatalogNode extends CatalogNodeBase {
  type: CatalogBrowseNodeType
}

export function isArchitectureCatalogNode(
  node: BrowseCatalogNode
): node is ArchitectureCatalogNode {
  return node.type !== 'FUNCTION'
}

export const ARCHITECTURE_NODE_TYPE_LABEL: Record<CatalogBrowseNodeType, string> = {
  MODULE: 'Module',
  SCREEN: 'Screen',
  API_ENDPOINT: 'API Endpoint',
  COMPONENT: 'Component',
  DATA_ENTITY: 'Data Entity',
  COMMUNICATION: 'Communication',
  FUNCTION: 'Function',
}
