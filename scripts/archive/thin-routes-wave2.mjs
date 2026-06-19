#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const routes = [
  [
    'app/org/[orgId]/projects/[projectId]/page.tsx',
    'modules/projects/project/ui/ProjectDetailView.tsx',
    'ProjectDetailView',
    'modules/projects/project/index.ts',
    '@/modules/projects',
  ],
  [
    'app/admin/ai/runs/page.tsx',
    'modules/admin/ai-config/ui/AiRunsListView.tsx',
    'AiRunsListView',
    'modules/admin/ai-config/index.ts',
    '@/modules/admin',
  ],
  [
    'app/auth/forgot-password/page.tsx',
    'modules/auth/auth/ui/ForgotPasswordView.tsx',
    'ForgotPasswordView',
    'modules/auth/auth/index.ts',
    '@/modules/auth',
  ],
  [
    'app/admin/ai/page.tsx',
    'modules/admin/ai-config/ui/AdminAiHubView.tsx',
    'AdminAiHubView',
    'modules/admin/ai-config/index.ts',
    '@/modules/admin',
  ],
  [
    'app/admin/templates/page.tsx',
    'modules/admin/admin-templates/ui/AdminTemplatesListView.tsx',
    'AdminTemplatesListView',
    'modules/admin/admin-templates/index.ts',
    '@/modules/admin',
  ],
  [
    'app/admin/ai-agents/page.tsx',
    'modules/admin/ai-agents/ui/AdminAiAgentsListView.tsx',
    'AdminAiAgentsListView',
    'modules/admin/ai-agents/index.ts',
    '@/modules/admin',
  ],
  [
    'app/org/[orgId]/projects/page.tsx',
    'modules/projects/project/ui/ProjectsListView.tsx',
    'ProjectsListView',
    'modules/projects/project/index.ts',
    '@/modules/projects',
  ],
  [
    'app/onboarding/page.tsx',
    'modules/org/invites/ui/OnboardingView.tsx',
    'OnboardingView',
    'modules/org/invites/index.ts',
    '@/modules/org',
  ],
  [
    'app/invites/[token]/page.tsx',
    'modules/org/invites/ui/InviteAcceptView.tsx',
    'InviteAcceptView',
    'modules/org/invites/index.ts',
    '@/modules/org',
  ],
  [
    'app/admin/templates/new/page.tsx',
    'modules/admin/admin-templates/ui/AdminTemplateNewView.tsx',
    'AdminTemplateNewView',
    'modules/admin/admin-templates/index.ts',
    '@/modules/admin',
  ],
  [
    'app/onboarding/profile/page.tsx',
    'modules/auth/profile/ui/OnboardingProfileView.tsx',
    'OnboardingProfileView',
    'modules/auth/profile/index.ts',
    '@/modules/auth',
  ],
  [
    'app/auth/reset-password/page.tsx',
    'modules/auth/auth/ui/ResetPasswordView.tsx',
    'ResetPasswordView',
    'modules/auth/auth/index.ts',
    '@/modules/auth',
  ],
  [
    'app/org/[orgId]/document-hub/page.tsx',
    'modules/documents/document-hub/ui/DocumentHubPageView.tsx',
    'DocumentHubPageView',
    'modules/documents/document-hub/index.ts',
    '@/modules/documents',
  ],
  [
    'app/org/[orgId]/settings/templates/[templateId]/page.tsx',
    'modules/documents/document-templates/ui/OrgTemplateDetailPageView.tsx',
    'OrgTemplateDetailPageView',
    'modules/documents/document-templates/index.ts',
    '@/modules/documents',
  ],
  [
    'app/page.tsx',
    'modules/platform/layout/ui/HomeRedirectView.tsx',
    'HomeRedirectView',
    'modules/platform/layout/index.ts',
    '@/modules/platform',
  ],
  [
    'app/suspended/page.tsx',
    'modules/auth/auth/ui/SuspendedView.tsx',
    'SuspendedView',
    'modules/auth/auth/index.ts',
    '@/modules/auth',
  ],
  [
    'app/documents/[documentId]/page.tsx',
    'modules/documents/document/ui/GlobalDocumentRedirectView.tsx',
    'GlobalDocumentRedirectView',
    'modules/documents/document/index.ts',
    '@/modules/documents',
  ],
  [
    'app/org/[orgId]/settings/templates/new/page.tsx',
    'modules/documents/document-templates/ui/OrgTemplateNewPageView.tsx',
    'OrgTemplateNewPageView',
    'modules/documents/document-templates/index.ts',
    '@/modules/documents',
  ],
  [
    'app/org/[orgId]/page.tsx',
    'modules/org/org/ui/OrgRedirectView.tsx',
    'OrgRedirectView',
    'modules/org/org/index.ts',
    '@/modules/org',
  ],
  [
    'app/auth/callback/page.tsx',
    'modules/auth/auth/ui/AuthCallbackView.tsx',
    'AuthCallbackView',
    'modules/auth/auth/index.ts',
    '@/modules/auth',
  ],
]

for (const [pageRel, viewRel, exportName, modRel, importFrom] of routes) {
  const pageAbs = path.join(root, pageRel)
  if (!fs.existsSync(pageAbs)) {
    console.warn('skip missing', pageRel)
    continue
  }
  const content = fs.readFileSync(pageAbs, 'utf8')
  const m = content.match(/export default function (\w+)/)
  if (!m) {
    console.warn('no default export', pageRel)
    continue
  }
  const pageName = m[1]
  const viewAbs = path.join(root, viewRel)
  fs.mkdirSync(path.dirname(viewAbs), { recursive: true })
  const viewContent = content.replace(
    `export default function ${pageName}`,
    `export function ${exportName}`
  )
  fs.writeFileSync(viewAbs, viewContent)

  const thin = `'use client'\n\nimport { ${exportName} } from '${importFrom}'\n\nexport default function ${pageName}() {\n  return <${exportName} />\n}\n`
  fs.writeFileSync(pageAbs, thin)

  const modAbs = path.join(root, modRel)
  if (fs.existsSync(modAbs)) {
    let mod = fs.readFileSync(modAbs, 'utf8')
    const exp = `export { ${exportName} } from './ui/${path.basename(viewRel, '.tsx')}'`
    if (!mod.includes(exportName)) {
      mod = `${exp}\n${mod}`
      fs.writeFileSync(modAbs, mod)
    }
  }
  console.log('ok', pageRel)
}
