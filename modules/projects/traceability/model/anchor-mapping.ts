import type { ArchitectureCatalogNode, ArchitectureNodeType } from './architecture-workbench'
import { FunctionalItemAnchorNodeType } from './functional-catalog'

/** Map Architecture Catalog type ↔ Functional Item anchor nodeType (BE). */
export const ANCHOR_NODE_TYPE_TO_ARCHITECTURE: Record<
  FunctionalItemAnchorNodeType,
  ArchitectureNodeType
> = {
  [FunctionalItemAnchorNodeType.AppModule]: 'MODULE',
  [FunctionalItemAnchorNodeType.Screen]: 'SCREEN',
  [FunctionalItemAnchorNodeType.ApiEndpoint]: 'API_ENDPOINT',
  [FunctionalItemAnchorNodeType.AppComponent]: 'COMPONENT',
  [FunctionalItemAnchorNodeType.DataEntity]: 'DATA_ENTITY',
}

export const ARCHITECTURE_TO_ANCHOR_NODE_TYPE: {
  [K in Exclude<ArchitectureNodeType, 'COMMUNICATION'>]: FunctionalItemAnchorNodeType
} = {
  MODULE: FunctionalItemAnchorNodeType.AppModule,
  SCREEN: FunctionalItemAnchorNodeType.Screen,
  API_ENDPOINT: FunctionalItemAnchorNodeType.ApiEndpoint,
  COMPONENT: FunctionalItemAnchorNodeType.AppComponent,
  DATA_ENTITY: FunctionalItemAnchorNodeType.DataEntity,
}

export function architectureToAnchorNodeType(
  type: ArchitectureNodeType
): FunctionalItemAnchorNodeType | null {
  if (type === 'COMMUNICATION') return null
  return ARCHITECTURE_TO_ANCHOR_NODE_TYPE[type]
}

export function labelArchitectureNode(node: ArchitectureCatalogNode): string {
  const detail = node.secondary ? ` · ${node.secondary}` : ''
  return `${node.code} — ${node.name}${detail}`
}
