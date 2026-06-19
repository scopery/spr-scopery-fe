export { DocumentLinksPanel } from './ui/DocumentLinksPanel'
export { AddDocumentLinkDialog } from './ui/AddDocumentLinkDialog'
export type { AddDocumentLinkDialogProps, DocumentLinksPanelProps } from './model/document-links'
export type {
  DocumentLink,
  DocumentLinkedEntityType,
  DocumentRelationType,
  LinkedDocumentForEntity,
} from './model/document-link-types'
export {
  DOCUMENT_RELATION_LABELS,
  DOCUMENT_RELATION_OPTIONS,
  DOCUMENT_LINK_ENTITY_OPTIONS,
  DOCUMENT_LINKED_ENTITY_LABELS,
} from './model/document-link-types'
export * as documentLinksApi from './api/document-links.api'
