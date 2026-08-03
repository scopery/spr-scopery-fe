import { apiClient } from '@/shared/lib/apiClient'
import { SCOPE_ENDPOINTS } from './endpoints'
import type {
  CreateScopeItemPayload,
  CreateScopePackagePayload,
  ScopeItem,
  ScopePackage,
  ScopePackageRequirement,
  UpdateScopeItemPayload,
} from '../../domain/model/scope'

export async function listScopePackages(projectId: string): Promise<ScopePackage[]> {
  return apiClient.get<ScopePackage[]>(SCOPE_ENDPOINTS.packages.list(projectId))
}

export async function createScopePackage(
  projectId: string,
  body: CreateScopePackagePayload
): Promise<ScopePackage> {
  return apiClient.post<ScopePackage>(SCOPE_ENDPOINTS.packages.create(projectId), body)
}

export async function getScopePackage(
  projectId: string,
  packageId: string
): Promise<ScopePackage> {
  return apiClient.get<ScopePackage>(SCOPE_ENDPOINTS.packages.get(projectId, packageId))
}

export async function approveScopePackage(
  projectId: string,
  packageId: string
): Promise<ScopePackage> {
  return apiClient.post<ScopePackage>(SCOPE_ENDPOINTS.packages.approve(projectId, packageId))
}

export async function markCurrentScopePackage(
  projectId: string,
  packageId: string
): Promise<ScopePackage> {
  return apiClient.post<ScopePackage>(SCOPE_ENDPOINTS.packages.markCurrent(projectId, packageId))
}

export async function archiveScopePackage(
  projectId: string,
  packageId: string
): Promise<ScopePackage> {
  return apiClient.patch<ScopePackage>(SCOPE_ENDPOINTS.packages.archive(projectId, packageId))
}

function normalizePackageRequirement(raw: ScopePackageRequirement): ScopePackageRequirement {
  const anyRaw = raw as ScopePackageRequirement & Record<string, unknown>
  const description =
    (typeof anyRaw.description === 'string' ? anyRaw.description : null) ??
    (typeof anyRaw.Description === 'string' ? anyRaw.Description : null) ??
    null
  return {
    ...raw,
    description: description ?? raw.description ?? null,
  }
}

export async function listPackageRequirements(
  projectId: string,
  packageId: string
): Promise<ScopePackageRequirement[]> {
  const res = await apiClient.get<ScopePackageRequirement[] | { items?: ScopePackageRequirement[] }>(
    SCOPE_ENDPOINTS.packages.requirements(projectId, packageId)
  )
  const items = Array.isArray(res) ? res : (res.items ?? [])
  return items.map(normalizePackageRequirement)
}

export async function linkRequirementsToPackage(
  projectId: string,
  packageId: string,
  requirementIds: string[]
): Promise<ScopePackageRequirement[]> {
  return apiClient.post<ScopePackageRequirement[]>(
    SCOPE_ENDPOINTS.packages.linkRequirements(projectId, packageId),
    { requirementIds }
  )
}

export async function unlinkRequirementsFromPackage(
  projectId: string,
  packageId: string,
  requirementIds: string[]
): Promise<ScopePackageRequirement[]> {
  return apiClient.post<ScopePackageRequirement[]>(
    SCOPE_ENDPOINTS.packages.unlinkRequirements(projectId, packageId),
    { requirementIds }
  )
}

export async function listScopeItems(
  projectId: string,
  packageId: string
): Promise<ScopeItem[]> {
  return apiClient.get<ScopeItem[]>(SCOPE_ENDPOINTS.items.list(projectId, packageId))
}

export async function createScopeItem(
  projectId: string,
  packageId: string,
  body: CreateScopeItemPayload
): Promise<ScopeItem> {
  return apiClient.post<ScopeItem>(SCOPE_ENDPOINTS.items.create(projectId, packageId), body)
}

export async function getScopeItem(projectId: string, scopeItemId: string): Promise<ScopeItem> {
  return apiClient.get<ScopeItem>(SCOPE_ENDPOINTS.items.get(projectId, scopeItemId))
}

export async function updateScopeItem(
  projectId: string,
  scopeItemId: string,
  body: UpdateScopeItemPayload
): Promise<ScopeItem> {
  return apiClient.put<ScopeItem>(SCOPE_ENDPOINTS.items.update(projectId, scopeItemId), body)
}

export async function archiveScopeItem(
  projectId: string,
  scopeItemId: string
): Promise<ScopeItem> {
  return apiClient.patch<ScopeItem>(SCOPE_ENDPOINTS.items.archive(projectId, scopeItemId))
}
