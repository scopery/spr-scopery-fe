/** Collaboration bounded-context facade. */

export { DocumentCollaborationPanel } from './panel/ui/DocumentCollaborationPanel'
export { DocumentCommentsPanel } from './comments/ui/DocumentCommentsPanel'
export { DocumentActivityPanel } from './activity/ui/DocumentActivityPanel'
export { DocumentSuggestionsPanel } from './suggestions/ui/DocumentSuggestionsPanel'
export { ShareDocumentDialog } from './sharing/ui/ShareDocumentDialog'

export type { CollaborationPermissions } from './core/model/collaboration-types'
export type { DocumentCollaborationPanelProps } from './core/model/collaboration'
export * from './core/hooks'
export * as collaborationApi from './core/api/collaboration.api'
