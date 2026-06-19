#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function moveModule(base, moves) {
  for (const [from, to] of moves) {
    const src = path.join(base, from)
    const dest = path.join(base, to)
    if (!fs.existsSync(src)) {
      console.warn(`SKIP ${path.basename(base)}: ${from}`)
      continue
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.renameSync(src, dest)
    console.log(`${path.basename(base)}: ${from} -> ${to}`)
  }
  for (const dir of ['api', 'hooks', 'model', 'ui', 'context']) {
    const p = path.join(base, dir)
    try {
      if (fs.existsSync(p) && fs.readdirSync(p).length === 0) fs.rmdirSync(p)
    } catch {}
  }
}

const M = (name, moves) => moveModule(path.join(ROOT, 'modules', name), moves)

M('governance', [
  ['api/governance.api.ts', 'policy/api/governance.api.ts'],
  ['hooks/useGovernancePolicy.ts', 'policy/hooks/useGovernancePolicy.ts'],
  ['model/governance.ts', 'policy/model/governance.ts'],
  ['model/governance-types.ts', 'policy/model/governance-types.ts'],
  ['model/governance-conditions.ts', 'policy/model/governance-conditions.ts'],
  ['model/governance-conditions.test.ts', 'policy/model/governance-conditions.test.ts'],
  ['ui/GovernanceStatusBanner.tsx', 'policy/ui/GovernanceStatusBanner.tsx'],
  ['ui/GovernanceConditionBuilder.tsx', 'policy/ui/GovernanceConditionBuilder.tsx'],
  ['ui/GovernanceConditionJsonEditor.tsx', 'policy/ui/GovernanceConditionJsonEditor.tsx'],
  ['hooks/useGovernanceSimulator.ts', 'simulator/hooks/useGovernanceSimulator.ts'],
  ['model/governance-simulator.ts', 'simulator/model/governance-simulator.ts'],
  ['ui/GovernanceSimulator.tsx', 'simulator/ui/GovernanceSimulator.tsx'],
  ['ui/GovernanceSimulatorView.tsx', 'simulator/ui/GovernanceSimulatorView.tsx'],
  ['hooks/usePresetPreviewModal.ts', 'preset-preview/hooks/usePresetPreviewModal.ts'],
  ['model/preset-preview-modal.ts', 'preset-preview/model/preset-preview-modal.ts'],
  ['ui/PresetPreviewModal.tsx', 'preset-preview/ui/PresetPreviewModal.tsx'],
  ['ui/PresetPreviewModalView.tsx', 'preset-preview/ui/PresetPreviewModalView.tsx'],
])

M('org', [
  ['api/org.api.ts', 'org/api/org.api.ts'],
  ['hooks/useOrg.ts', 'org/hooks/useOrg.ts'],
  ['hooks/useOrgActions.ts', 'org/hooks/useOrgActions.ts'],
  ['hooks/useOrgMembers.ts', 'org/hooks/useOrgMembers.ts'],
  ['model/org.ts', 'org/model/org.ts'],
  ['api/org-invites.api.ts', 'invites/api/org-invites.api.ts'],
  ['hooks/useOrgInvites.ts', 'invites/hooks/useOrgInvites.ts'],
  ['hooks/useOrgInviteActions.ts', 'invites/hooks/useOrgInviteActions.ts'],
  ['hooks/useCreateInviteModal.ts', 'invites/hooks/useCreateInviteModal.ts'],
  ['model/org-invite.ts', 'invites/model/org-invite.ts'],
])

M('auth', [
  ['api/auth.api.ts', 'auth/api/auth.api.ts'],
  ['context/AuthContext.tsx', 'auth/context/AuthContext.tsx'],
  ['hooks/useAuthActions.ts', 'auth/hooks/useAuthActions.ts'],
  ['model/auth.ts', 'auth/model/auth.ts'],
  ['model/auth-types.ts', 'auth/model/auth-types.ts'],
  ['api/profile.api.ts', 'profile/api/profile.api.ts'],
  ['hooks/useProfile.ts', 'profile/hooks/useProfile.ts'],
])

