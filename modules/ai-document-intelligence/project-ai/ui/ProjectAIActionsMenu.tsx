'use client'

import { Sparkles } from 'lucide-react'
import { Button, Modal, Select } from '@/shared/ui'
import type { ProjectAIActionsMenuProps } from '@/modules/ai-document-intelligence/document-ai/model/ai-document-intelligence'
import { AIPreviewDialog } from '@/modules/ai-document-intelligence/document-ai/ui/AIPreviewDialog'
import { useProjectAIActionsMenu } from '../hooks/useProjectAIActionsMenu'

export function ProjectAIActionsMenu({ orgId, projectId, permissions }: ProjectAIActionsMenuProps) {
  const menu = useProjectAIActionsMenu({ orgId, projectId })

  const hasAny =
    permissions.canGenerateProjectBrief ||
    permissions.canSummarizeProjectDocuments ||
    permissions.canSaveQASummary ||
    permissions.canSaveClarityReport ||
    permissions.canSaveReadinessReport

  if (!hasAny) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={<Sparkles size={16} />}
        onClick={() => menu.setMenuOpen(true)}
      >
        AI actions
      </Button>

      <Modal
        open={menu.menuOpen}
        onClose={() => menu.setMenuOpen(false)}
        title="AI document actions"
        size="sm"
      >
        <div className="flex flex-col gap-2">
          {permissions.canGenerateProjectBrief && (
            <Button variant="ghost" className="justify-start" onClick={() => void menu.runProjectBrief()}>
              Generate project brief
            </Button>
          )}
          {permissions.canSummarizeProjectDocuments && (
            <Button variant="ghost" className="justify-start" onClick={() => void menu.runSummarizeDocuments()}>
              Summarize project documents
            </Button>
          )}
          {permissions.canSaveQASummary && (
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                menu.setMenuOpen(false)
                menu.setSessionDialog('qa')
              }}
            >
              Save QA summary as document
            </Button>
          )}
          {permissions.canSaveClarityReport && (
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                menu.setMenuOpen(false)
                menu.setSessionDialog('clarity')
              }}
            >
              Save clarity report as document
            </Button>
          )}
          {permissions.canSaveReadinessReport && (
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                menu.setMenuOpen(false)
                menu.setSessionDialog('readiness')
              }}
            >
              Save readiness report as document
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(menu.sessionDialog)}
        onClose={() => menu.setSessionDialog(null)}
        title={
          menu.sessionDialog === 'qa'
            ? 'Save QA summary'
            : menu.sessionDialog === 'clarity'
              ? 'Save clarity report'
              : 'Save readiness report'
        }
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Session"
            value={menu.sessionId}
            onValueChange={menu.setSessionId}
            options={[
              { value: '', label: 'Select a session' },
              ...menu.sessions.map((s) => ({ value: s.id, label: `${s.name} (${s.status})` })),
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => menu.setSessionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={menu.loading}
              disabled={!menu.sessionId}
              onClick={() => void menu.runSessionReport()}
            >
              Create document
            </Button>
          </div>
        </div>
      </Modal>

      <AIPreviewDialog
        open={menu.previewOpen}
        onOpenChange={menu.setPreviewOpen}
        preview={menu.preview}
        warnings={menu.warnings}
        loading={menu.loading && !menu.preview}
        onSave={menu.generationId ? () => void menu.savePreview() : undefined}
      />
    </>
  )
}
