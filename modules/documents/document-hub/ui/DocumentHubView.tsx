'use client'

import { Button, Modal, Select, Typography } from '@/shared/ui'
import {
  CreateDeliverableDialog,
  CreateDocumentModal,
} from '@/modules/documents'
import { DocumentHubExportDialog } from './DocumentHubExportDialog'
import { DocumentHubHeader } from './DocumentHubHeader'
import { DocumentHubSelectionBar } from './DocumentHubSelectionBar'
import { DocumentHubFilters } from './DocumentHubFilters'
import { DocumentHubDocumentList } from './DocumentHubDocumentList'
import type { DocumentHubViewProps } from '../model/document-hub'
import { useDocumentHub } from '../hooks/useDocumentHub'

export function DocumentHubView({
  orgId,
  defaultProjectId,
  canCreateDocument,
  canCreateFromTemplate = true,
  canRestoreDocument = false,
  canExportDocuments = false,
}: DocumentHubViewProps) {
  const hub = useDocumentHub({
    orgId,
    defaultProjectId,
    canCreateDocument,
    canCreateFromTemplate,
  })

  return (
    <div className="space-y-6">
      <DocumentHubHeader
        canCreateDocument={!!canCreateDocument}
        canExportDocuments={canExportDocuments}
        canCreateDeliverable={hub.canCreateDeliverable}
        selectedCount={hub.selectedIds.size}
        totalCount={hub.totalCount}
        deliverableLoading={hub.deliverableLoading}
        onCreate={hub.openCreateFlow}
        onExport={() => hub.setExportOpen(true)}
        onDeliverable={() => void hub.openDeliverableFlow()}
      />

      {canExportDocuments && (hub.selectedIds.size > 0 || hub.selectionMode === 'filtered_all') && (
        <DocumentHubSelectionBar
          selectionMode={hub.selectionMode}
          selectedCount={hub.selectedIds.size}
          totalCount={hub.totalCount}
          canSelectAllFiltered={hub.canSelectAllFiltered}
          canCreateDeliverable={hub.canCreateDeliverable}
          deliverableLoading={hub.deliverableLoading}
          onSelectAllFiltered={hub.selectAllFiltered}
          onClearSelection={hub.clearSelection}
          onExport={() => hub.setExportOpen(true)}
          onDeliverable={() => void hub.openDeliverableFlow()}
        />
      )}

      <DocumentHubFilters
        search={hub.search}
        onSearchChange={hub.setSearch}
        projectId={hub.projectId}
        onProjectIdChange={hub.setProjectId}
        documentType={hub.documentType}
        onDocumentTypeChange={hub.setDocumentType}
        originType={hub.originType}
        onOriginTypeChange={hub.setOriginType}
        aiOnly={hub.aiOnly}
        onAiOnlyChange={hub.setAiOnly}
        lifecycleStatus={hub.lifecycleStatus}
        onLifecycleStatusChange={hub.setLifecycleStatus}
        workflowStatus={hub.workflowStatus}
        onWorkflowStatusChange={hub.setWorkflowStatus}
        projects={hub.projects}
      />

      <DocumentHubDocumentList
        orgId={orgId}
        items={hub.items}
        loading={hub.loading}
        canCreateDocument={!!canCreateDocument}
        canExportDocuments={canExportDocuments}
        canRestoreDocument={canRestoreDocument}
        selectionMode={hub.selectionMode}
        selectedIds={hub.selectedIds}
        totalCount={hub.totalCount}
        allVisibleSelected={hub.allVisibleSelected}
        restoringId={hub.restoringId}
        onCreate={hub.openCreateFlow}
        onToggleSelectAllVisible={hub.toggleSelectAllVisible}
        onToggleSelect={hub.toggleSelect}
        onRestoreDocument={hub.handleRestoreDocument}
      />

      <Modal
        open={hub.pickProjectOpen}
        onClose={hub.closePickProjectModal}
        title="Choose project"
        size="sm"
      >
        <div className="space-y-4">
          <Typography variant="small" tone="muted">
            {hub.pickProjectForDeliverable
              ? 'Select the project context for deliverable generation.'
              : 'Documents belong to a project. Select where to create this document.'}
          </Typography>
          <Select
            label="Project"
            value={hub.pendingCreateProjectId}
            onValueChange={hub.setPendingCreateProjectId}
            options={hub.projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={hub.closePickProjectModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={
                hub.pickProjectForDeliverable
                  ? hub.confirmProjectForDeliverable
                  : hub.confirmProjectForCreate
              }
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {hub.createProjectId && (
        <CreateDocumentModal
          orgId={orgId}
          projectId={hub.createProjectId}
          open={hub.createOpen}
          onClose={() => hub.setCreateOpen(false)}
          onSuccess={hub.handleCreateSuccess}
          canCreateFromTemplate={canCreateFromTemplate}
        />
      )}

      {hub.deliverableProjectId ? (
        <CreateDeliverableDialog
          orgId={orgId}
          projectId={hub.deliverableProjectId}
          open={hub.deliverableOpen}
          onClose={() => hub.setDeliverableOpen(false)}
          onSuccess={hub.handleDeliverableSuccess}
          entryContext="document_hub"
          initialSelectedDocumentIds={hub.deliverableSelectedIds}
          selectedDocumentTitles={hub.deliverableSelectedTitles}
        />
      ) : null}

      {canExportDocuments && (
        <DocumentHubExportDialog
          open={hub.exportOpen}
          onClose={() => hub.setExportOpen(false)}
          orgId={orgId}
          selectionMode={hub.selectionMode}
          selectedCount={hub.selectedIds.size}
          totalCount={hub.totalCount}
          filters={hub.currentFilters()}
          documentIds={[...hub.selectedIds]}
          lifecycleStatus={hub.lifecycleStatus}
          loading={hub.exportLoading}
          onExport={hub.runHubExport}
        />
      )}
    </div>
  )
}
