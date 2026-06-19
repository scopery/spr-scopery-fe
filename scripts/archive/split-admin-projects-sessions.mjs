#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function moveModule(base, moves) {
  for (const [from, to] of moves) {
    const src = path.join(base, from)
    const dest = path.join(base, to)
    if (!fs.existsSync(src)) {
      console.warn(`SKIP: ${from}`)
      continue
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.renameSync(src, dest)
    console.log(`${path.basename(base)}: ${from} -> ${to}`)
  }
  for (const dir of ['api', 'hooks', 'model', 'ui']) {
    const p = path.join(base, dir)
    try {
      if (fs.existsSync(p) && fs.readdirSync(p).length === 0) fs.rmdirSync(p)
    } catch {}
  }
}

const projects = path.join(ROOT, 'modules/projects')
moveModule(projects, [
  ['model/project-types.ts', 'project/model/project-types.ts'],
  ['model/project.ts', 'project/model/project.ts'],
  ['api/projects.api.ts', 'project/api/projects.api.ts'],
  ['hooks/useProject.ts', 'project/hooks/useProject.ts'],
  ['hooks/useProjects.ts', 'project/hooks/useProjects.ts'],
  ['hooks/useCreateProjectModal.ts', 'project/hooks/useCreateProjectModal.ts'],
  ['ui/ProjectStepIndicator.tsx', 'project/ui/ProjectStepIndicator.tsx'],
  ['model/questions.ts', 'questions/model/questions.ts'],
  ['api/questions.api.ts', 'questions/api/questions.api.ts'],
  ['hooks/useProjectQuestions.ts', 'questions/hooks/useProjectQuestions.ts'],
  ['model/ai-questions.ts', 'questions/model/ai-questions.ts'],
  ['api/ai-questions.api.ts', 'questions/api/ai-questions.api.ts'],
  ['hooks/useAiQuestions.ts', 'questions/hooks/useAiQuestions.ts'],
  ['model/requirements.ts', 'requirements/model/requirements.ts'],
  ['api/requirements.api.ts', 'requirements/api/requirements.api.ts'],
  ['hooks/useRequirements.ts', 'requirements/hooks/useRequirements.ts'],
  ['model/traceability.ts', 'traceability/model/traceability.ts'],
  ['model/ai-impact.ts', 'ai-impact/model/ai-impact.ts'],
  ['api/ai-impact.api.ts', 'ai-impact/api/ai-impact.api.ts'],
  ['hooks/useAiImpact.ts', 'ai-impact/hooks/useAiImpact.ts'],
])

const sessions = path.join(ROOT, 'modules/sessions')
moveModule(sessions, [
  ['model/session.ts', 'session/model/session.ts'],
  ['api/sessions.api.ts', 'session/api/sessions.api.ts'],
  ['hooks/useSessions.ts', 'session/hooks/useSessions.ts'],
  ['hooks/useSessionDetail.ts', 'session/hooks/useSessionDetail.ts'],
  ['hooks/useCreateSessionModal.ts', 'session/hooks/useCreateSessionModal.ts'],
  ['ui/SessionDetailView.tsx', 'session/ui/SessionDetailView.tsx'],
  ['model/clarity.ts', 'clarity/model/clarity.ts'],
  ['api/ai-clarity.api.ts', 'clarity/api/ai-clarity.api.ts'],
  ['ui/ClarityBadge.tsx', 'clarity/ui/ClarityBadge.tsx'],
  ['ui/ClarityPanel.tsx', 'clarity/ui/ClarityPanel.tsx'],
  ['ui/ClarityDetailsModal.tsx', 'clarity/ui/ClarityDetailsModal.tsx'],
  ['model/ai-improve.ts', 'ai-improve/model/ai-improve.ts'],
  ['api/ai-improve.api.ts', 'ai-improve/api/ai-improve.api.ts'],
  ['hooks/useAiImprove.ts', 'ai-improve/hooks/useAiImprove.ts'],
  ['ui/AIImproveModal.tsx', 'ai-improve/ui/AIImproveModal.tsx'],
  ['ui/AIImproveAllModal.tsx', 'ai-improve/ui/AIImproveAllModal.tsx'],
])

const admin = path.join(ROOT, 'modules/admin')
moveModule(admin, [
  ['model/ai.ts', 'ai-config/model/ai.ts'],
  ['api/admin-ai.api.ts', 'ai-config/api/admin-ai.api.ts'],
  ['hooks/useAdminAi.ts', 'ai-config/hooks/useAdminAi.ts'],
  ['hooks/useAiRunDetail.ts', 'ai-config/hooks/useAiRunDetail.ts'],
  ['model/ai-agent-control.ts', 'ai-agents/model/ai-agent-control.ts'],
  ['api/ai-agents.api.ts', 'ai-agents/api/ai-agents.api.ts'],
  ['hooks/useAiAgents.ts', 'ai-agents/hooks/useAiAgents.ts'],
  ['ui/ai-agent-control/ai-agent-badges.tsx', 'ai-agents/ui/ai-agent-badges.tsx'],
  [
    'ui/ai-agent-control/ai-agent-usage-summary-cards.tsx',
    'ai-agents/ui/ai-agent-usage-summary-cards.tsx',
  ],
  ['model/ai-budget.ts', 'ai-budgets/model/ai-budget.ts'],
  ['api/ai-budgets.api.ts', 'ai-budgets/api/ai-budgets.api.ts'],
  ['hooks/useAiBudgets.ts', 'ai-budgets/hooks/useAiBudgets.ts'],
  ['ui/ai-agent-control/ai-budget-badges.tsx', 'ai-budgets/ui/ai-budget-badges.tsx'],
  ['model/ai-routing.ts', 'ai-routing/model/ai-routing.ts'],
  ['api/ai-routing.api.ts', 'ai-routing/api/ai-routing.api.ts'],
  ['ui/ai-agent-control/ai-agent-routing-panel.tsx', 'ai-routing/ui/ai-agent-routing-panel.tsx'],
  ['model/ai-prompt-playground.ts', 'ai-playground/model/ai-prompt-playground.ts'],
  ['api/ai-prompt-playground.api.ts', 'ai-playground/api/ai-prompt-playground.api.ts'],
  [
    'ui/ai-agent-control/ai-agent-playground-panel.tsx',
    'ai-playground/ui/ai-agent-playground-panel.tsx',
  ],
  ['model/ai-run-feedback.ts', 'ai-feedback/model/ai-run-feedback.ts'],
  ['api/ai-run-feedback.api.ts', 'ai-feedback/api/ai-run-feedback.api.ts'],
  [
    'ui/ai-agent-control/ai-run-feedback-controls.tsx',
    'ai-feedback/ui/ai-run-feedback-controls.tsx',
  ],
  ['ui/ai-agent-control/ai-agent-quality-panel.tsx', 'ai-feedback/ui/ai-agent-quality-panel.tsx'],
  ['api/admin-templates.api.ts', 'admin-templates/api/admin-templates.api.ts'],
  ['hooks/useAdminTemplates.ts', 'admin-templates/hooks/useAdminTemplates.ts'],
])

try {
  fs.rmdirSync(path.join(admin, 'ui/ai-agent-control'))
} catch {}
try {
  fs.rmdirSync(path.join(admin, 'ui'))
} catch {}

console.log('Done.')
