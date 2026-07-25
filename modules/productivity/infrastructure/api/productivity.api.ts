import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, normalizeList } from '@/shared/lib/normalizeListResponse'
import { PRODUCTIVITY_ENDPOINTS } from './endpoints'
import type { SearchResponse, SearchResultItem } from '../../domain/model/search'
import type { WorkInboxItem, WorkInboxListResponse } from '../../domain/model/work-inbox'
import type { FavoriteItem, RecentItem, SavedView } from '../../domain/model/saved-items'
import type { MyWorkParams, MyWorkResponse } from '../../domain/model/my-work'
import type { MyInsightsParams, MyInsightsResponse } from '../../domain/model/my-insights'
import { MyWorkWindow } from '../../domain/enums/my-work.enum'
import {
  mapMyWorkBundleToInsights,
  resolveInsightsRange,
} from '../mappers/map-my-work-to-insights'

export async function searchGlobal(params: {
  q: string
  workspaceId?: string
  limit?: number
}): Promise<SearchResponse> {
  const res = await apiClient.get<
    SearchResponse | SearchResultItem[] | { items?: SearchResultItem[]; total?: number; query?: string }
  >(PRODUCTIVITY_ENDPOINTS.search(params))

  if (Array.isArray(res)) {
    return { items: res, total: res.length, query: params.q }
  }

  const items = normalizeList(res)
  return {
    items,
    total: typeof res?.total === 'number' ? res.total : items.length,
    query: res?.query ?? params.q,
  }
}

export async function listWorkInbox(
  workspaceId: string,
  params?: { limit?: number; offset?: number }
): Promise<WorkInboxListResponse> {
  const res = await apiClient.get<
    | WorkInboxItem[]
    | {
        items?: WorkInboxItem[]
        content?: WorkInboxItem[]
        data?: { items?: WorkInboxItem[] }
        page?: { limit: number; offset: number; total: number }
      }
  >(PRODUCTIVITY_ENDPOINTS.workInbox(workspaceId, params))

  const items = normalizeList(res)
  const page =
    !Array.isArray(res) && res?.page
      ? res.page
      : { limit: params?.limit ?? items.length, offset: params?.offset ?? 0, total: items.length }

  return { items, page }
}

export async function markWorkInboxRead(
  workspaceId: string,
  itemId: string
): Promise<void> {
  await apiClient.post<void>(PRODUCTIVITY_ENDPOINTS.markInboxRead(workspaceId, itemId), undefined, {
    parseJson: false,
  })
}

export async function getMyWork(
  workspaceId: string,
  params?: MyWorkParams
): Promise<MyWorkResponse> {
  return apiClient.get<MyWorkResponse>(PRODUCTIVITY_ENDPOINTS.myWork(workspaceId, params))
}

export async function getMyInsights(
  workspaceId: string,
  params?: MyInsightsParams
): Promise<MyInsightsResponse> {
  const { range, dateFrom, dateTo } = resolveInsightsRange(params)
  const projectId = params?.projectId
  const base = { projectId, size: 100, page: 0 } as const

  const [open, inRange, overdue, upcoming] = await Promise.all([
    getMyWork(workspaceId, {
      ...base,
      window: MyWorkWindow.AllOpen,
      includeCompleted: false,
    }),
    getMyWork(workspaceId, {
      ...base,
      window: MyWorkWindow.Custom,
      dateFrom,
      dateTo,
      includeCompleted: true,
    }),
    getMyWork(workspaceId, {
      ...base,
      window: MyWorkWindow.Overdue,
      includeCompleted: false,
    }),
    getMyWork(workspaceId, {
      ...base,
      window: MyWorkWindow.Upcoming,
      includeCompleted: false,
    }),
  ])

  return mapMyWorkBundleToInsights({
    open,
    inRange,
    overdue,
    upcoming,
    range,
    dateFrom,
    dateTo,
  })
}

export async function listFavorites(workspaceId: string): Promise<FavoriteItem[]> {
  const res = await apiClient.get<{ items?: FavoriteItem[] } | FavoriteItem[]>(
    PRODUCTIVITY_ENDPOINTS.favorites(workspaceId)
  )
  return normalizeList(res)
}

export async function listRecent(workspaceId: string): Promise<RecentItem[]> {
  const res = await apiClient.get<{ items?: RecentItem[] } | RecentItem[]>(
    PRODUCTIVITY_ENDPOINTS.recent(workspaceId)
  )
  return normalizeList(res)
}

export async function listSavedViews(workspaceId: string): Promise<SavedView[]> {
  const res = await apiClient.get<{ items?: SavedView[] } | SavedView[]>(
    PRODUCTIVITY_ENDPOINTS.savedViews(workspaceId)
  )
  return normalizeList(res)
}

export async function listSavedSearches(
  workspaceId: string
): Promise<Array<{ id: string; name?: string; query?: string }>> {
  const res = await apiClient.get<
    | { items?: Array<{ id: string; name?: string; query?: string }> }
    | Array<{ id: string; name?: string; query?: string }>
  >(PRODUCTIVITY_ENDPOINTS.savedSearches(workspaceId))
  return normalizeList(res)
}

export async function listPins(
  workspaceId: string
): Promise<Array<{ id: string; title?: string }>> {
  const res = await apiClient.get<
    { items?: Array<{ id: string; title?: string }> } | Array<{ id: string; title?: string }>
  >(PRODUCTIVITY_ENDPOINTS.pins(workspaceId))
  return normalizeList(res)
}

export async function getNavigation(
  workspaceId: string
): Promise<{ items: Array<{ id: string; label?: string }> }> {
  const res = await apiClient.get<
    | Array<{ id: string; label?: string }>
    | { items?: Array<{ id: string; label?: string }> }
  >(PRODUCTIVITY_ENDPOINTS.navigation(workspaceId))
  return normalizeItemList(res)
}

export async function getNavigationPreferences(
  workspaceId: string
): Promise<Record<string, unknown>> {
  return apiClient.get(PRODUCTIVITY_ENDPOINTS.navigationPreferences(workspaceId))
}
