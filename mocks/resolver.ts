/**
 * Mock resolver — maps API URL patterns to mock data.
 *
 * Strategy:
 *   1. Extract the /api/v2/... path from any URL form (absolute, proxy, relative).
 *   2. Strip query params and trailing slashes.
 *   3. Match against registered patterns (order matters — more specific first).
 *   4. For mutations (POST/PATCH/PUT/DELETE) return a generic success unless a
 *      specific mock override is registered.
 *
 * All mock data is imported from ./data/*.ts — no network calls.
 */

import * as authData from './data/auth'
import * as orgData from './data/org'
import * as projectData from './data/project'
import * as sessionData from './data/session'
import * as documentData from './data/document'
import * as governanceData from './data/governance'
import * as adminData from './data/admin'
import * as miscData from './data/misc'

// ---------------------------------------------------------------------------
// Path extraction
// ---------------------------------------------------------------------------

/**
 * Normalize any URL form to just the /api/v2/... path without query params.
 * Examples:
 *   "http://localhost:3001/api/v2/profile"   → "/api/v2/profile"
 *   "/api/proxy/profile"                     → "/api/v2/profile"
 *   "/api/v2/orgs/123/projects"              → "/api/v2/orgs/123/projects"
 */
function normalizePath(url: string): string {
  // Proxy form: /api/proxy/<rest>
  const proxyMatch = url.match(/\/api\/proxy\/(.+?)(\?.*)?$/)
  if (proxyMatch) return `/api/v2/${proxyMatch[1]}`

  // Absolute or relative /api/v2/ form
  const v2Match = url.match(/\/api\/v2\/(.+?)(\?.*)?$/)
  if (v2Match) return `/api/v2/${v2Match[1]}`

  return url
}

// ---------------------------------------------------------------------------
// Pattern matching
// ---------------------------------------------------------------------------

type RouteParams = Record<string, string>

/**
 * Match a normalized path against a pattern with :param segments.
 * Returns extracted params or null if no match.
 */
function match(path: string, pattern: string): RouteParams | null {
  const pathParts = path.replace(/\/$/, '').split('/')
  const patternParts = pattern.replace(/\/$/, '').split('/')

  if (pathParts.length !== patternParts.length) return null

  const params: RouteParams = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i])
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

// ---------------------------------------------------------------------------
// Route table — order matters (most specific first)
// ---------------------------------------------------------------------------

type MockHandler = (params: RouteParams, method: string, body?: unknown) => unknown

interface Route {
  pattern: string
  handler: MockHandler
}