M('collaboration', [
  ['api/collaboration.api.ts', 'core/api/collaboration.api.ts'],
  ['model/collaboration-types.ts', 'core/model/collaboration-types.ts'],
  ['model/collaboration.ts', 'core/model/collaboration.ts'],
  ['ui/DocumentCollaborationPanel.tsx', 'panel/ui/DocumentCollaborationPanel.tsx'],
  ['ui/DocumentCommentsPanel.tsx', 'comments/ui/DocumentCommentsPanel.tsx'],
  ['ui/DocumentCommentThread.tsx', 'comments/ui/DocumentCommentThread.tsx'],
  ['ui/MentionUserPicker.tsx', 'comments/ui/MentionUserPicker.tsx'],
  ['ui/DocumentSuggestionsPanel.tsx', 'suggestions/ui/DocumentSuggestionsPanel.tsx'],
  ['ui/DocumentActivityPanel.tsx', 'activity/ui/DocumentActivityPanel.tsx'],
  ['ui/ShareDocumentDialog.tsx', 'sharing/ui/ShareDocumentDialog.tsx'],
])

M('controlled-lists', [
  ['api/controlled-lists.api.ts', 'lists/api/controlled-lists.api.ts'],
  ['hooks/useControlledLists.ts', 'lists/hooks/useControlledLists.ts'],
  ['hooks/useControlledListDetail.ts', 'lists/hooks/useControlledListDetail.ts'],
  ['model/controlled-lists-types.ts', 'lists/model/controlled-lists-types.ts'],
  ['model/controlled-lists.ts', 'lists/model/controlled-lists.ts'],
  ['api/controlled-values.api.ts', 'values/api/controlled-values.api.ts'],
  ['hooks/useControlledValues.ts', 'values/hooks/useControlledValues.ts'],
])

M('permissions', [
  ['api/access.api.ts', 'access/api/access.api.ts'],
  ['hooks/useEffectivePermissions.ts', 'access/hooks/useEffectivePermissions.ts'],
  ['model/permissions-types.ts', 'access/model/permissions-types.ts'],
  ['model/permissions.ts', 'access/model/permissions.ts'],
])

M('ai-agent-control', [
  ['api/agent-control.api.ts', 'agent-control/api/agent-control.api.ts'],
  ['hooks/useAgentControl.ts', 'agent-control/hooks/useAgentControl.ts'],
  ['model/agent-control-types.ts', 'agent-control/model/agent-control-types.ts'],
  ['model/agent-control.ts', 'agent-control/model/agent-control.ts'],
  ['ui/AgentControlView.tsx', 'agent-control/ui/AgentControlView.tsx'],
  ['ui/PromptRegistryPanel.tsx', 'prompt-registry/ui/PromptRegistryPanel.tsx'],
  ['ui/RuntimeUsagePanel.tsx', 'runtime/ui/RuntimeUsagePanel.tsx'],
])

M('ai-document-intelligence', [
  ['api/ai-document-intelligence.api.ts', 'document-ai/api/ai-document-intelligence.api.ts'],
  ['model/ai-document-intelligence.ts', 'document-ai/model/ai-document-intelligence.ts'],
  ['ui/DocumentAIPanel.tsx', 'document-ai/ui/DocumentAIPanel.tsx'],
  ['ui/AIPreviewDialog.tsx', 'document-ai/ui/AIPreviewDialog.tsx'],
  ['ui/AIGeneratedBadge.tsx', 'document-ai/ui/AIGeneratedBadge.tsx'],
  ['ui/RelatedDocumentsPanel.tsx', 'related-documents/ui/RelatedDocumentsPanel.tsx'],
  ['ui/ProjectAIActionsMenu.tsx', 'project-ai/ui/ProjectAIActionsMenu.tsx'],
])

M('platform', [
  ['ui/layout/AppShell.tsx', 'layout/ui/AppShell.tsx'],
  ['ui/layout/AdminShell.tsx', 'layout/ui/AdminShell.tsx'],
  ['ui/layout/HelpGuideModal.tsx', 'layout/ui/HelpGuideModal.tsx'],
  ['ui/guards/AuthGuard.tsx', 'guards/ui/AuthGuard.tsx'],
])

M('landscape', [
  ['api/landscape.api.ts', 'landscape/api/landscape.api.ts'],
  ['model/landscape.ts', 'landscape/model/landscape.ts'],
])

console.log('All modules split.')
