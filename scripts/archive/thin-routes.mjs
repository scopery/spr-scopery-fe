#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const routes = [
  {
    page: 'app/admin/ai-budgets/page.tsx',
    view: 'modules/admin/ai-budgets/ui/AiBudgetsView.tsx',
    export: 'AiBudgetsView',
    module: 'modules/admin/ai-budgets/index.ts',
    facade: 'modules/admin/index.ts',
  },
  {
    page: 'app/auth/register/page.tsx',
    view: 'modules/auth/auth/ui/RegisterView.tsx',
    export: 'RegisterView',
    module: 'modules/auth/auth/index.ts',
    facade: 'modules/auth/index.ts',
  },
  {
    page: 'app/auth/login/page.tsx',
    view: 'modules/auth/auth/ui/LoginView.tsx',
    export: 'LoginView',
    module: 'modules/auth/auth/index.ts',
    facade: 'modules/auth/index.ts',
  },
  {
    page: 'app/org/[orgId]/settings/controlled-lists/[listId]/page.tsx',
    view: 'modules/controlled-lists/lists/ui/ControlledListDetailView.tsx',
    export: 'ControlledListDetailView',
    module: 'modules/controlled-lists/lists/index.ts',
    facade: 'modules/controlled-lists/index.ts',
  },
  {
    page: 'app/admin/ai/configs/[purpose]/edit/page.tsx',
    view: 'modules/admin/ai-config/ui/AdminAiConfigEditView.tsx',
    export: 'AdminAiConfigEditView',
    module: 'modules/admin/ai-config/index.ts',
    facade: 'modules/admin/index.ts',
  },
  {
    page: 'app/org/[orgId]/members/page.tsx',
    view: 'modules/org/org/ui/OrgMembersView.tsx',
    export: 'OrgMembersView',
    module: 'modules/org/org/index.ts',
    facade: 'modules/org/index.ts',
  },
  {
    page: 'app/org/[orgId]/settings/templates/page.tsx',
    view: 'modules/documents/document-templates/ui/OrgTemplatesManagementView.tsx',
    export: 'OrgTemplatesManagementView',
    module: 'modules/documents/document-templates/index.ts',
    facade: 'modules/documents/index.ts',
  },
  {
    page: 'app/admin/ai/runs/[runId]/page.tsx',
    view: 'modules/admin/ai-config/ui/AiRunDetailView.tsx',
    export: 'AiRunDetailView',
    module: 'modules/admin/ai-config/index.ts',
    facade: 'modules/admin/index.ts',
  },
  {
    page: 'app/admin/ai-agents/[agentId]/versions/[versionId]/page.tsx',
    view: 'modules/admin/ai-agents/ui/AdminAIAgentVersionView.tsx',
    export: 'AdminAIAgentVersionView',
    module: 'modules/admin/ai-agents/index.ts',
    facade: 'modules/admin/index.ts',
  },
  {
    page: 'app/admin/ai/configs/[purpose]/test/page.tsx',
    view: 'modules/admin/ai-config/ui/AdminAiConfigTestView.tsx',
    export: 'AdminAiConfigTestView',
    module: 'modules/admin/ai-config/index.ts',
    facade: 'modules/admin/index.ts',
  },
  {
    page: 'app/org/[orgId]/governance/page.tsx',
    view: 'modules/governance/policy/ui/GovernanceListView.tsx',
    export: 'GovernanceListView',
    module: 'modules/governance/policy/index.ts',
    facade: 'modules/governance/index.ts',
  },
  {
    page: 'app/org/[orgId]/governance/[policyId]/page.tsx',
    view: 'modules/governance/policy/ui/GovernancePolicyDetailView.tsx',
    export: 'GovernancePolicyDetailView',
    module: 'modules/governance/policy/index.ts',
    facade: 'modules/governance/index.ts',
  },
  {
    page: 'app/org/[orgId]/projects/[projectId]/requirements/page.tsx',
    view: 'modules/projects/requirements/ui/ProjectRequirementsView.tsx',
    export: 'ProjectRequirementsView',
    module: 'modules/projects/requirements/index.ts',
    facade: 'modules/projects/index.ts',
  },
  {
    page: 'app/org/[orgId]/documents/[documentId]/page.tsx',
    view: 'modules/documents/document/ui/OrgDocumentDetailView.tsx',
    export: 'OrgDocumentDetailView',
    module: 'modules/documents/document/index.ts',
    facade: 'modules/documents/index.ts',
  },
]

function facadeImport(facadePath, exportName) {
  if (facadePath.includes('admin')) return '@/modules/admin'
  if (facadePath.includes('auth')) return '@/modules/auth'
  if (facadePath.includes('controlled-lists')) return '@/modules/controlled-lists'
  if (facadePath.includes('org/index')) return '@/modules/org'
  if (facadePath.includes('documents')) return '@/modules/documents'
  if (facadePath.includes('governance')) return '@/modules/governance'
  if (facadePath.includes('projects')) return '@/modules/projects'
  return '@/modules/' + facadePath.split('/')[1]
}

for (const r of routes) {
  const pageAbs = path.join(root, r.page)
  if (!fs.existsSync(pageAbs)) {
    console.warn('Skip missing', r.page)
    continue
  }
  const content = fs.readFileSync(pageAbs, 'utf8')
  const defaultRe = /export default function (\w+)/
  const m = content.match(defaultRe)
  if (!m) {
    console.warn('No default export', r.page)
    continue
  }
  const viewAbs = path.join(root, r.view)
  fs.mkdirSync(path.dirname(viewAbs), { recursive: true })
  const viewContent = content.replace(
    `export default function ${m[1]}`,
    `export function ${r.export}`
  )
  fs.writeFileSync(viewAbs, viewContent)

  const importFrom = facadeImport(r.facade, r.export)
  const thin = `'use client'\n\nimport { ${r.export} } from '${importFrom}'\n\nexport default function ${m[1]}() {\n  return <${r.export} />\n}\n`
  fs.writeFileSync(pageAbs, thin)

  const modAbs = path.join(root, r.module)
  if (fs.existsSync(modAbs)) {
    let mod = fs.readFileSync(modAbs, 'utf8')
    const exp = `export { ${r.export} } from './ui/${path.basename(r.view, '.tsx')}'`
    if (!mod.includes(r.export)) {
      mod = exp + '\n' + mod
      fs.writeFileSync(modAbs, mod)
    }
  }

  console.log('Thinned', r.page)
}

console.log('Done thinning routes')
