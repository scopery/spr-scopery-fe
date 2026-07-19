import type { SearchResultKind } from '../enums/productivity.enum'

export interface SearchResultItem {
  id: string
  kind: SearchResultKind | string
  title: string
  subtitle?: string | null
  href?: string | null
  workspaceId?: string | null
  projectId?: string | null
}

export interface SearchResponse {
  items: SearchResultItem[]
  total: number
  query: string
}

export interface CommandPaletteAction {
  id: string
  label: string
  group: string
  href?: string
  keywords?: string[]
}
