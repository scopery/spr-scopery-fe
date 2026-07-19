import { apiClient } from '@/shared/lib/apiClient'
import { PLATFORM_RELIABILITY_ENDPOINTS } from './endpoints'
import type {
  PlatformAuditEvent,
  PlatformPageResponse,
  SearchPlatformAuditEventsParams,
} from '../../domain/model/platform-reliability'

function normalizePage<T>(value: unknown): PlatformPageResponse<T> {
  if (
    value &&
    typeof value === 'object' &&
    'items' in value &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    const page = value as PlatformPageResponse<T>
    return {
      items: page.items,
      page: page.page ?? 0,
      size: page.size ?? page.items.length,
      totalElements: page.totalElements ?? page.items.length,
      totalPages: page.totalPages ?? 1,
      first: page.first ?? true,
      last: page.last ?? true,
    }
  }
  if (Array.isArray(value)) {
    return {
      items: value as T[],
      page: 0,
      size: value.length,
      totalElements: value.length,
      totalPages: 1,
      first: true,
      last: true,
    }
  }
  return {
    items: [],
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  }
}

export async function searchPlatformAuditEvents(
  params?: SearchPlatformAuditEventsParams
): Promise<PlatformPageResponse<PlatformAuditEvent>> {
  const raw = await apiClient.get<unknown>(PLATFORM_RELIABILITY_ENDPOINTS.auditEvents.search(params))
  return normalizePage<PlatformAuditEvent>(raw)
}

/**
 * BE currently exposes search only (no GET by id).
 * Detail loads a page and finds the matching event.
 */
export async function findPlatformAuditEvent(
  eventId: string
): Promise<PlatformAuditEvent | null> {
  const res = await searchPlatformAuditEvents({ page: 0, size: 100 })
  return res.items.find((e) => e.id === eventId) ?? null
}
