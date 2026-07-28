import { apiClient } from '@/shared/lib/apiClient'
import { MEMBER_PERMISSIONS_ENDPOINTS } from './member-permissions.endpoints'
import type {
  MemberPermissionCatalogResponse,
  MemberPermissionsSnapshotResponse,
  ReplaceMemberPermissionsPayload,
} from '../model/member-permissions'

export async function getWorkspaceMemberPermissionsCatalog(
  workspaceId: string
): Promise<MemberPermissionCatalogResponse> {
  return apiClient.get(MEMBER_PERMISSIONS_ENDPOINTS.workspaceCatalog(workspaceId), {
    skipErrorToast: true,
  })
}

export async function getWorkspaceMemberPermissionsSnapshot(
  workspaceId: string,
  userId: string
): Promise<MemberPermissionsSnapshotResponse> {
  return apiClient.get(MEMBER_PERMISSIONS_ENDPOINTS.workspaceMember(workspaceId, userId), {
    skipErrorToast: true,
  })
}

export async function replaceWorkspaceMemberPermissions(
  workspaceId: string,
  userId: string,
  body: ReplaceMemberPermissionsPayload
): Promise<MemberPermissionsSnapshotResponse> {
  return apiClient.put(MEMBER_PERMISSIONS_ENDPOINTS.workspaceMember(workspaceId, userId), body)
}

export async function getOrganizationMemberPermissionsCatalog(
  organizationId: string
): Promise<MemberPermissionCatalogResponse> {
  return apiClient.get(MEMBER_PERMISSIONS_ENDPOINTS.organizationCatalog(organizationId), {
    skipErrorToast: true,
  })
}

export async function getOrganizationMemberPermissionsSnapshot(
  organizationId: string,
  userId: string
): Promise<MemberPermissionsSnapshotResponse> {
  return apiClient.get(MEMBER_PERMISSIONS_ENDPOINTS.organizationMember(organizationId, userId), {
    skipErrorToast: true,
  })
}

export async function replaceOrganizationMemberPermissions(
  organizationId: string,
  userId: string,
  body: ReplaceMemberPermissionsPayload
): Promise<MemberPermissionsSnapshotResponse> {
  return apiClient.put(MEMBER_PERMISSIONS_ENDPOINTS.organizationMember(organizationId, userId), body)
}

export async function getProjectMemberPermissionsCatalog(
  projectId: string
): Promise<MemberPermissionCatalogResponse> {
  return apiClient.get(MEMBER_PERMISSIONS_ENDPOINTS.projectCatalog(projectId), {
    skipErrorToast: true,
  })
}

export async function getProjectMemberPermissionsSnapshot(
  projectId: string,
  userId: string
): Promise<MemberPermissionsSnapshotResponse> {
  return apiClient.get(MEMBER_PERMISSIONS_ENDPOINTS.projectMember(projectId, userId), {
    skipErrorToast: true,
  })
}

export async function replaceProjectMemberPermissions(
  projectId: string,
  userId: string,
  body: ReplaceMemberPermissionsPayload
): Promise<MemberPermissionsSnapshotResponse> {
  return apiClient.put(MEMBER_PERMISSIONS_ENDPOINTS.projectMember(projectId, userId), body)
}
