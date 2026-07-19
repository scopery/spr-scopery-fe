/** Public facade — app imports only from here.
 * Heavy native editor / Plate surfaces live under `./native-content` and
 * `./document/ui/editor` — prefer subpath or next/dynamic for those. */
export * from './document'
export * from './document-templates'
export * from './document-links'
export * from './deliverables'
export * from './evidence-documents'
export * from './document-hub'
export * from './project-sections'
/* native-content omitted from eager facade — import via @/modules/documents/native-content */

/** Heavy Plate editor surfaces — kept off the light `document/` barrel for faster hub compiles. */
export { DocumentEditor } from './document/ui/DocumentEditor'
export { OrgDocumentDetailView } from './document/ui/OrgDocumentDetailView'

export * as projectDocumentsApi from './project-sections/api/project-documents.api'
export * as documentTemplatesApi from './document-templates/api/document-templates.api'
export * as documentLinksApi from './document-links/api/document-links.api'
export * as deliverablesApi from './deliverables/api/deliverables.api'
export * as documentsApi from './document/api/documents.api'
export * as documentExportApi from './document-export/api/document-export.api'
