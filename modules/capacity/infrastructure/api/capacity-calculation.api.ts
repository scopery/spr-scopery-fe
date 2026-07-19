import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import {
  mapCapacityOverview,
  mapOverAllocationItem,
} from '../mappers/capacity-overview.mapper'
import type {
  CalculateCapacityPayload,
  CapacityCalculation,
  CapacityOverview,
  OverAllocationItem,
  UserAvailability,
} from '../../domain/model/capacity-overview'

export async function getWorkspaceCapacityOverview(
  workspaceId: string,
  params: { fromDate: string; toDate: string }
): Promise<CapacityOverview> {
  const raw = await apiClient.get<Record<string, unknown>>(
    CAPACITY_ENDPOINTS.calculation.overview(workspaceId, params)
  )
  return mapCapacityOverview(raw, workspaceId, params.fromDate, params.toDate)
}

export async function listOverAllocations(params: {
  workspaceId: string
  fromDate: string
  toDate: string
}): Promise<OverAllocationItem[]> {
  const raw = await apiClient.get<
    OverAllocationItem[] | { items: Record<string, unknown>[] } | Record<string, unknown>[]
  >(CAPACITY_ENDPOINTS.calculation.overAllocations(params))

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: Record<string, unknown>[] }).items
      : []

  return list.map((item) =>
    mapOverAllocationItem(item as unknown as Record<string, unknown>)
  )
}

export async function calculateCapacity(
  workspaceId: string,
  body: CalculateCapacityPayload
): Promise<CapacityCalculation> {
  return apiClient.post<CapacityCalculation>(
    CAPACITY_ENDPOINTS.calculation.calculate(workspaceId),
    body
  )
}

export async function getUserAvailability(
  userId: string,
  params: { workspaceId: string; fromDate: string; toDate: string }
): Promise<UserAvailability> {
  return apiClient.get<UserAvailability>(
    CAPACITY_ENDPOINTS.calculation.userAvailability(userId, params)
  )
}
