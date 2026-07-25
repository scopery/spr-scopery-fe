/** Productivity bounded-context facade. */

export { useGlobalSearch } from './presentation/hooks/useGlobalSearch'
export { GlobalSearchView } from './presentation/ui/GlobalSearchView'
export { WorkInboxView } from './presentation/ui/WorkInboxView'
export { SavedItemsView } from './presentation/ui/SavedItemsView'
export { MyWorkView } from './presentation/ui/MyWorkView'
export { MyInsightsView } from './presentation/ui/MyInsightsView'
export { useMyWork } from './presentation/hooks/useMyWork'
export { useMyInsights } from './presentation/hooks/useMyInsights'
export { MyWorkWindow } from './domain/enums/my-work.enum'
export type {
  MyWorkResponse,
  MyWorkTaskItem,
  MyWorkSummary,
  MyWorkParams,
} from './domain/model/my-work'
export type {
  MyInsightsResponse,
  MyInsightsParams,
  MyInsightsSummary,
} from './domain/model/my-insights'
export * as productivityApi from './infrastructure/api/productivity.api'
