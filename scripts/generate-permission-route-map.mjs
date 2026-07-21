#!/usr/bin/env node
/**
 * Scans all app page.tsx routes and maps FE permission gates AS-IS
 * (no invented BE grants). Output: scripts/permission-route-map.json
 *
 * Run: node scripts/generate-permission-route-map.mjs
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, acc)
    else if (ent.name === 'page.tsx') acc.push(p)
  }
  return acc
}

function read(p) {
  return fs.readFileSync(p, 'utf8')
}

function routeFromPage(pagePath) {
  const rel = pagePath.replace(/^app\//, '').replace(/\/page\.tsx$/, '')
  return '/' + rel.replace(/\[([^\]]+)\]/g, ':$1')
}

function extractViewImport(content) {
  const imports = [...content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)]
  for (const m of imports) {
    const names = m[1].split(',').map((s) => s.trim()).filter(Boolean)
    const view = names.find((n) => /View$/.test(n))
    if (view && m[2].startsWith('@/')) return { view, mod: m[2] }
  }
  return null
}

function findViewFile(viewName) {
  try {
    const out = execSync(`rg -l "export function ${viewName}" modules --glob "*.tsx"`, {
      encoding: 'utf8',
      cwd: ROOT,
    })
      .trim()
      .split('\n')[0]
    return out ? path.join(ROOT, out) : null
  } catch {
    return null
  }
}

const ADMIN_SHELL = {
  permissions: [
    'SYSTEM_IAM_MANAGEMENT + VIEW_USER',
    'SYSTEM_GOVERNANCE_MANAGEMENT + VIEW',
    'SYSTEM_RESOURCE_MANAGEMENT + VIEW',
    'SYSTEM_NOTIFICATION_MANAGEMENT + VIEW_NOTIFICATION',
  ],
  resourceNote:
    'resourceType=GLOBAL (no resourceRefId). Any ONE allowed → enter /admin/** (app/admin/layout.tsx + PLATFORM_ADMIN_ENTRY_CHECKS).',
}

const WAVE5_FAIL_OPEN =
  'Effective-permissions: if null → allow; if catalog has matching AI_* prefix but key missing → deny; if no matching prefix → allow (fail-open). Scope: useEffectivePermissions(orgId) from current workspace org.'

function analyzeView(file) {
  if (!file || !fs.existsSync(file))
    return { gate: 'unknown', detail: 'view not found', level: 'unknown', signals: [] }
  const c = read(file)
  const signals = []
  if (/if\s*\(\s*!canUpdateWorkspace/.test(c)) signals.push('canUpdateWorkspace')
  if (/if\s*\(\s*!canViewTeams/.test(c)) signals.push('canViewTeams')
  if (/if\s*\(\s*!canManageJoinRequests/.test(c)) signals.push('canManageJoinRequests')
  if (/if\s*\(\s*!canInviteMembers/.test(c)) signals.push('canInviteMembers')
  if (/!FEATURES\.orgInvites\s*\|\|\s*!canInviteMembers/.test(c)) signals.push('canInviteMembers')
  if (/if\s*\(\s*!canView\b/.test(c)) signals.push('canViewWave5')
  if (/if\s*\(\s*!canUse\b/.test(c)) signals.push('canUseWave5')
  if (/if\s*\([^)]*forbidden[^)]*\)/.test(c)) signals.push('forbidden403')
  if (/useCanManageAiConfig|AI_AGENT_CONFIG_MANAGE/.test(c)) signals.push('aiConfigManage')
  if (/AI_PROVIDER_SECRET_MANAGE/.test(c)) signals.push('aiProviderSecretManage')
  if (/useCanViewTools|AI_TOOL_VIEW/.test(c)) signals.push('aiToolView')
  if (/useCanViewExecutionLogs|AI_EXECUTION_LOG_VIEW/.test(c)) signals.push('aiExecLogView')
  if (/useCanUsePlayground|AI_PLAYGROUND_USE/.test(c)) signals.push('aiPlayground')
  if (/useAppShellAuthorization|useWorkspaceAuthorization/.test(c)) signals.push('iamBatch')
  if (/buildDocumentSpacePermissions|useEffectivePermissions/.test(c)) signals.push('effectivePerms')
  if (/notFound\s*\(/.test(c)) signals.push('notFound')

  let level = 'open'
  let gate = 'Session only — BE enforces'
  if (
    signals.some((s) =>
      [
        'canUpdateWorkspace',
        'canViewTeams',
        'canManageJoinRequests',
        'canInviteMembers',
        'canViewWave5',
        'canUseWave5',
        'notFound',
      ].includes(s)
    )
  ) {
    level = 'hard-fe'
    gate = signals
      .filter((s) =>
        [
          'canUpdateWorkspace',
          'canViewTeams',
          'canManageJoinRequests',
          'canInviteMembers',
          'canViewWave5',
          'canUseWave5',
          'notFound',
        ].includes(s)
      )
      .join(' + ')
  } else if (signals.includes('forbidden403')) {
    level = 'api-403'
    gate = 'Loads page → API 403 → forbidden screen'
  } else if (signals.length) {
    level = 'soft'
    gate = signals.join(', ')
  }
  return {
    gate,
    detail: signals.join(', ') || 'none',
    level,
    signals,
    viewFile: file.replace(ROOT + '/', ''),
  }
}

function fePermissionFor(route, area, signals, level) {
  const parts = []
  const notes = []

  if (area === 'admin') {
    parts.push(...ADMIN_SHELL.permissions.map((p) => `(shell) ${p}`))
    notes.push(ADMIN_SHELL.resourceNote)
  }

  if (signals.includes('canUpdateWorkspace')) {
    parts.push('WORKSPACE_MANAGEMENT + UPDATE')
    parts.push('WORKSPACE_MANAGEMENT + MANAGE_SETTING')
    notes.push(
      'resourceType=WORKSPACE, resourceRefId=workspaceId. FE allows if UPDATE OR MANAGE_SETTING (useWorkspaceAuthorization.canUpdateWorkspace).'
    )
  }

  if (signals.includes('canViewTeams')) {
    parts.push('TEAM_MANAGEMENT + VIEW (page hard)')
    notes.push(
      'resourceType=ORGANIZATION, resourceRefId=organizationId (workspace.organizationId) — NOT workspaceId. Source: organizationTeamChecks.'
    )
    if (signals.includes('iamBatch')) {
      notes.push(
        'Same batch also loads TEAM_MANAGEMENT CREATE/UPDATE/ARCHIVE/MANAGE and TEAM_MEMBER_MANAGEMENT VIEW/ADD/REMOVE for action buttons — page block uses VIEW only.'
      )
    }
  }

  if (signals.includes('canManageJoinRequests')) {
    parts.push('WORKSPACE_ACCESS_MANAGEMENT + MANAGE_JOIN_REQUEST')
    notes.push('resourceType=WORKSPACE, resourceRefId=workspaceId.')
  }

  if (signals.includes('canInviteMembers')) {
    parts.push('WORKSPACE_ACCESS_MANAGEMENT + INVITE_MEMBER')
    notes.push('resourceType=WORKSPACE, resourceRefId=workspaceId. Also requires FEATURES.orgInvites.')
  }

  if (signals.includes('aiToolView')) {
    parts.push('Wave5 key AI_TOOL_VIEW OR AI_TOOL_MANAGE (view)')
    notes.push(WAVE5_FAIL_OPEN)
    notes.push('No IAM resourceRefId — string key against effective permissions list for orgId.')
  }
  if (signals.includes('aiExecLogView')) {
    parts.push('Wave5 key AI_EXECUTION_LOG_VIEW')
    notes.push(WAVE5_FAIL_OPEN)
    notes.push('No IAM resourceRefId — string key against effective permissions list for orgId.')
  }
  if (signals.includes('aiPlayground')) {
    parts.push('Wave5 key AI_PLAYGROUND_USE')
    notes.push(WAVE5_FAIL_OPEN)
    notes.push('No IAM resourceRefId — string key against effective permissions list for orgId.')
  }
  if (signals.includes('aiConfigManage')) {
    parts.push('Wave5 key AI_AGENT_CONFIG_MANAGE (soft manage actions)')
    notes.push(WAVE5_FAIL_OPEN)
    notes.push('No IAM resourceRefId — string key against effective permissions list for orgId.')
  }
  if (signals.includes('aiProviderSecretManage')) {
    parts.push('Wave5 key AI_PROVIDER_SECRET_MANAGE (soft manage)')
    notes.push(WAVE5_FAIL_OPEN)
    notes.push('No IAM resourceRefId — string key against effective permissions list for orgId.')
  }

  if (
    signals.includes('iamBatch') &&
    area === 'workspace' &&
    !signals.includes('canUpdateWorkspace') &&
    !signals.includes('canViewTeams') &&
    !signals.includes('canManageJoinRequests') &&
    !signals.includes('canInviteMembers')
  ) {
    if (/\/directory$/.test(route)) {
      parts.push('(soft tabs/actions) WORKSPACE_ACCESS_MANAGEMENT + INVITE_MEMBER')
      parts.push('(soft tabs/actions) WORKSPACE_ACCESS_MANAGEMENT + MANAGE_JOIN_REQUEST')
      parts.push('(soft tabs/actions) TEAM_MANAGEMENT + VIEW')
      notes.push(
        'WorkspaceDirectoryView: page itself open; tabs/actions gated. Teams tab → ORGANIZATION:{organizationId}; invite/join → WORKSPACE:{workspaceId}.'
      )
    } else if (/\/members$/.test(route) && !/organization/.test(route) && !/projects/.test(route)) {
      parts.push('(soft actions) WORKSPACE_ACCESS_MANAGEMENT + MANAGE_MEMBER')
      parts.push('(soft actions) WORKSPACE_ACCESS_MANAGEMENT + INVITE_MEMBER')
      notes.push('resourceType=WORKSPACE, resourceRefId=workspaceId. Page open; buttons gated.')
    } else if (route === '/workspace/:workspaceId') {
      parts.push('(soft CTAs) WORKSPACE_MANAGEMENT + UPDATE|MANAGE_SETTING')
      parts.push('(soft CTAs) WORKSPACE_ACCESS_MANAGEMENT + MANAGE_MEMBER|INVITE_MEMBER')
      notes.push(
        'WorkspaceOverviewView CTAs only — page open. resourceType=WORKSPACE, resourceRefId=workspaceId.'
      )
    }
  }

  if (level === 'api-403') {
    return {
      fePermissions:
        area === 'admin' ? [...new Set(parts)].join(' | ') : 'None — no FE permission pre-check',
      fePermissionModel:
        area === 'admin' ? 'IAM check-batch (shell only)' : 'None on FE',
      resourceNote:
        area === 'admin'
          ? notes.join(' ') +
            ' Page body has no additional FE permission pre-check beyond admin shell; forbidden UI comes from API 403.'
          : 'FE only reacts to API 403 (forbidden UI). Do not invent IAM permission/action here — BE endpoint authz is authoritative; FE does not declare which grant is required.',
      failOpen: false,
    }
  }

  if (parts.length === 0) {
    if (area === 'admin') {
      return {
        fePermissions: ADMIN_SHELL.permissions.map((p) => `(shell) ${p}`).join(' | '),
        fePermissionModel: 'IAM check-batch (shell only)',
        resourceNote:
          ADMIN_SHELL.resourceNote +
          ' No additional page-level FE permission check beyond admin shell.',
        failOpen: false,
      }
    }
    return {
      fePermissions: 'None — no FE permission pre-check',
      fePermissionModel: 'Session / AuthGuard only',
      resourceNote:
        'No FE permissionCode+actionCode or Wave5 key gate on this page. BE may still 403.',
      failOpen: false,
    }
  }

  const unique = [...new Set(parts)]
  const isWave5 = unique.some((p) => p.includes('Wave5') || p.includes('AI_'))
  const isIam = unique.some(
    (p) => p.includes('WORKSPACE_') || p.includes('TEAM_') || p.includes('SYSTEM_')
  )
  return {
    fePermissions: unique.join(' | '),
    fePermissionModel:
      isIam && isWave5
        ? 'IAM check-batch + Wave5 key'
        : isWave5
          ? 'Wave5 effective key'
          : 'IAM check-batch',
    resourceNote: notes.join(' '),
    failOpen: isWave5,
  }
}

const pages = walk(path.join(ROOT, 'app')).sort()
const rows = pages.map((page) => {
  const relPage = path.relative(ROOT, page).replace(/\\/g, '/')
  const content = read(page)
  const route = routeFromPage(relPage)
  const area = route.startsWith('/admin')
    ? 'admin'
    : route.startsWith('/workspace')
      ? 'workspace'
      : route.startsWith('/account')
        ? 'account'
        : route.startsWith('/portal')
          ? 'portal'
          : 'other'
  const imp = extractViewImport(content)
  let analysis = {
    gate: 'redirect/thin route',
    detail: '',
    level: 'open',
    signals: [],
    viewFile: '',
    view: '',
    module: '',
  }
  if (imp) {
    const vf = findViewFile(imp.view)
    analysis = { ...analyzeView(vf), view: imp.view, module: imp.mod }
  }

  if (/\/admin\/ai-control\/tools/.test(route) && !analysis.signals?.includes('aiToolView')) {
    const vf = /tools\/:/.test(route) ? findViewFile('ToolDetailView') : findViewFile('ToolsListView')
    if (vf) analysis = { ...analyzeView(vf), view: analysis.view || path.basename(vf, '.tsx'), module: analysis.module }
  }
  if (/\/admin\/ai-control\/executions/.test(route) && !analysis.signals?.includes('aiExecLogView')) {
    const vf = /executions\/:/.test(route)
      ? findViewFile('ExecutionDetailView')
      : findViewFile('ExecutionsMonitorView')
    if (vf) analysis = { ...analyzeView(vf), view: analysis.view || path.basename(vf, '.tsx'), module: analysis.module }
  }
  if (/\/admin\/ai-control\/playground/.test(route) && !analysis.signals?.includes('aiPlayground')) {
    const vf = findViewFile('PlaygroundView')
    if (vf) analysis = { ...analyzeView(vf), view: analysis.view || 'PlaygroundView', module: analysis.module }
  }
  if (
    /\/admin\/ai-control\/provider-secrets/.test(route) &&
    !analysis.signals?.includes('aiProviderSecretManage')
  ) {
    const vf = /secrets\/:/.test(route)
      ? findViewFile('ProviderSecretDetailView')
      : findViewFile('ProviderSecretsListView')
    if (vf) analysis = { ...analyzeView(vf), view: analysis.view || path.basename(vf, '.tsx'), module: analysis.module }
  }
  if (/\/workspace\/:workspaceId\/invitations$/.test(route)) {
    const vf = findViewFile('WorkspaceInvitationsView')
    if (vf) analysis = { ...analyzeView(vf), view: 'WorkspaceInvitationsView', module: analysis.module }
  }

  const fe = fePermissionFor(route, area, analysis.signals || [], analysis.level)
  return { route, area, page: relPage, ...analysis, ...fe }
})

const summary = {
  total: rows.length,
  byLevel: Object.fromEntries(
    ['hard-fe', 'api-403', 'soft', 'open', 'unknown'].map((k) => [
      k,
      rows.filter((r) => r.level === k).length,
    ])
  ),
  byArea: Object.fromEntries(
    ['admin', 'workspace', 'account', 'portal', 'other'].map((k) => [
      k,
      rows.filter((r) => r.area === k).length,
    ])
  ),
  withFePermission: rows.filter((r) => r.fePermissions && !r.fePermissions.startsWith('None'))
    .length,
  noneFePrecheck: rows.filter((r) => (r.fePermissions || '').startsWith('None')).length,
}

const out = {
  generatedAt: new Date().toISOString(),
  disclaimer:
    'fePermissions column is AS-IS from FE code only (IAM check-batch tuples and Wave5 string keys). API-403/open pages intentionally list None for page pre-check — BE grant requirements are not invented.',
  summary,
  rows,
}
const outPath = path.join(ROOT, 'scripts/permission-route-map.json')
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(`Wrote ${outPath}`)
console.log(JSON.stringify(summary, null, 2))
