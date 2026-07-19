import { apiClient } from '@/shared/lib/apiClient'
import { RATE_CARD_ENDPOINTS } from './endpoints'
import type {
  PreviewTaskRatePayload,
  RateSnapshot,
  ResolveRatePayload,
  TaskRatePreview,
} from '../../domain/model/rate-resolution'

export async function resolveRate(body: ResolveRatePayload): Promise<RateSnapshot> {
  return apiClient.post<RateSnapshot>(RATE_CARD_ENDPOINTS.resolve(), body)
}

export async function previewTaskRate(body: PreviewTaskRatePayload): Promise<TaskRatePreview> {
  return apiClient.post<TaskRatePreview>(RATE_CARD_ENDPOINTS.previewTaskRate(), body)
}
