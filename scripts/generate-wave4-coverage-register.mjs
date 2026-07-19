#!/usr/bin/env node
/**
 * Parse WAVE4_API_CONTRACT.md → coverage register.
 * Conservative defaults: MAPPED unless an explicit override matches.
 *
 * Usage: node scripts/generate-wave4-coverage-register.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const contractPath = path.join(root, 'docs/phase-tracking/wave-04/WAVE4_API_CONTRACT.md')
const outJson = path.join(root, 'docs/phase-tracking/wave-04/WAVE4_COVERAGE_REGISTER.json')
const outMd = path.join(root, 'docs/phase-tracking/wave-04/WAVE4_COVERAGE_REGISTER.md')

const contract = fs.readFileSync(contractPath, 'utf8')

/**
 * Explicit overrides only. First match wins.
 * Prefer under-claiming (MAPPED) over over-claiming UI_IMPLEMENTED.
 */
const OVERRIDES = [
  // ── CONTRACT_BLOCKED (Spec §21) ─────────────────────────────
  {
    test: (m, p) =>
      /organizations\/.+\/documents|workspaces\/\{workspaceId\}\/documents|\/me\/documents/.test(p),
    status: 'CONTRACT_BLOCKED',
    surface: 'DocumentHubScopeSwitcher',
    exceptionId: 'W4-EX-DOC-SCOPED',
  },
  {
    test: (m, p) => /citation/.test(p),
    status: 'CONTRACT_BLOCKED',
    surface: 'AiAssistantView',
    exceptionId: 'W4-EX-AI-CITATIONS',
  },
  {
    test: (m, p) => /client-uat|\/uat-/.test(p),
    status: 'CONTRACT_BLOCKED',
    surface: 'Portal',
    exceptionId: 'W4-EX-PORTAL-UAT',
  },
  {
    test: (m, p) =>
      p.includes('generated-documents') && (p.includes('/process') || p.includes('/complete')),
    status: 'MAPPED',
    surface: 'document-workbench.api (worker)',
    exceptionId: 'W4-EX-GEN-DOC-WORKER',
  },

  // ── Event Registry ──────────────────────────────────────────
  {
    test: (m, p) => p.includes('event-definitions'),
    status: 'UI_IMPLEMENTED',
    surface: 'EventRegistryView',
  },

  // ── Project notifications ───────────────────────────────────
  {
    test: (m, p) =>
      p.includes('notification-subscriptions') ||
      p.includes('notification-preferences') ||
      p.includes('notifications/reminders'),
    status: 'UI_IMPLEMENTED',
    surface: 'ProjectNotificationSettingsView',
  },
  {
    test: (m, p) =>
      /\/projects\/\{projectId\}\/documents/.test(p) ||
      p.includes('/projects/') && p.includes('/documents'),
    status: 'UI_IMPLEMENTED',
    surface: 'DocumentWorkbenchView / NativeDocumentEditorView',
  },
  {
    test: (m, p) => p.includes('document-folders') || p.includes('/shares'),
    status: 'UI_IMPLEMENTED',
    surface: 'DocumentWorkbenchView',
  },
  {
    test: (m, p) =>
      p.includes('/synced-blocks') ||
      p.includes('/comment-threads') ||
      p.includes('/suggestions') ||
      p.includes('/attachments') ||
      p.includes('/ai-context') ||
      p.includes('/resource-references') ||
      p.includes('client-visibility') ||
      p.includes('validate-client-visibility'),
    status: 'UI_IMPLEMENTED',
    surface: 'NativeDocumentEditorView',
  },
  {
    test: (m, p) => p.includes('native-versions') || p.includes('/smart-blocks'),
    status: 'MAPPED',
    surface: 'NativeDocumentEditorView (feature-gated)',
    exceptionId: 'W41-GAP-NATIVE-TEMPLATES-SMART',
  },
  {
    test: (m, p) => p.includes('document-templates'),
    status: 'UI_IMPLEMENTED',
    surface: 'WorkspaceDocumentTemplatesView',
  },
  {
    test: (m, p) => p.includes('presigned-') || p.includes('/versions'),
    status: 'UI_IMPLEMENTED',
    surface: 'DocumentVersionUploadPanel',
  },
  {
    test: (m, p) => p.includes('generated-documents'),
    status: 'UI_IMPLEMENTED',
    surface: 'DocumentVersionUploadPanel',
  },

  // ── Productivity ────────────────────────────────────────────
  {
    test: (m, p) => p.includes('work-inbox') || p.includes('/commands') || p.includes('/search'),
    status: 'UI_IMPLEMENTED',
    surface: 'Productivity',
  },
  {
    test: (m, p) =>
      p.includes('saved-views') ||
      p.includes('favorites') ||
      p.includes('/recent') ||
      p.includes('saved-searches') ||
      p.includes('/pins') ||
      p.includes('/navigation'),
    status: 'UI_IMPLEMENTED',
    surface: 'SavedItemsView',
  },

  // ── Knowledge ───────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('document-types') ||
      p.includes('/indexing') ||
      p.includes('/related') ||
      p.includes('indexing-jobs') ||
      p.includes('document-classifications') ||
      p.includes('knowledge/sources'),
    status: 'UI_IMPLEMENTED',
    surface: 'Knowledge',
  },

  // ── AI Assistant ────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('ai-assistant/conversations') ||
      p.includes('ai-assistant/messages') ||
      (p.includes('/messages/') && p.includes('stream')) ||
      p.includes('/cancel') ||
      p.includes('ai-assistant/guides') ||
      p.includes('ai-assistant/feedback') ||
      (p.includes('/conversations') && m !== 'OPTIONS'),
    status: 'UI_IMPLEMENTED',
    surface: 'AiAssistantView',
  },

  // ── Governance ──────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('governance/ownership') ||
      p.includes('governance/locks') ||
      p.includes('access-grants') ||
      p.includes('governance/versions') ||
      p.includes('governance/reports') ||
      p.includes('governance/object-types') ||
      p.includes('governance/snapshots') ||
      p.includes('governance/restore') ||
      p.includes('baseline-guard') ||
      p.includes('governance/policies'),
    status: 'UI_IMPLEMENTED',
    surface: 'ProjectGovernanceCenterView',
  },

  // ── Reporting ───────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('/dashboard') ||
      p.includes('/reports/definitions') ||
      p.includes('/reports/runs') ||
      p.includes('/reports/exports') ||
      p.includes('/reports/') ||
      p.includes('activity-feed'),
    status: 'UI_IMPLEMENTED',
    surface: 'ReportLibraryView / ProjectDashboardView / DeploymentCenterView',
  },

  // ── Quality ─────────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('quality-plans') ||
      (p.includes('/defects') && !p.includes('reports')) ||
      (p.includes('/releases') && !p.includes('reports')) ||
      p.includes('deployment-environments') ||
      p.includes('rollback-plans'),
    status: 'UI_IMPLEMENTED',
    surface: 'Quality / Defect / Release / Deployment centers',
  },
  {
    test: (m, p) => p.includes('test-plans') || p.includes('test-cases') || p.includes('test-runs') || p.includes('/suites') || p.includes('/steps'),
    status: 'UI_IMPLEMENTED',
    surface: 'TestManagementView / TestRunExecutionView',
  },
  {
    test: (m, p) => p.includes('deployments'),
    status: 'UI_IMPLEMENTED',
    surface: 'DeploymentCenterView',
  },

  // ── AI Planning / Recommendations ───────────────────────────
  {
    test: (m, p) => p.includes('ai-planning'),
    status: 'UI_IMPLEMENTED',
    surface: 'AiPlanningCenterView / PlanningSuggestionReviewView',
  },
  {
    test: (m, p) => p.includes('ai-recommendations'),
    status: 'UI_IMPLEMENTED',
    surface: 'RecommendationCenterView',
  },

  // ── Portal ──────────────────────────────────────────────────
  {
    test: (m, p) => p.includes('/portal/') && p.includes('/decide'),
    status: 'UI_IMPLEMENTED',
    surface: 'PortalReviewsView',
  },
  {
    test: (m, p) =>
      p.includes('/portal/auth') ||
      p.includes('/portal/projects') ||
      p.includes('portal-accounts') ||
      p.includes('portal-invites') ||
      p.includes('portal-permission-policies') ||
      p.includes('portal-access-grants') ||
      p.includes('client-reviews') ||
      p.includes('client-feedback') ||
      p.includes('client-comments') ||
      p.includes('portal-audit-logs') ||
      (p.includes('/portal/') &&
        (p.includes('/reviews') ||
          p.includes('/meetings') ||
          p.includes('/forms') ||
          p.includes('/feedback') ||
          p.includes('/support'))),
    status: 'UI_IMPLEMENTED',
    surface: 'Portal / ClientCollaborationView',
  },

  // ── Integrations ────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('integrations') ||
      p.includes('credential-references'),
    status: 'UI_IMPLEMENTED',
    surface: 'IntegrationDashboardView',
  },

  // ── Traceability ────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('trace-links') ||
      p.includes('coverage-matrix') ||
      p.includes('/applications') ||
      p.includes('/requirements'),
    status: 'UI_IMPLEMENTED',
    surface: 'Traceability / Requirements',
  },

  // ── Trust ───────────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('trust/dashboard') ||
      p.includes('privacy-requests') ||
      p.includes('legal-holds') ||
      p.includes('anonymization-plans') ||
      p.includes('retention-policies') ||
      p.includes('access-review-campaigns') ||
      p.includes('permission-review-findings') ||
      p.includes('evidence-records') ||
      p.includes('export-audit-logs') ||
      p.includes('privacy-export-packages') ||
      p.includes('retention-jobs') ||
      p.includes('classification-policy') ||
      p.includes('sensitive-objects') ||
      p.includes('sensitive-fields') ||
      p.includes('sensitive-access-logs') ||
      p.includes('consent-records') ||
      p.includes('contact-suppressions') ||
      p.includes('data-subjects'),
    status: 'UI_IMPLEMENTED',
    surface: 'TrustDashboardView / PrivacyRequestCenterView',
  },

  // ── Support ─────────────────────────────────────────────────
  {
    test: (m, p) =>
      p.includes('support/dashboard') ||
      p.includes('support/cases') ||
      p.includes('sla-clocks') ||
      p.includes('sla-policies') ||
      p.includes('sla-targets') ||
      p.includes('sla-breaches') ||
      p.includes('support/queues') ||
      p.includes('request-types') ||
      p.includes('escalation-rules') ||
      p.includes('support/warranties') ||
      p.includes('handover-packages') ||
      p.includes('support/incidents') ||
      p.includes('support/problems') ||
      p.includes('maintenance-plans') ||
      p.includes('maintenance-windows') ||
      p.includes('maintenance-activities') ||
      p.includes('service-profiles') ||
      p.includes('cost-inputs') ||
      p.includes('support/efforts') ||
      p.includes('knowledge-links') ||
      p.includes('work-links') ||
      p.includes('metric-snapshots'),
    status: 'UI_IMPLEMENTED',
    surface: 'SupportDashboardView / SupportCaseWorkbenchView / SupportConfigurationView',
  },
]