const ROUTES: Route[] = [
  // ── Auth / Profile ─────────────────────────────────────────────────────
  {
    pattern: '/api/v2/profile',
    handler: (_, method) => {
      if (method === 'GET') return authData.MOCK_PROFILE
      return authData.MOCK_PROFILE
    },
  },
  {
    pattern: '/api/v2/auth/me',
    handler: () => authData.MOCK_AUTH_ME,
  },
  {
    pattern: '/api/v2/auth/login',
    handler: (_, _m, body) => ({
      user: authData.MOCK_AUTH_ME,
      session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' },
    }),
  },
  {
    pattern: '/api/v2/auth/register',
    handler: () => ({
      user: authData.MOCK_AUTH_ME,
      session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' },
    }),
  },
  {
    pattern: '/api/v2/auth/logout',
    handler: () => null,
  },
  {
    pattern: '/api/v2/auth/forgot-password',
    handler: () => ({ message: 'Reset email sent.' }),
  },

  // ── Orgs ───────────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs',
    handler: (_, method, body) => {
      if (method === 'POST') return orgData.MOCK_ORG_DETAIL
      return orgData.MOCK_ORG_LIST
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId',
    handler: () => orgData.MOCK_ORG_DETAIL,
  },
  {
    pattern: '/api/v2/orgs/:orgId/default',
    handler: () => ({ default_org_id: orgData.MOCK_ORG_DETAIL.id }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/members',
    handler: (_, method, body) => {
      if (method === 'POST') return orgData.MOCK_ORG_MEMBERS.items[0]
      return orgData.MOCK_ORG_MEMBERS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/members/:userId',
    handler: () => orgData.MOCK_ORG_MEMBERS.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/leave',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/invites',
    handler: (_, method) => {
      if (method === 'POST') return orgData.MOCK_ORG_INVITES.items[0]
      return orgData.MOCK_ORG_INVITES
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/invites/:inviteId/revoke',
    handler: () => null,
  },
  {
    pattern: '/api/v2/org-invites/accept',
    handler: () => ({ org_id: orgData.MOCK_ORG_DETAIL.id }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/mentionable-users',
    handler: () => orgData.MOCK_MENTIONABLE_USERS,
  },

  // ── Actors ─────────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/actors',
    handler: (_, method) => {
      if (method === 'POST') return projectData.MOCK_ACTORS.items[0]
      return projectData.MOCK_ACTORS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/actors/:actorId',
    handler: () => projectData.MOCK_ACTORS.items[0],
  },

  // ── Projects ────────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/projects',
    handler: (_, method) => {
      if (method === 'POST') return projectData.MOCK_PROJECT_1
      return projectData.MOCK_PROJECT_LIST
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId',
    handler: () => projectData.MOCK_PROJECT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/questions',
    handler: (_, method) => {
      if (method === 'POST') return { id: 'mock-q-new', prompt: 'New question', section: 'General' }
      return projectData.MOCK_PROJECT_QUESTIONS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/questions/reorder',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/questions/:questionId',
    handler: () => Object.values(projectData.MOCK_PROJECT_QUESTIONS).flat()[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/members',
    handler: (_, method) => {
      if (method === 'POST') return projectData.MOCK_PROJECT_MEMBERS.items[0]
      return projectData.MOCK_PROJECT_MEMBERS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/members/:userId',
    handler: () => projectData.MOCK_PROJECT_MEMBERS.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/scope',
    handler: (_, method) => {
      if (method === 'PATCH' || method === 'PUT') return projectData.MOCK_PROJECT_SCOPE
      return projectData.MOCK_PROJECT_SCOPE
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/requirements',
    handler: (_, method) => {
      if (method === 'POST') return projectData.MOCK_REQUIREMENTS.items[0]
      return projectData.MOCK_REQUIREMENTS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/requirements/:reqId',
    handler: () => projectData.MOCK_REQUIREMENTS.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/requirements/:reqId/actors',
    handler: () => ({ items: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/requirements/:reqId/modules',
    handler: () => ({ items: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/trace',
    handler: () => miscData.MOCK_PROJECT_TRACE,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/trace-links',
    handler: (_, method) => {
      if (method === 'POST') return {}
      return projectData.MOCK_TRACE_LINKS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/trace-links/:linkId',
    handler: () => null,
  },

  // ── Sessions ────────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions',
    handler: (_, method) => {
      if (method === 'POST') return sessionData.MOCK_SESSION_DETAIL
      return sessionData.MOCK_SESSION_LIST
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/from-revision',
    handler: () => sessionData.MOCK_SESSION_DETAIL,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId',
    handler: () => sessionData.MOCK_SESSION_DETAIL,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/answers',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/submit',
    handler: () => ({ ...sessionData.MOCK_SESSION_DETAIL, status: 'submitted' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/lock',
    handler: () => ({ ...sessionData.MOCK_SESSION_DETAIL, status: 'locked' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/reopen',
    handler: () => ({ ...sessionData.MOCK_SESSION_DETAIL, status: 'in_progress' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/progress',
    handler: () => sessionData.MOCK_SESSION_PROGRESS,
  },

  // ── AI Session Actions ──────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve',
    handler: () => ({ batch_token: 'mock-batch-token', proposed_value: '', run_id: 'mock-run-ai' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve/commit',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/clarity/summary',
    handler: () => sessionData.MOCK_CLARITY_SUMMARY,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/clarity/assess-one',
    handler: () => ({ question_id: '', score: 80, feedback: 'Mock clarity assessment.' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai/questions/generate',
    handler: () => ({ batch_token: 'mock-batch-token', items: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai/questions/commit',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai/intakes/upload-url',
    handler: () => ({ upload_url: 'https://mock-storage.example.com/upload', key: 'mock-key' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai/intakes',
    handler: () => ({ items: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai/impact-analysis',
    handler: () => ({ batch_token: 'mock-batch-token', items: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai/impact-analysis/commit',
    handler: () => null,
  },

  // ── Project Sections ────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sections',
    handler: (_, method) => {
      if (method === 'POST') return documentData.MOCK_PROJECT_SECTIONS.items[0]
      return documentData.MOCK_PROJECT_SECTIONS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sections/:sectionId',
    handler: () => documentData.MOCK_PROJECT_SECTIONS.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sections/:sectionId/archive',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sections/reorder',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sections/create-defaults',
    handler: () => documentData.MOCK_PROJECT_SECTIONS,
  },

  // ── Documents ───────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/documents',
    handler: (_, method) => {
      if (method === 'POST') return documentData.MOCK_DOCUMENT_1
      return documentData.MOCK_DOCUMENT_LIST
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/export',
    handler: () => ({ download_url: 'https://mock-storage.example.com/export.zip' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId',
    handler: (_, method) => {
      if (method === 'DELETE') return null
      return documentData.MOCK_DOCUMENT_1
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/archive',
    handler: () => ({ ...documentData.MOCK_DOCUMENT_1, status: 'archived' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/restore',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/export',
    handler: () => ({ download_url: 'https://mock-storage.example.com/doc-export.docx' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/links',
    handler: (_, method) => {
      if (method === 'POST') return {}
      return documentData.MOCK_DOCUMENT_LINKS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/links/:linkId/archive',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/links/:linkId/restore',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/deliverable-metadata',
    handler: () => ({
      document_id: 'mock-doc-001',
      readiness_status: 'ready',
      warnings: [],
      can_create: true,
    }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/deliverable-readiness/refresh',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/ai/summarize',
    handler: () => ({ summary: 'Mock AI summary of document.' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/ai/related',
    handler: () => documentData.MOCK_RELATED_DOCUMENTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/ai/metadata',
    handler: () => documentData.MOCK_DOCUMENT_AI_METADATA,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/comments',
    handler: (_, method) => {
      if (method === 'POST') return { id: 'mock-comment-new', content: '' }
      return documentData.MOCK_COLLABORATION_COMMENTS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/comments/:commentId',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/comments/:commentId/resolve',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/comments/:commentId/reopen',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/suggestions',
    handler: () => documentData.MOCK_COLLABORATION_SUGGESTIONS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/suggestions/:suggestionId/accept',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/suggestions/:suggestionId/reject',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/activity',
    handler: () => documentData.MOCK_COLLABORATION_ACTIVITY,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/collaborators',
    handler: (_, method) => {
      if (method === 'POST') return documentData.MOCK_COLLABORATORS.items[0]
      return documentData.MOCK_COLLABORATORS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/collaborators/:userId',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/collaboration/share',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents',
    handler: (_, method) => {
      if (method === 'POST') return documentData.MOCK_DOCUMENT_1
      return documentData.MOCK_DOCUMENT_LIST
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/grouped',
    handler: () => documentData.MOCK_GROUPED_DOCUMENTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/attach',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/from-template',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/reorder-in-section',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/deliverables',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/deliverables/templates',
    handler: () => documentData.MOCK_DELIVERABLE_TEMPLATES,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/deliverables/context',
    handler: () => documentData.MOCK_DELIVERABLE_CONTEXT,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/deliverables/preview',
    handler: () => ({ preview: { type: 'doc', content: [] } }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/deliverables/picker',
    handler: () => documentData.MOCK_DOCUMENT_LIST,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/deliverables/history',
    handler: () => documentData.MOCK_DOCUMENT_LIST,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/handoff/export',
    handler: () => ({ download_url: 'https://mock-storage.example.com/handoff.zip' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/:documentId',
    handler: (_, method) => {
      if (method === 'DELETE') return null
      return documentData.MOCK_DOCUMENT_1
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/:documentId/pin',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/documents/:documentId/section',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai-documents/project-brief',
    handler: () => ({ ...documentData.MOCK_DOCUMENT_1, id: 'mock-doc-ai-brief' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai-documents/summarize-documents',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai-documents/qa-summary',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai-documents/clarity-report',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai-documents/readiness-report',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/ai-documents/from-template',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/evidence/export',
    handler: () => ({ download_url: 'https://mock-storage.example.com/evidence.zip' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/requirements/:reqId/evidence/export',
    handler: () => ({ download_url: 'https://mock-storage.example.com/req-evidence.zip' }),
  },

  // ── Document Links ──────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/document-links/link-counts',
    handler: () => documentData.MOCK_LINK_COUNTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-links/entity-link-counts',
    handler: () => documentData.MOCK_ENTITY_LINK_COUNTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-links/bulk',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-links/by-entity',
    handler: () => documentData.MOCK_DOCUMENT_LINKS,
  },

  // ── Document Hub ────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/document-hub',
    handler: () => documentData.MOCK_DOCUMENT_HUB,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-hub/deliverables/context',
    handler: () => documentData.MOCK_DELIVERABLE_CONTEXT,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-hub/deliverables/resolve-selection',
    handler: () => ({ items: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-hub/export',
    handler: () => ({ download_url: 'https://mock-storage.example.com/hub-export.zip' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-hub/export/preview',
    handler: () => ({ document_count: 2, estimated_size_kb: 128 }),
  },

  // ── AI Documents (save-preview) ─────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/ai-documents/save-preview',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },

  // ── Document Templates ──────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/document-templates',
    handler: (_, method) => {
      if (method === 'POST') return documentData.MOCK_TEMPLATE_DETAIL
      return documentData.MOCK_TEMPLATES_LIST
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/management',
    handler: () => documentData.MOCK_TEMPLATES_LIST,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/create-document',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/variables',
    handler: () => documentData.MOCK_TEMPLATE_VARIABLES,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/:templateId',
    handler: (_, method) => {
      if (method === 'DELETE') return null
      return documentData.MOCK_TEMPLATE_DETAIL
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/:templateId/archive',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/:templateId/publish',
    handler: () => ({ ...documentData.MOCK_TEMPLATE_DETAIL, status: 'published' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/:templateId/unpublish',
    handler: () => ({ ...documentData.MOCK_TEMPLATE_DETAIL, status: 'draft' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/:templateId/duplicate',
    handler: () => ({ ...documentData.MOCK_TEMPLATE_DETAIL, id: 'mock-template-dup' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/document-templates/:templateId/preview-variables',
    handler: () => documentData.MOCK_TEMPLATE_VARIABLES,
  },

  // ── Governance ──────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/governance',
    handler: (_, method) => {
      if (method === 'POST') return governanceData.MOCK_GOVERNANCE_POLICY_DETAIL
      return governanceData.MOCK_GOVERNANCE_POLICIES
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/status',
    handler: () => governanceData.MOCK_GOVERNANCE_STATUS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/presets',
    handler: () => governanceData.MOCK_GOVERNANCE_PRESETS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/presets/:presetKey/preview',
    handler: () => governanceData.MOCK_GOVERNANCE_PRESETS.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/presets/apply',
    handler: () => governanceData.MOCK_GOVERNANCE_POLICY_DETAIL,
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/evaluate',
    handler: () => governanceData.MOCK_GOVERNANCE_EVALUATE,
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/simulate',
    handler: () => ({ ...governanceData.MOCK_GOVERNANCE_EVALUATE, simulation: true }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/conditions/validate',
    handler: () => ({ valid: true, errors: [], normalized: {} }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/:policyId',
    handler: (_, method) => {
      if (method === 'DELETE') return null
      return governanceData.MOCK_GOVERNANCE_POLICY_DETAIL
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/:policyId/rules',
    handler: (_, method) => {
      if (method === 'POST') return governanceData.MOCK_GOVERNANCE_POLICY_DETAIL.rules[0]
      return { items: governanceData.MOCK_GOVERNANCE_POLICY_DETAIL.rules }
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/:policyId/rules/:ruleId',
    handler: () => governanceData.MOCK_GOVERNANCE_POLICY_DETAIL.rules[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/:policyId/activate',
    handler: () => ({ ...governanceData.MOCK_GOVERNANCE_POLICY_DETAIL, status: 'active' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/governance/:policyId/deactivate',
    handler: () => ({ ...governanceData.MOCK_GOVERNANCE_POLICY_DETAIL, status: 'inactive' }),
  },

  // ── Access / Permissions ────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/access/effective-permissions',
    handler: () => miscData.MOCK_EFFECTIVE_PERMISSIONS,
  },

  // ── Landscape ───────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/nodes',
    handler: (_, method) => {
      if (method === 'POST') return { id: 'mock-node-new' }
      return miscData.MOCK_LANDSCAPE_NODES
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/nodes/positions',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/nodes/:nodeId',
    handler: () => null,
  },
  {
    pattern: '/api/v2/orgs/:orgId/node-links',
    handler: (_, method) => {
      if (method === 'POST') return { id: 'mock-nodelink-new' }
      return miscData.MOCK_LANDSCAPE_NODE_LINKS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/node-links/:linkId',
    handler: () => null,
  },

  // ── Agent Control ────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/metadata',
    handler: () => miscData.MOCK_AGENT_CONTROL_METADATA,
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/presets',
    handler: () => miscData.MOCK_AGENT_CONTROL_PRESETS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/presets/:presetKey/preview',
    handler: () => miscData.MOCK_AGENT_CONTROL_PRESETS.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/presets/apply',
    handler: () => ({
      model_policies: miscData.MOCK_ORG_MODEL_POLICIES.items,
      agents: miscData.MOCK_ORG_AGENTS_LIST.items,
    }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/agents',
    handler: (_, method) => {
      if (method === 'POST') return miscData.MOCK_ORG_AGENTS_LIST.items[0]
      return miscData.MOCK_ORG_AGENTS_LIST
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/agents/:agentId',
    handler: () => miscData.MOCK_ORG_AGENTS_LIST.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/model-policies',
    handler: (_, method) => {
      if (method === 'POST') return miscData.MOCK_ORG_MODEL_POLICIES.items[0]
      return miscData.MOCK_ORG_MODEL_POLICIES
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/model-policies/:policyId',
    handler: () => miscData.MOCK_ORG_MODEL_POLICIES.items[0],
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/runtime/metadata',
    handler: () => ({
      supported_providers: miscData.MOCK_AGENT_CONTROL_METADATA.providers,
      supported_modes: miscData.MOCK_AGENT_CONTROL_METADATA.modes,
    }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/runtime/resolution',
    handler: () => ({ agents: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/runtime/usage',
    handler: () => miscData.MOCK_RUNTIME_USAGE_SUMMARY,
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/prompt-registry',
    handler: () => miscData.MOCK_PROMPT_REGISTRY,
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/prompt-templates',
    handler: () => ({ items: [] }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/agent-control/agents/:agentId/runs',
    handler: () => ({ items: [], page: { limit: 20, offset: 0, total: 0 } }),
  },

  // ── Admin Templates ──────────────────────────────────────────────────────
  {
    pattern: '/api/v2/admin/templates',
    handler: (_, method) => {
      if (method === 'POST') return adminData.MOCK_ADMIN_TEMPLATE_DETAIL
      return adminData.MOCK_ADMIN_TEMPLATES_LIST
    },
  },
  {
    pattern: '/api/v2/admin/templates/:templateId',
    handler: (_, method) => {
      if (method === 'DELETE') return null
      return adminData.MOCK_ADMIN_TEMPLATE_DETAIL
    },
  },
  {
    pattern: '/api/v2/admin/templates/:templateId/questions',
    handler: (_, method) => {
      if (method === 'POST') return { id: 'mock-q-admin-new' }
      return { items: adminData.MOCK_ADMIN_TEMPLATE_DETAIL.questions }
    },
  },
  {
    pattern: '/api/v2/admin/templates/:templateId/publish',
    handler: () => ({ ...adminData.MOCK_ADMIN_TEMPLATE_DETAIL, status: 'published' }),
  },
  {
    pattern: '/api/v2/admin/templates/:templateId/duplicate',
    handler: () => ({ ...adminData.MOCK_ADMIN_TEMPLATE_DETAIL, id: 'mock-admin-template-dup' }),
  },
  {
    pattern: '/api/v2/admin/questions/:questionId',
    handler: () => adminData.MOCK_ADMIN_TEMPLATE_DETAIL.questions[0],
  },

  // ── Admin AI Configs ─────────────────────────────────────────────────────
  {
    pattern: '/api/v2/admin/ai/configs',
    handler: () => adminData.MOCK_AI_CONFIGS_LIST,
  },
  {
    pattern: '/api/v2/admin/ai/configs/:purpose',
    handler: () => adminData.MOCK_AI_CONFIGS_LIST.items[0],
  },
  {
    pattern: '/api/v2/admin/ai/configs/:purpose/test-run',
    handler: () => ({ output: 'Mock AI test output.', run_id: 'mock-run-test', status: 'success' }),
  },

  // ── Admin AI Runs ─────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/admin/ai/runs',
    handler: () => adminData.MOCK_AI_RUNS_LIST,
  },
  {
    pattern: '/api/v2/admin/ai/runs/:runId',
    handler: () => adminData.MOCK_AI_RUN_DETAIL,
  },

  // ── Admin AI Agents ───────────────────────────────────────────────────────
  {
    pattern: '/api/v2/admin/ai-agents/summary',
    handler: () => adminData.MOCK_AI_AGENTS_SUMMARY,
  },
  {
    pattern: '/api/v2/admin/ai-agents',
    handler: () => adminData.MOCK_AI_AGENTS_LIST,
  },
  {
    pattern: '/api/v2/admin/ai-agents/:agentId',
    handler: () => adminData.MOCK_AI_AGENT_DETAIL,
  },
  {
    pattern: '/api/v2/admin/ai-agents/:agentId/versions/draft-from-published',
    handler: () => adminData.MOCK_AI_AGENT_VERSION_DETAIL,
  },
  {
    pattern: '/api/v2/admin/ai-agents/:agentId/versions/:versionId',
    handler: () => adminData.MOCK_AI_AGENT_VERSION_DETAIL,
  },
  {
    pattern: '/api/v2/admin/ai-agents/:agentId/versions/:versionId/publish',
    handler: () => ({ ...adminData.MOCK_AI_AGENT_VERSION_DETAIL, status: 'published' }),
  },
  {
    pattern: '/api/v2/admin/ai-agents/:agentId/versions/:versionId/archive',
    handler: () => ({ ...adminData.MOCK_AI_AGENT_VERSION_DETAIL, status: 'archived' }),
  },
  {
    pattern: '/api/v2/admin/ai-agents/models',
    handler: () => adminData.MOCK_AI_MODELS_LIST,
  },

  // ── Admin AI Budgets ──────────────────────────────────────────────────────
  {
    pattern: '/api/v2/admin/ai/budgets/overview',
    handler: () => adminData.MOCK_AI_BUDGET_OVERVIEW,
  },
  {
    pattern: '/api/v2/admin/ai/budgets',
    handler: (_, method) => {
      if (method === 'POST') return adminData.MOCK_AI_BUDGETS_LIST.items[0]
      return adminData.MOCK_AI_BUDGETS_LIST
    },
  },
  {
    pattern: '/api/v2/admin/ai/budgets/:budgetId',
    handler: () => adminData.MOCK_AI_BUDGETS_LIST.items[0],
  },

  // ── Controlled Lists ──────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/controlled-lists',
    handler: (_, method) => {
      if (method === 'POST') return miscData.MOCK_CONTROLLED_LISTS.items[0]
      return miscData.MOCK_CONTROLLED_LISTS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/controlled-lists/:listId',
    handler: () => miscData.MOCK_CONTROLLED_LIST_DETAIL,
  },
  {
    pattern: '/api/v2/orgs/:orgId/controlled-lists/:listId/values',
    handler: (_, method) => {
      if (method === 'POST') return miscData.MOCK_CONTROLLED_LIST_DETAIL.values[0]
      return { items: miscData.MOCK_CONTROLLED_LIST_DETAIL.values }
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/controlled-lists/:listId/values/:valueId',
    handler: () => miscData.MOCK_CONTROLLED_LIST_DETAIL.values[0],
  },

  // ── Stakeholders ──────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/stakeholders',
    handler: (_, method) => {
      if (method === 'POST') return miscData.MOCK_STAKEHOLDERS.items[0]
      return miscData.MOCK_STAKEHOLDERS
    },
  },
  {
    pattern: '/api/v2/orgs/:orgId/stakeholders/:stakeholderId',
    handler: () => miscData.MOCK_STAKEHOLDERS.items[0],
  },

  // ── Audit Events ──────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/audit',
    handler: () => miscData.MOCK_AUDIT_EVENTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/audit/:entityType/:entityId',
    handler: () => miscData.MOCK_AUDIT_EVENTS,
  },

  // ── Attachments ───────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/items/:itemId/attachments',
    handler: () => miscData.MOCK_ATTACHMENTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/sections/:sectionId/attachments',
    handler: () => miscData.MOCK_ATTACHMENTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/items/:itemId/attachments/upload-url',
    handler: () => ({ upload_url: 'https://mock-storage.example.com/upload', key: 'mock-attachment' }),
  },

  // ── Change Requests ───────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/change-requests',
    handler: () => miscData.MOCK_CHANGE_REQUESTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/change-requests/:crId',
    handler: () => ({ id: 'mock-cr-001', status: 'pending' }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/change-requests',
    handler: () => miscData.MOCK_CHANGE_REQUESTS,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/versions',
    handler: () => ({ items: [], page: { limit: 20, offset: 0, total: 0 } }),
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/versions/:versionId/baseline',
    handler: () => documentData.MOCK_DOCUMENT_1,
  },
  {
    pattern: '/api/v2/orgs/:orgId/documents/:documentId/versions/:versionId/outline',
    handler: () => ({ items: [] }),
  },

  // ── Traceability ───────────────────────────────────────────────────────────
  {
    pattern: '/api/v2/orgs/:orgId/projects/:projectId/traceability',
    handler: () => miscData.MOCK_PROJECT_TRACE,
  },
  {
    pattern: '/api/v2/orgs/:orgId/items/:itemId',
    handler: () => ({ id: 'mock-item-001', title: 'Mock Item' }),
  },
]

// ---------------------------------------------------------------------------
// Main resolve function
// ---------------------------------------------------------------------------

/**
 * Resolve a URL + method to mock data.
 * Returns `undefined` if no route matched (caller should let the request pass through).
 */
export function resolveMock(url: string, method = 'GET', body?: unknown): unknown {
  const path = normalizePath(url)

  for (const route of ROUTES) {
    const params = match(path, route.pattern)
    if (params !== null) {
      return route.handler(params, method.toUpperCase(), body)
    }
  }

  // No match — return undefined to signal "no mock for this URL"
  return undefined
}
