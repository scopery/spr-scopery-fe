import { apiClient } from '@/shared/lib/apiClient'
import { RATE_CARD_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CreateRateCardPayload,
  RateCard,
  RateCardSearchParams,
  UpdateRateCardPayload,
} from '../../domain/model/rate-card'

export async function listRateCards(
  params?: RateCardSearchParams
): Promise<PageResponse<RateCard>> {
  return apiClient.get<PageResponse<RateCard>>(RATE_CARD_ENDPOINTS.cards.list(params))
}

export async function getRateCard(rateCardId: string): Promise<RateCard> {
  return apiClient.get<RateCard>(RATE_CARD_ENDPOINTS.cards.get(rateCardId))
}

export async function createRateCard(body: CreateRateCardPayload): Promise<RateCard> {
  return apiClient.post<RateCard>(RATE_CARD_ENDPOINTS.cards.create(), body)
}

export async function updateRateCard(
  rateCardId: string,
  body: UpdateRateCardPayload
): Promise<RateCard> {
  return apiClient.put<RateCard>(RATE_CARD_ENDPOINTS.cards.update(rateCardId), body)
}

export async function activateRateCard(rateCardId: string): Promise<RateCard> {
  return apiClient.patch<RateCard>(RATE_CARD_ENDPOINTS.cards.activate(rateCardId))
}

export async function deactivateRateCard(rateCardId: string): Promise<RateCard> {
  return apiClient.patch<RateCard>(RATE_CARD_ENDPOINTS.cards.deactivate(rateCardId))
}

export async function archiveRateCard(rateCardId: string): Promise<RateCard> {
  return apiClient.patch<RateCard>(RATE_CARD_ENDPOINTS.cards.archive(rateCardId))
}
