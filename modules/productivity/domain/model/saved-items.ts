export interface FavoriteItem {
  id: string
  entityType: string
  entityId: string
  title: string
  href?: string | null
  createdAt: string
}

export interface RecentItem {
  id: string
  entityType: string
  entityId: string
  title: string
  href?: string | null
  viewedAt: string
}

export interface SavedView {
  id: string
  name: string
  scope: string
  config: Record<string, unknown>
  createdAt: string
}
