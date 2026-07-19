import { apiClient } from '@/shared/lib/apiClient'
import { RATE_CARD_ENDPOINTS } from './endpoints'
import type {
  CreateRateCardLinePayload,
  RateCardLine,
  UpdateRateCardLinePayload,
} from '../../domain/model/rate-card-line'

export async function listRateCardLines(
  rateCardId: string,
  versionId: string
): Promise<RateCardLine[]> {
  return apiClient.get<RateCardLine[]>(RATE_CARD_ENDPOINTS.lines.list(rateCardId, versionId))
}

export async function getRateCardLine(
  rateCardId: string,
  versionId: string,
  lineId: string
): Promise<RateCardLine> {
  return apiClient.get<RateCardLine>(
    RATE_CARD_ENDPOINTS.lines.get(rateCardId, versionId, lineId)
  )
}

export async function createRateCardLine(
  rateCardId: string,
  versionId: string,
  body: CreateRateCardLinePayload
): Promise<RateCardLine> {
  return apiClient.post<RateCardLine>(
    RATE_CARD_ENDPOINTS.lines.create(rateCardId, versionId),
    body
  )
}

export async function updateRateCardLine(
  rateCardId: string,
  versionId: string,
  lineId: string,
  body: UpdateRateCardLinePayload
): Promise<RateCardLine> {
  return apiClient.put<RateCardLine>(
    RATE_CARD_ENDPOINTS.lines.update(rateCardId, versionId, lineId),
    body
  )
}

export async function deleteRateCardLine(
  rateCardId: string,
  versionId: string,
  lineId: string
): Promise<void> {
  await apiClient.delete<void>(RATE_CARD_ENDPOINTS.lines.delete(rateCardId, versionId, lineId), {
    parseJson: false,
  })
}
