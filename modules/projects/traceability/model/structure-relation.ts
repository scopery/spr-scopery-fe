/**
 * Application structure node↔node relations (optional links).
 * BE: StructureRelationNodeType / StructureRelationType
 */

export const StructureRelationNodeType = {
  AppModule: 'APP_MODULE',
  Screen: 'SCREEN',
  ApiEndpoint: 'API_ENDPOINT',
  AppComponent: 'APP_COMPONENT',
  DataEntity: 'DATA_ENTITY',
} as const
export type StructureRelationNodeType =
  (typeof StructureRelationNodeType)[keyof typeof StructureRelationNodeType]

export const StructureRelationType = {
  Related: 'RELATED',
  Uses: 'USES',
  Implements: 'IMPLEMENTS',
} as const
export type StructureRelationType =
  (typeof StructureRelationType)[keyof typeof StructureRelationType]

export interface StructureRelation {
  id: string
  applicationId: string
  workspaceId: string
  fromNodeType: string
  fromNodeId: string
  toNodeType: string
  toNodeId: string
  relationType: string
  createdAt: string
  updatedAt: string
}

export interface AddStructureRelationBody {
  fromNodeType: string
  fromNodeId: string
  toNodeType: string
  toNodeId: string
  relationType?: string | null
}
