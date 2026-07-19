import { apiClient } from '@/shared/lib/apiClient'
import { RATE_CARD_ENDPOINTS } from './endpoints'
import type {
  CreateRateCardVersionPayload,
  RateCardVersion,
  UpdateRateCardVersionPayload,
} from '../../domain/model/rate-card-version'

export async function listRateCardVersions(rateCardId: string): Promise<RateCardVersion[]> {
  return apiClient.get<RateCardVersion[]>(RATE_CARD_ENDPOINTS.versions.list(rateCardId))
}

export async function getRateCardVersion(
  rateCardId: string,
  versionId: string
): Promise<RateCardVersion> {
  return apiClient.get<RateCardVersion>(RATE_CARD_ENDPOINTS.versions.get(rateCardId, versionId))
}

export async function createRateCardVersion(
  rateCardId: string,
  body: CreateRateCardVersionPayload
): Promise<RateCardVersion> {
  return apiClient.post<RateCardVersion>(RATE_CARD_ENDPOINTS.versions.create(rateCardId), body)
}

export async function updateRateCardVersion(
  rateCardId: string,
  versionId: string,
  body: UpdateRateCardVersionPayload
): Promise<RateCardVersion> {
  return apiClient.put<RateCardVersion>(
    RATE_CARD_ENDPOINTS.versions.update(rateCardId, versionId),
    body
  )
}

export async function publishRateCardVersion(
  rateCardId: string,
  versionId: string
): Promise<RateCardVersion> {
  return apiClient.post<RateCardVersion>(
    RATE_CARD_ENDPOINTS.versions.publish(rateCardId, versionId)
  )
}

export async function archiveRateCardVersion(
  rateCardId: string,
  versionId: string
): Promise<RateCardVersion> {
  return apiClient.patch<RateCardVersion>(
    RATE_CARD_ENDPOINTS.versions.archive(rateCardId, versionId)
  )
}

export async function duplicateRateCardVersion(
  rateCardId: string,
  versionId: string
): Promise<RateCardVersion> {
  return apiClient.post<RateCardVersion>(
    RATE_CARD_ENDPOINTS.versions.duplicate(rateCardId, versionId)
  )
}