function applyOverride(method, pathStr) {
  for (const o of OVERRIDES) {
    if (o.test(method, pathStr)) {
      return {
        status: o.status,
        surface: o.surface ?? null,
        exceptionId: o.exceptionId ?? null,
      }
    }
  }
  return { status: 'MAPPED', surface: null, exceptionId: null }
}

const rowRe = /^\|\s*`([A-Z]+)`\s*\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|/
const rows = []
let moduleName = 'Unknown'
let section = ''
/** Last **Base:** path — used to expand `.../segment` rows in the contract tables. */
let currentBase = ''

function expandEllipsisPath(raw, base) {
  if (!raw.startsWith('...') && !raw.startsWith('…')) {
    return raw.replace(/^\.\.\./, '').replace(/\.\.\./g, '')
  }
  const rest = raw.replace(/^\.\.\./, '').replace(/^\…/, '')
  if (!base) return rest.startsWith('/') ? rest : `/${rest}`
  const baseClean = base.replace(/\/$/, '')
  if (!rest || rest === '/') return baseClean

  // `.../governance/policies` when base already ends with that suffix
  if (baseClean.endsWith(rest) || baseClean.endsWith(rest.replace(/^\//, ''))) {
    return baseClean
  }

  const segments = rest.split('/').filter(Boolean)
  const baseLast = baseClean.split('/').pop()
  // `.../suites/{id}/archive` when base ends with `/suites`
  if (segments[0] === baseLast) {
    const after = segments.slice(1)
    return after.length ? `${baseClean}/${after.join('/')}` : baseClean
  }

  return `${baseClean}${rest.startsWith('/') ? rest : `/${rest}`}`
}

for (const line of contract.split('\n')) {
  const h1 = line.match(/^#\s+(\d+)\.\s+(.+)/)
  if (h1) {
    moduleName = h1[2].trim()
    continue
  }
  const h2 = line.match(/^##\s+(.+)/)
  if (h2) {
    section = h2[1].trim()
    continue
  }
  const baseMatch = line.match(/Base:\*\*\s*`([^`]+)`/)
  if (baseMatch) {
    currentBase = baseMatch[1].trim()
    continue
  }
  const m = line.match(rowRe)
  if (!m) continue
  const method = m[1]
  let pathStr = m[2]
  if (pathStr.includes('...') || pathStr.startsWith('…')) {
    pathStr = expandEllipsisPath(pathStr, currentBase)
  } else {
    pathStr = pathStr.replace(/^\.\.\./, '').replace(/\.\.\./g, '')
  }
  const description = m[3].replace(/\*\*/g, '').trim()
  const ov = applyOverride(method, pathStr)
  rows.push({
    id: rows.length + 1,
    module: moduleName,
    section,
    method,
    path: pathStr,
    description,
    status: ov.status,
    surface: ov.surface,
    exceptionId: ov.exceptionId,
  })
}

const byStatus = {}
for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'WAVE4_API_CONTRACT.md',
  note: 'Conservative auto-map. Hook Vitest → bump to UI_TESTED manually or via CI.',
  total: rows.length,
  byStatus,
  endpoints: rows,
}

fs.writeFileSync(outJson, JSON.stringify(payload, null, 2))

const byModule = {}
for (const r of rows) {
  if (!byModule[r.module]) byModule[r.module] = { total: 0, statuses: {} }
  byModule[r.module].total++
  byModule[r.module].statuses[r.status] =
    (byModule[r.module].statuses[r.status] ?? 0) + 1
}

const md = [
  '# Wave 4 Coverage Register',
  '',
  `> Auto-generated ${payload.generatedAt} from \`WAVE4_API_CONTRACT.md\`.`,
  `> Re-run: \`node scripts/generate-wave4-coverage-register.mjs\``,
  `> Exceptions: [WAVE4_CONTRACT_EXCEPTIONS.md](./WAVE4_CONTRACT_EXCEPTIONS.md)`,
  '',
  `**Total endpoints:** ${payload.total}`,
  '',
  '## Status rollup',
  '',
  '| Status | Count |',
  '|---|---|',
  ...Object.entries(byStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([s, c]) => `| \`${s}\` | ${c} |`),
  '',
  '## By module',
  '',
  '| Module | Total | UI_IMPLEMENTED | CONTRACT_BLOCKED | MAPPED |',
  '|---|---|---|---|---|',
]

for (const [mod, info] of Object.entries(byModule)) {
  md.push(
    `| ${mod} | ${info.total} | ${info.statuses.UI_IMPLEMENTED ?? 0} | ${info.statuses.CONTRACT_BLOCKED ?? 0} | ${info.statuses.MAPPED ?? 0} |`
  )
}

md.push('', '## CONTRACT_BLOCKED rows', '')
md.push('| # | Module | Method | Path | Exception |')
md.push('|---|---|---|---|---|')
for (const r of rows.filter((x) => x.status === 'CONTRACT_BLOCKED')) {
  md.push(
    `| ${r.id} | ${r.module} | ${r.method} | \`${r.path}\` | ${r.exceptionId ?? '—'} |`
  )
}

md.push(
  '',
  '## Honest reading',
  '',
  '- `UI_IMPLEMENTED` here means FE has a wired surface for that path family — **not** every mutation is tested.',
  '- Hook Vitest exists for Document Hub, Productivity inbox, Governance, Reporting, Knowledge indexing, Quality, Traceability, Portal login/reviews, Trust privacy, Support cases.',
  '- Remaining `MAPPED` rows need dedicated UI or an approved non-UI exception.',
  ''
)

fs.writeFileSync(outMd, md.join('\n'))
console.log(`Wrote ${rows.length} endpoints`)
console.log(byStatus)
