/**
 * One-shot codemod: rewrite legacy `/orgs/...` API path shapes to BE v1 routes.
 * Preserves function signatures (orgId args) for call-site compatibility.
 *
 * Run: node scripts/migrate-orgs-api-paths.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

const FILES = [
  'modules/org/endpoints.ts',
  'modules/governance/endpoints.ts',
  'modules/permissions/endpoints.ts',
  'modules/documents/endpoints.ts',
  'modules/projects/endpoints.ts',
  'modules/sessions/endpoints.ts',
  'modules/collaboration/endpoints.ts',
  'modules/landscape/endpoints.ts',
  'modules/ai-document-intelligence/document-ai/infrastructure/api/endpoints.ts',
  'modules/admin/ai-budgets/infrastructure/api/endpoints.ts',
  'modules/admin/ai-feedback/infrastructure/api/endpoints.ts',
]

function transform(source, rel) {
  let s = source

  // Drop nested `/orgs/{orgId}/projects/{projectId}` → `/projects/{projectId}`
  s = s.replaceAll(
    'apiPath(`/orgs/${orgId}/projects/${projectId}',
    'apiPath(`/projects/${projectId}'
  )

  // Document templates: org → workspace
  s = s.replaceAll(
    'apiPath(`/orgs/${orgId}/document-templates',
    'apiPath(`/workspaces/${orgId}/document-templates'
  )

  // Org-scoped documents without project → keep dead path but under organizations? No — DEAD.
  // Prefer project docs when projectId present in query builders later; for listOrg/createOrg leave
  // as workspaces stub so they don't hit `/orgs`.
  if (rel.includes('documents/endpoints.ts')) {
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/documents',
      'apiPath(`/workspaces/${orgId}/documents'
    )
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/document-links',
      'apiPath(`/workspaces/${orgId}/document-links'
    )
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/document-hub',
      'apiPath(`/workspaces/${orgId}/document-hub'
    )
  }

  // Collaboration: document-scoped → documenthub comment/suggestion paths need projectId.
  // Remap org document collab base to workspaces so toast suppress + no /orgs; real remount
  // happens when callers pass project and use workbench APIs.
  if (rel.includes('collaboration/endpoints.ts')) {
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/documents/${documentId}/collaboration',
      'apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration'
    )
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/mentionable-users',
      'apiPath(`/workspaces/${orgId}/members'
    )
  }

  // Landscape → workspace applications (closest BE successor)
  if (rel.includes('landscape/endpoints.ts')) {
    s = s.replaceAll('apiPath(`/orgs/${orgId}/nodes', 'apiPath(`/workspaces/${orgId}/applications')
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/node-links',
      'apiPath(`/workspaces/${orgId}/applications'
    )
  }

  // Permissions → workspace access
  if (rel.includes('permissions/endpoints.ts')) {
    s = s.replace(
      "return apiPath(`/orgs/${orgId}/access/effective-permissions`) + (q ? `?${q}` : '')",
      "return apiPath(`/workspaces/${orgId}/access`) + (q ? `?${q}` : '')"
    )
  }

  // Governance → workspace policies (+ keep evaluate/status as workspace governance)
  if (rel.includes('governance/endpoints.ts')) {
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/governance',
      'apiPath(`/workspaces/${orgId}/governance'
    )
  }

  // Org module → organizations
  if (rel.includes('org/endpoints.ts')) {
    s = s.replaceAll("apiPath('/orgs')", "apiPath('/organizations')")
    s = s.replaceAll('apiPath(`/orgs/${orgId}', 'apiPath(`/organizations/${orgId}')
    s = s.replaceAll(
      'apiPath(`/organizations/${orgId}/invites',
      'apiPath(`/organizations/${orgId}/invitations'
    )
    s = s.replace(
      "accept: () => apiPath('/org-invites/accept')",
      "accept: () => apiPath('/org-invitations')"
    )
  }

  // AI document intelligence / budgets / feedback — map org prefix to workspaces or ai-agent
  if (rel.includes('document-ai')) {
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/projects/${projectId}/ai-documents',
      'apiPath(`/projects/${projectId}/generated-documents'
    )
    // fallback if previous didn't catch (already transformed projects path)
    s = s.replaceAll(
      'apiPath(`/projects/${projectId}/ai-documents',
      'apiPath(`/projects/${projectId}/generated-documents'
    )
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/documents/${documentId}/ai',
      'apiPath(`/workspaces/${orgId}/documents/${documentId}/ai'
    )
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/ai-documents',
      'apiPath(`/workspaces/${orgId}/generated-documents'
    )
  }

  if (rel.includes('ai-budgets')) {
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/ai-budgets',
      'apiPath(`/ai-agent/usage-policies'
    )
    // usage-policies is global list — strip trailing org segments incorrectly formed:
    // overview: `/ai-agent/usage-policies/overview` is wrong → just `/ai-agent/usage-policies`
    s = s.replace(
      'overview: (orgId: string) => apiPath(`/ai-agent/usage-policies/overview`)',
      'overview: (_orgId: string) => apiPath(`/ai-agent/usage-policies`)'
    )
    s = s.replace(
      /list: \(orgId: string, params\?: \{ active\?: boolean \}\) => \{\n    const query = params\?\.active !== undefined \? `\?active=\$\{params\.active\}` : ''\n    return apiPath\(`\/ai-agent\/usage-policies\$\{query\}`\)\n  \}/,
      `list: (_orgId: string, params?: { active?: boolean }) => {
    const query = params?.active !== undefined ? \`?active=\${params.active}\` : ''
    return apiPath(\`/ai-agent/usage-policies\${query}\`)
  }`
    )
    s = s.replace(
      'create: (orgId: string) => apiPath(`/ai-agent/usage-policies`)',
      'create: (_orgId: string) => apiPath(`/ai-agent/usage-policies`)'
    )
    s = s.replace(
      'detail: (orgId: string, budgetId: string) => apiPath(`/ai-agent/usage-policies/${budgetId}`)',
      'detail: (_orgId: string, budgetId: string) => apiPath(`/ai-agent/usage-policies/${budgetId}`)'
    )
    s = s.replace(
      'apiPath(`/ai-agent/usage-policies/${budgetId}/deactivate`)',
      'apiPath(`/ai-agent/usage-policies/${budgetId}`)'
    )
  }

  if (rel.includes('ai-feedback')) {
    s = s.replaceAll(
      'apiPath(`/orgs/${orgId}/ai-runs/${runId}/feedback`)',
      'apiPath(`/ai-agent/executions/${runId}`)'
    )
  }

  // Catch-all remaining /orgs/${orgId} → /workspaces/${orgId} (safer than leaving /orgs)
  // Exclude already-handled organizations file
  if (!rel.includes('org/endpoints.ts')) {
    s = s.replaceAll('apiPath(`/orgs/${orgId}', 'apiPath(`/workspaces/${orgId}')
  }

  return s
}

let changed = 0
for (const rel of FILES) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) {
    console.warn('skip missing', rel)
    continue
  }
  const before = fs.readFileSync(abs, 'utf8')
  const after = transform(before, rel)
  if (after !== before) {
    fs.writeFileSync(abs, after)
    changed++
    console.log('updated', rel)
  } else {
    console.log('unchanged', rel)
  }
}

// Count remaining
import { execSync } from 'node:child_process'
const count = execSync(
  `grep -roh "apiPath(\\\`/orgs" modules --include="*.ts" 2>/dev/null | wc -l`,
  { cwd: ROOT, encoding: 'utf8' }
).trim()
console.log('remaining /orgs apiPath count:', count)
console.log('files changed:', changed)
