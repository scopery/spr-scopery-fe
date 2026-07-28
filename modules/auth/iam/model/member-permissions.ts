export interface MemberPermissionCatalogItem {
  permissionActionId: string
  title: string
  description: string
  module: string
  grantedUserIds: string[]
  /** Included when member joined; shown locked — cannot revoke via this UI. */
  baseline?: boolean
}

export interface MemberPermissionCatalogResponse {
  resourceType: string
  resourceRefId: string
  items: MemberPermissionCatalogItem[]
}

export interface MemberPermissionsSnapshotResponse {
  userId: string
  permissionActionIds: string[]
}

export interface ReplaceMemberPermissionsPayload {
  permissionActionIds: string[]
}
