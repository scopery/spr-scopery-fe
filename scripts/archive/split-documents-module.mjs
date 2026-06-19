#!/usr/bin/env node
/**
 * Split modules/documents flat structure into nested sub-modules.
 * Run from repo root: node scripts/split-documents-module.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DOC = path.join(ROOT, 'modules/documents')

const MOVES = [
  // document (core)
  ['model/document.ts', 'document/model/document.ts'],
  ['model/document-editor.ts', 'document/model/document-editor.ts'],
  ['model/create-document-modal.ts', 'document/model/create-document-modal.ts'],
  ['model/attach-document-modal.ts', 'document/model/attach-document-modal.ts'],
  ['model/project-document-card.ts', 'document/model/project-document-card.ts'],
  ['api/documents.api.ts', 'document/api/documents.api.ts'],
  ['api/document-detail.api.ts', 'document/api/document-detail.api.ts'],
  ['api/create-document-modal.api.ts', 'document/api/create-document-modal.api.ts'],
  ['api/attach-document-modal.api.ts', 'document/api/attach-document-modal.api.ts'],
  ['api/attach-document-modal.mapper.ts', 'document/api/attach-document-modal.mapper.ts'],
  ['hooks/useDocument.ts', 'document/hooks/useDocument.ts'],
  ['hooks/useDocumentEditor.ts', 'document/hooks/useDocumentEditor.ts'],
  ['hooks/useCreateDocumentModal.ts', 'document/hooks/useCreateDocumentModal.ts'],
  ['hooks/useAttachDocumentModal.ts', 'document/hooks/useAttachDocumentModal.ts'],
  ['ui/DocumentEditor.tsx', 'document/ui/DocumentEditor.tsx'],
  ['ui/CreateDocumentModal.tsx', 'document/ui/CreateDocumentModal.tsx'],
  ['ui/CreateDocumentModalView.tsx', 'document/ui/CreateDocumentModalView.tsx'],
  ['ui/AttachDocumentModal.tsx', 'document/ui/AttachDocumentModal.tsx'],
  ['ui/AttachDocumentModalView.tsx', 'document/ui/AttachDocumentModalView.tsx'],
  ['ui/EmptyDocumentsState.tsx', 'document/ui/EmptyDocumentsState.tsx'],
  ['ui/DocumentTypeBadge.tsx', 'document/ui/DocumentTypeBadge.tsx'],
  ['ui/DocumentVisibilityBadge.tsx', 'document/ui/DocumentVisibilityBadge.tsx'],
  ['ui/WorkflowStatusBadge.tsx', 'document/ui/WorkflowStatusBadge.tsx'],
  ['ui/editor', 'document/ui/editor'],
  // document-templates
  ['model/document-template-types.ts', 'document-templates/model/document-template-types.ts'],
  ['model/document-templates.ts', 'document-templates/model/document-templates.ts'],
  ['model/template-variables', 'document-templates/model/template-variables'],
  ['api/document-templates.api.ts', 'document-templates/api/document-templates.api.ts'],
  ['hooks/useDocumentTemplates.ts', 'document-templates/hooks/useDocumentTemplates.ts'],
  ['ui/TemplateEditor.tsx', 'document-templates/ui/TemplateEditor.tsx'],
  ['ui/TemplateVariablePanel.tsx', 'document-templates/ui/TemplateVariablePanel.tsx'],
  ['ui/TemplatePreviewDialog.tsx', 'document-templates/ui/TemplatePreviewDialog.tsx'],
  ['ui/TemplatePicker.tsx', 'document-templates/ui/TemplatePicker.tsx'],
  ['ui/TemplateVariableWarnings.tsx', 'document-templates/ui/TemplateVariableWarnings.tsx'],
  ['ui/TemplateCard.tsx', 'document-templates/ui/TemplateCard.tsx'],
  ['ui/TemplateStatusBadge.tsx', 'document-templates/ui/TemplateStatusBadge.tsx'],
  ['ui/TemplateScopeBadge.tsx', 'document-templates/ui/TemplateScopeBadge.tsx'],
  ['ui/TemplateCategoryBadge.tsx', 'document-templates/ui/TemplateCategoryBadge.tsx'],
  // document-links
  ['model/document-link-types.ts', 'document-links/model/document-link-types.ts'],
  ['model/document-links.ts', 'document-links/model/document-links.ts'],
  ['api/document-links.api.ts', 'document-links/api/document-links.api.ts'],
  ['hooks/useDocumentLinksPanel.ts', 'document-links/hooks/useDocumentLinksPanel.ts'],
  ['hooks/useAddDocumentLinkDialog.ts', 'document-links/hooks/useAddDocumentLinkDialog.ts'],
  ['ui/DocumentLinksPanelView.tsx', 'document-links/ui/DocumentLinksPanelView.tsx'],
  ['ui/DocumentLinksPanel.tsx', 'document-links/ui/DocumentLinksPanel.tsx'],
  ['ui/AddDocumentLinkDialogView.tsx', 'document-links/ui/AddDocumentLinkDialogView.tsx'],
  ['ui/AddDocumentLinkDialog.tsx', 'document-links/ui/AddDocumentLinkDialog.tsx'],
  // deliverables
  ['model/document-deliverable-types.ts', 'deliverables/model/document-deliverable-types.ts'],
  ['model/deliverables.ts', 'deliverables/model/deliverables.ts'],
  ['model/create-deliverable-dialog.ts', 'deliverables/model/create-deliverable-dialog.ts'],
  [
    'model/deliverable-document-set-picker.ts',
    'deliverables/model/deliverable-document-set-picker.ts',
  ],
  ['api/deliverables.api.ts', 'deliverables/api/deliverables.api.ts'],
  ['api/deliverables.mapper.ts', 'deliverables/api/deliverables.mapper.ts'],
  ['api/create-deliverable-dialog.api.ts', 'deliverables/api/create-deliverable-dialog.api.ts'],
  [
    'api/create-deliverable-dialog.mapper.ts',
    'deliverables/api/create-deliverable-dialog.mapper.ts',
  ],
  ['hooks/useCreateDeliverableDialog.ts', 'deliverables/hooks/useCreateDeliverableDialog.ts'],
  [
    'hooks/useDocumentDeliverableMetadataPanel.ts',
    'deliverables/hooks/useDocumentDeliverableMetadataPanel.ts',
  ],
  [
    'hooks/useDeliverableDocumentSetPicker.ts',
    'deliverables/hooks/useDeliverableDocumentSetPicker.ts',
  ],
  ['hooks/useDeliverableHistoryPanel.ts', 'deliverables/hooks/useDeliverableHistoryPanel.ts'],
  ['ui/DeliverableReadinessBadge.tsx', 'deliverables/ui/DeliverableReadinessBadge.tsx'],
  ['ui/DeliverableReadinessWarnings.tsx', 'deliverables/ui/DeliverableReadinessWarnings.tsx'],
  [
    'ui/DeliverableReadinessWarnings.test.tsx',
    'deliverables/ui/DeliverableReadinessWarnings.test.tsx',
  ],
  ['ui/DeliverableDocumentSetSummary.tsx', 'deliverables/ui/DeliverableDocumentSetSummary.tsx'],
  ['ui/DeliverableDocumentSetPicker.tsx', 'deliverables/ui/DeliverableDocumentSetPicker.tsx'],
  [
    'ui/DeliverableDocumentSetPickerView.tsx',
    'deliverables/ui/DeliverableDocumentSetPickerView.tsx',
  ],
  [
    'ui/DeliverableDocumentSetPicker.test.tsx',
    'deliverables/ui/DeliverableDocumentSetPicker.test.tsx',
  ],
  ['ui/DeliverableHistoryPanel.tsx', 'deliverables/ui/DeliverableHistoryPanel.tsx'],
  ['ui/DeliverableHistoryPanelView.tsx', 'deliverables/ui/DeliverableHistoryPanelView.tsx'],
  ['ui/DeliverableHistoryPanel.test.tsx', 'deliverables/ui/DeliverableHistoryPanel.test.tsx'],
  [
    'ui/DocumentDeliverableMetadataPanel.tsx',
    'deliverables/ui/DocumentDeliverableMetadataPanel.tsx',
  ],
  [
    'ui/DocumentDeliverableMetadataPanelView.tsx',
    'deliverables/ui/DocumentDeliverableMetadataPanelView.tsx',
  ],
  [
    'ui/DocumentDeliverableMetadataPanel.test.tsx',
    'deliverables/ui/DocumentDeliverableMetadataPanel.test.tsx',
  ],
  ['ui/CreateDeliverableDialog.tsx', 'deliverables/ui/CreateDeliverableDialog.tsx'],
  ['ui/CreateDeliverableDialogView.tsx', 'deliverables/ui/CreateDeliverableDialogView.tsx'],
  // evidence-documents
  ['model/evidence-documents.ts', 'evidence-documents/model/evidence-documents.ts'],
  ['api/evidence-documents.api.ts', 'evidence-documents/api/evidence-documents.api.ts'],
  [
    'hooks/useEntityEvidenceDocumentsPanel.ts',
    'evidence-documents/hooks/useEntityEvidenceDocumentsPanel.ts',
  ],
  [
    'hooks/useAddEvidenceDocumentDialog.ts',
    'evidence-documents/hooks/useAddEvidenceDocumentDialog.ts',
  ],
  [
    'hooks/useBulkLinkEvidenceDocumentsDialog.ts',
    'evidence-documents/hooks/useBulkLinkEvidenceDocumentsDialog.ts',
  ],
  ['ui/EntityEvidenceDocumentsPanel.tsx', 'evidence-documents/ui/EntityEvidenceDocumentsPanel.tsx'],
  ['ui/AddEvidenceDocumentDialog.tsx', 'evidence-documents/ui/AddEvidenceDocumentDialog.tsx'],
  [
    'ui/BulkLinkEvidenceDocumentsDialog.tsx',
    'evidence-documents/ui/BulkLinkEvidenceDocumentsDialog.tsx',
  ],
  ['ui/AnswerEvidenceStrip.tsx', 'evidence-documents/ui/AnswerEvidenceStrip.tsx'],
  // document-hub
  ['model/document-hub.ts', 'document-hub/model/document-hub.ts'],
  ['api/document-hub.api.ts', 'document-hub/api/document-hub.api.ts'],
  ['ui/DocumentHubView.tsx', 'document-hub/ui/DocumentHubView.tsx'],
  ['ui/DocumentHubExportDialog.tsx', 'document-hub/ui/DocumentHubExportDialog.tsx'],
  // project-sections
  ['model/project-section-types.ts', 'project-sections/model/project-section-types.ts'],
  ['model/project-sections.ts', 'project-sections/model/project-sections.ts'],
  ['model/project-documents.ts', 'project-sections/model/project-documents.ts'],
  ['api/project-sections.api.ts', 'project-sections/api/project-sections.api.ts'],
  ['api/project-documents.api.ts', 'project-sections/api/project-documents.api.ts'],
  ['hooks/useProjectDocuments.ts', 'project-sections/hooks/useProjectDocuments.ts'],
  ['ui/ProjectDocumentCard.tsx', 'project-sections/ui/ProjectDocumentCard.tsx'],
  ['ui/ProjectSectionGroup.tsx', 'project-sections/ui/ProjectSectionGroup.tsx'],
  ['ui/SectionFormDialog.tsx', 'project-sections/ui/SectionFormDialog.tsx'],
  ['ui/MoveDocumentToSectionDialog.tsx', 'project-sections/ui/MoveDocumentToSectionDialog.tsx'],
  // document-export
  ['api/document-export.api.ts', 'document-export/api/document-export.api.ts'],
]

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function moveFile(from, to) {
  const src = path.join(DOC, from)
  const dest = path.join(DOC, to)
  if (!fs.existsSync(src)) {
    console.warn(`SKIP (missing): ${from}`)
    return
  }
  ensureDir(dest)
  fs.renameSync(src, dest)
  console.log(`MOVED: ${from} -> ${to}`)
}

// Phase 1: move files
for (const [from, to] of MOVES) {
  moveFile(from, to)
}

// Remove empty legacy dirs
for (const dir of ['api', 'hooks', 'model', 'ui']) {
  const p = path.join(DOC, dir)
  try {
    if (fs.existsSync(p) && fs.readdirSync(p).length === 0) fs.rmdirSync(p)
  } catch {
    /* ignore */
  }
}

console.log('\nPhase 1 complete. Run fix-imports separately.')
