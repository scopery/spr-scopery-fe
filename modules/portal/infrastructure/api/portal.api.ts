import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { portalApiClient } from '@/shared/lib/portalApiClient'
import { PORTAL_ENDPOINTS } from './endpoints'
import type {
  PortalProject,
  PortalReview,
  PortalSupportCase,
} from '../../domain/model/portal'

export async function listPortalProjects(): Promise<{ items: PortalProject[] }> {
  const res = await portalApiClient.get<ListPayload<PortalProject>>(PORTAL_ENDPOINTS.projects())
  return normalizeItemList(res)
}

export async function getPortalProject(projectId: string): Promise<PortalProject> {
  return portalApiClient.get(PORTAL_ENDPOINTS.project(projectId))
}

export async function listPortalReviews(
  projectId: string
): Promise<{ items: PortalReview[] }> {
  const res = await portalApiClient.get<ListPayload<PortalReview>>(PORTAL_ENDPOINTS.reviews(projectId))
  return normalizeItemList(res)
}

export async function decidePortalReview(
  projectId: string,
  reviewId: string,
  body: { decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'; comment?: string }
): Promise<PortalReview> {
  return portalApiClient.post(PORTAL_ENDPOINTS.decideReview(projectId, reviewId), body)
}

export async function listPortalSupport(
  projectId: string
): Promise<{ items: PortalSupportCase[] }> {
  const res = await portalApiClient.get<ListPayload<PortalSupportCase>>(PORTAL_ENDPOINTS.support(projectId))
  return normalizeItemList(res)
}

export async function portalLogin(body: {
  email: string
  password: string
}): Promise<void> {
  await portalApiClient.post(PORTAL_ENDPOINTS.login(), body, { parseJson: false })
}
