/** Productivity bounded-context facade. */

export { useGlobalSearch } from './presentation/hooks/useGlobalSearch'
export { GlobalSearchView } from './presentation/ui/GlobalSearchView'
export { WorkInboxView } from './presentation/ui/WorkInboxView'
export { SavedItemsView } from './presentation/ui/SavedItemsView'
export * as productivityApi from './infrastructure/api/productivity.api'
