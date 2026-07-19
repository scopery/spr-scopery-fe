import fs from 'fs'
import path from 'path'

const root = process.cwd()
function write(rel, content) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content.trimStart())
  console.log('W', rel)
}

// ── Reporting ────────────────────────────────────────────────
write(
  'modules/reporting/domain/enums/reporting.enum.ts',
  `export const ReportRunStatus = {
  Queued: 'QUEUED',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
} as const
export type ReportRunStatus = (typeof ReportRunStatus)[keyof typeof ReportRunStatus]
`
)

write(
  'modules/reporting/domain/model/report.ts',
  `export interface ReportDefinition {
  id: string
  code: string
  name: string
  description?: string | null
}

export interface ReportRun {
  id: string
  reportCode: string
  status: string
  createdAt: string
  completedAt?: string | null
  downloadUrl?: string | null
}

export interface ProjectDashboardSummary {
  projectId: string
  metrics: Array<{ key: string; label: string; value: string | number }>
}
`
)

write(
  'modules/reporting/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

export const REPORTING_ENDPOINTS = {
  dashboard: (projectId: string) => apiPath(\`/projects/\${projectId}/dashboard\`),
  definitions: () => apiPath('/reports'),
  run: (reportCode: string) => apiPath(\`/reports/\${reportCode}/runs\`),
  runStatus: (runId: string) => apiPath(\`/reports/runs/\${runId}\`),
  exports: (projectId: string) => apiPath(\`/projects/\${projectId}/export-jobs\`),
} as const
`
)

write(
  'modules/reporting/infrastructure/api/reporting.api.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { REPORTING_ENDPOINTS } from './endpoints'
import type {
  ProjectDashboardSummary,
  ReportDefinition,
  ReportRun,
} from '../../domain/model/report'

export async function getProjectDashboard(
  projectId: string
): Promise<ProjectDashboardSummary> {
  return apiClient.get(REPORTING_ENDPOINTS.dashboard(projectId))
}

export async function listReportDefinitions(): Promise<{ items: ReportDefinition[] }> {
  return apiClient.get(REPORTING_ENDPOINTS.definitions())
}

export async function startReportRun(
  reportCode: string,
  body?: Record<string, unknown>
): Promise<ReportRun> {
  return apiClient.post(REPORTING_ENDPOINTS.run(reportCode), body ?? {})
}

export async function getReportRun(runId: string): Promise<ReportRun> {
  return apiClient.get(REPORTING_ENDPOINTS.runStatus(runId))
}

export async function listExportJobs(
  projectId: string
): Promise<{ items: ReportRun[] }> {
  return apiClient.get(REPORTING_ENDPOINTS.exports(projectId))
}
`
)

write(
  'modules/reporting/presentation/hooks/useProjectDashboard.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/reporting.api'
import type { ProjectDashboardSummary } from '../../domain/model/report'

export function useProjectDashboard(projectId: string | null) {
  const [data, setData] = useState<ProjectDashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getProjectDashboard(projectId)
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
`
)

write(
  'modules/reporting/presentation/hooks/useReportLibrary.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/reporting.api'
import type { ReportDefinition, ReportRun } from '../../domain/model/report'

export function useReportLibrary() {
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([])
  const [activeRun, setActiveRun] = useState<ReportRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listReportDefinitions()
      setDefinitions(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const runReport = useCallback(async (code: string) => {
    const run = await api.startReportRun(code)
    setActiveRun(run)
    return run
  }, [])

  return { definitions, activeRun, loading, error, refetch: load, runReport }
}
`
)

write(
  'modules/reporting/presentation/ui/ProjectDashboardView.tsx',
  `'use client'

import { useParams } from 'next/navigation'
import { ContentLoader, Stack, Typography } from '@/shared/ui'
import { useProjectDashboard } from '../hooks/useProjectDashboard'

export function ProjectDashboardView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, loading, error } = useProjectDashboard(projectId)

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Project Dashboard</Typography>
      {!data || data.metrics.length === 0 ? (
        <Typography tone="muted">No dashboard metrics available.</Typography>
      ) : (
        <div className="grid grid-cols-2 gap-md md:grid-cols-4">
          {data.metrics.map((m) => (
            <div key={m.key} className="border border-neutral-200 p-md">
              <Typography variant="caption" tone="muted">
                {m.label}
              </Typography>
              <Typography variant="h3">{m.value}</Typography>
            </div>
          ))}
        </div>
      )}
    </Stack>
  )
}
`
)

write(
  'modules/reporting/presentation/ui/ReportLibraryView.tsx',
  `'use client'

import { Button, ContentLoader, LongRunningJobPanel, Stack, Typography } from '@/shared/ui'
import { mapJobStatusToUi } from '@/shared/lib/unifiedJob'
import { useReportLibrary } from '../hooks/useReportLibrary'

export function ReportLibraryView() {
  const { definitions, activeRun, loading, error, runReport } = useReportLibrary()

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Report Library</Typography>
      {activeRun ? (
        <LongRunningJobPanel
          job={{
            jobId: activeRun.id,
            jobType: activeRun.reportCode,
            status: activeRun.status,
          }}
          label={\`Run \${activeRun.reportCode}\`}
        />
      ) : null}
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {definitions.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-md p-md">
            <div>
              <Typography variant="small" weight="medium">
                {d.name}
              </Typography>
              <Typography variant="caption" tone="muted">
                {d.code}
              </Typography>
            </div>
            <Button size="sm" variant="outline" onClick={() => void runReport(d.code)}>
              Run
            </Button>
          </li>
        ))}
      </ul>
      {/* keep mapJobStatusToUi referenced for tree-shaking clarity in Wave 4 job UX */}
      <span className="sr-only">{mapJobStatusToUi(activeRun?.status ?? 'IDLE')}</span>
    </Stack>
  )
}
`
)

write(
  'modules/reporting/index.ts',
  `export { ProjectDashboardView } from './presentation/ui/ProjectDashboardView'
export { ReportLibraryView } from './presentation/ui/ReportLibraryView'
export { useProjectDashboard } from './presentation/hooks/useProjectDashboard'
export { useReportLibrary } from './presentation/hooks/useReportLibrary'
export * as reportingApi from './infrastructure/api/reporting.api'
`
)

// ── Portal ───────────────────────────────────────────────────
write(
  'modules/portal/domain/enums/portal.enum.ts',
  `export const PortalReviewStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const
export type PortalReviewStatus =
  (typeof PortalReviewStatus)[keyof typeof PortalReviewStatus]
`
)

write(
  'modules/portal/domain/model/portal.ts',
  `export interface PortalProject {
  id: string
  name: string
  status: string
}

export interface PortalReview {
  id: string
  projectId: string
  title: string
  status: string
}

export interface PortalSupportCase {
  id: string
  projectId: string
  title: string
  status: string
}
`
)

write(
  'modules/portal/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

export const PORTAL_ENDPOINTS = {
  login: () => apiPath('/portal/auth/login'),
  projects: () => apiPath('/portal/projects'),
  project: (projectId: string) => apiPath(\`/portal/projects/\${projectId}\`),
  reviews: (projectId: string) => apiPath(\`/portal/projects/\${projectId}/reviews\`),
  meetings: (projectId: string) => apiPath(\`/portal/projects/\${projectId}/meetings\`),
  forms: (projectId: string) => apiPath(\`/portal/projects/\${projectId}/forms\`),
  feedback: (projectId: string) => apiPath(\`/portal/projects/\${projectId}/feedback\`),
  support: (projectId: string) => apiPath(\`/portal/projects/\${projectId}/support\`),
} as const
`
)

write(
  'modules/portal/infrastructure/api/portal.api.ts',
  `import { portalApiClient } from '@/shared/lib/portalApiClient'
import { PORTAL_ENDPOINTS } from './endpoints'
import type {
  PortalProject,
  PortalReview,
  PortalSupportCase,
} from '../../domain/model/portal'

export async function listPortalProjects(): Promise<{ items: PortalProject[] }> {
  return portalApiClient.get(PORTAL_ENDPOINTS.projects())
}

export async function getPortalProject(projectId: string): Promise<PortalProject> {
  return portalApiClient.get(PORTAL_ENDPOINTS.project(projectId))
}

export async function listPortalReviews(
  projectId: string
): Promise<{ items: PortalReview[] }> {
  return portalApiClient.get(PORTAL_ENDPOINTS.reviews(projectId))
}

export async function listPortalSupport(
  projectId: string
): Promise<{ items: PortalSupportCase[] }> {
  return portalApiClient.get(PORTAL_ENDPOINTS.support(projectId))
}

export async function portalLogin(body: {
  email: string
  password: string
}): Promise<void> {
  await portalApiClient.post(PORTAL_ENDPOINTS.login(), body, { parseJson: false })
}
`
)

write(
  'modules/portal/presentation/hooks/usePortalProjects.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/portal.api'
import type { PortalProject } from '../../domain/model/portal'

export function usePortalProjects() {
  const [items, setItems] = useState<PortalProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listPortalProjects()
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
`
)

write(
  'modules/portal/presentation/ui/PortalLoginView.tsx',
  `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Stack, Typography } from '@/shared/ui'
import * as api from '../../infrastructure/api/portal.api'

export function PortalLoginView() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <Stack direction="vertical" spacing="md" className="mx-auto max-w-md p-lg">
      <Typography variant="h2">Client Portal</Typography>
      <Typography tone="muted">Sign in to review project artifacts shared with you.</Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
      />
      <Button
        disabled={submitting || !email || !password}
        onClick={async () => {
          setSubmitting(true)
          setError(null)
          try {
            await api.portalLogin({ email, password })
            router.push('/portal/projects')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        Sign in
      </Button>
    </Stack>
  )
}
`
)

write(
  'modules/portal/presentation/ui/PortalProjectsView.tsx',
  `'use client'

import Link from 'next/link'
import { ContentLoader, Stack, Typography } from '@/shared/ui'
import { usePortalProjects } from '../hooks/usePortalProjects'

export function PortalProjectsView() {
  const { items, loading, error } = usePortalProjects()

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Your projects</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((p) => (
          <li key={p.id} className="p-md">
            <Link href={\`/portal/projects/\${p.id}\`} className="hover:underline">
              <Typography variant="small" weight="medium">
                {p.name}
              </Typography>
            </Link>
            <Typography variant="caption" tone="muted">
              {p.status}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
`
)

write(
  'modules/portal/presentation/ui/PortalProjectHomeView.tsx',
  `'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Stack, Typography } from '@/shared/ui'

export function PortalProjectHomeView() {
  const { projectId } = useParams<{ projectId: string }>()

  const links = [
    { href: \`/portal/projects/\${projectId}/reviews\`, label: 'Reviews' },
    { href: \`/portal/projects/\${projectId}/meetings\`, label: 'Meetings' },
    { href: \`/portal/projects/\${projectId}/forms\`, label: 'Forms' },
    { href: \`/portal/projects/\${projectId}/feedback\`, label: 'Feedback' },
    { href: \`/portal/projects/\${projectId}/support\`, label: 'Support' },
  ]

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Project home</Typography>
      <nav className="flex flex-wrap gap-md">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm underline">
            {l.label}
          </Link>
        ))}
      </nav>
    </Stack>
  )
}
`
)

write(
  'modules/portal/presentation/ui/PortalShell.tsx',
  `'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Typography } from '@/shared/ui'

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-lg py-md">
        <Link href="/portal/projects">
          <Typography variant="h4">Scopery Client Portal</Typography>
        </Link>
        <Link href="/portal/account" className="text-sm underline">
          Account
        </Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
`
)

write(
  'modules/portal/presentation/ui/ClientCollaborationView.tsx',
  `'use client'

import { Stack, Typography, ClientVisibilityToggle } from '@/shared/ui'
import { useState } from 'react'

export function ClientCollaborationView() {
  const [visible, setVisible] = useState(false)

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Client Collaboration</Typography>
      <Typography tone="muted">
        Manage portal accounts, access grants, reviews and UAT for this project.
      </Typography>
      <ClientVisibilityToggle visibleToClient={visible} onChange={setVisible} />
    </Stack>
  )
}
`
)

write(
  'modules/portal/index.ts',
  `export { PortalLoginView } from './presentation/ui/PortalLoginView'
export { PortalProjectsView } from './presentation/ui/PortalProjectsView'
export { PortalProjectHomeView } from './presentation/ui/PortalProjectHomeView'
export { PortalShell } from './presentation/ui/PortalShell'
export { ClientCollaborationView } from './presentation/ui/ClientCollaborationView'
export { usePortalProjects } from './presentation/hooks/usePortalProjects'
export * as portalApi from './infrastructure/api/portal.api'
`
)

// ── Integration Hub ──────────────────────────────────────────
write(
  'modules/integration-hub/domain/enums/integration.enum.ts',
  `export const IntegrationConnectionStatus = {
  Healthy: 'HEALTHY',
  Degraded: 'DEGRADED',
  Down: 'DOWN',
} as const
export type IntegrationConnectionStatus =
  (typeof IntegrationConnectionStatus)[keyof typeof IntegrationConnectionStatus]

export const ImportJobStatus = {
  Draft: 'DRAFT',
  Validated: 'VALIDATED',
  DryRun: 'DRY_RUN',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
} as const
export type ImportJobStatus = (typeof ImportJobStatus)[keyof typeof ImportJobStatus]
`
)

write(
  'modules/integration-hub/domain/model/integration.ts',
  `export interface IntegrationConnection {
  id: string
  name: string
  provider: string
  status: string
}

export interface ImportJob {
  id: string
  name: string
  status: string
  successCount?: number
  failureCount?: number
}
`
)

write(
  'modules/integration-hub/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

export const INTEGRATION_ENDPOINTS = {
  dashboard: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/integrations/dashboard\`),
  connections: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/integrations/connections\`),
  imports: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/integrations/imports\`),
  exports: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/integrations/exports\`),
  sync: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/integrations/sync\`),
  conflicts: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/integrations/conflicts\`),
  webhooks: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/integrations/webhooks\`),
} as const
`
)

write(
  'modules/integration-hub/infrastructure/api/integration.api.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { INTEGRATION_ENDPOINTS } from './endpoints'
import type { ImportJob, IntegrationConnection } from '../../domain/model/integration'

export async function listConnections(
  workspaceId: string
): Promise<{ items: IntegrationConnection[] }> {
  return apiClient.get(INTEGRATION_ENDPOINTS.connections(workspaceId))
}

export async function listImportJobs(
  workspaceId: string
): Promise<{ items: ImportJob[] }> {
  return apiClient.get(INTEGRATION_ENDPOINTS.imports(workspaceId))
}

export async function getIntegrationDashboard(workspaceId: string) {
  return apiClient.get(INTEGRATION_ENDPOINTS.dashboard(workspaceId))
}
`
)

write(
  'modules/integration-hub/presentation/hooks/useIntegrations.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/integration.api'
import type { IntegrationConnection } from '../../domain/model/integration'

export function useIntegrations(workspaceId: string | null) {
  const [items, setItems] = useState<IntegrationConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listConnections(workspaceId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
`
)

write(
  'modules/integration-hub/presentation/ui/IntegrationDashboardView.tsx',
  `'use client'

import { useParams } from 'next/navigation'
import { ContentLoader, JobResultSummary, Stack, Typography } from '@/shared/ui'
import { useIntegrations } from '../hooks/useIntegrations'

export function IntegrationDashboardView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, loading, error } = useIntegrations(workspaceId)

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Integration Hub</Typography>
      <Typography tone="muted">
        Connections, imports, exports and sync. Flow: validate → dry-run → execute → row results.
      </Typography>
      <JobResultSummary total={0} success={0} failed={0} />
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((c) => (
          <li key={c.id} className="p-md">
            <Typography variant="small" weight="medium">
              {c.name}
            </Typography>
            <Typography variant="caption" tone="muted">
              {[c.provider, c.status].join(' · ')}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
`
)

write(
  'modules/integration-hub/index.ts',
  `export { IntegrationDashboardView } from './presentation/ui/IntegrationDashboardView'
export { useIntegrations } from './presentation/hooks/useIntegrations'
export * as integrationApi from './infrastructure/api/integration.api'
`
)

// ── Trust ────────────────────────────────────────────────────
write(
  'modules/trust/domain/enums/trust.enum.ts',
  `export const PrivacyRequestStatus = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
} as const
export type PrivacyRequestStatus =
  (typeof PrivacyRequestStatus)[keyof typeof PrivacyRequestStatus]
`
)

write(
  'modules/trust/domain/model/trust.ts',
  `export interface TrustDashboardSummary {
  workspaceId: string
  openPrivacyRequests: number
  activeLegalHolds: number
  pendingAccessReviews: number
}

export interface PrivacyRequest {
  id: string
  subjectLabel: string
  status: string
  type: string
  createdAt: string
}
`
)

write(
  'modules/trust/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

export const TRUST_ENDPOINTS = {
  dashboard: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/trust/dashboard\`),
  privacyRequests: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/trust/privacy-requests\`),
  retention: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/trust/retention\`),
  legalHolds: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/trust/legal-holds\`),
  accessReviews: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/trust/access-reviews\`),
  evidence: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/trust/evidence\`),
} as const
`
)

write(
  'modules/trust/infrastructure/api/trust.api.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { TRUST_ENDPOINTS } from './endpoints'
import type { PrivacyRequest, TrustDashboardSummary } from '../../domain/model/trust'

export async function getTrustDashboard(
  workspaceId: string
): Promise<TrustDashboardSummary> {
  return apiClient.get(TRUST_ENDPOINTS.dashboard(workspaceId))
}

export async function listPrivacyRequests(
  workspaceId: string
): Promise<{ items: PrivacyRequest[] }> {
  return apiClient.get(TRUST_ENDPOINTS.privacyRequests(workspaceId))
}
`
)

write(
  'modules/trust/presentation/hooks/useTrustDashboard.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/trust.api'
import type { TrustDashboardSummary } from '../../domain/model/trust'

export function useTrustDashboard(workspaceId: string | null) {
  const [data, setData] = useState<TrustDashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      setData(await api.getTrustDashboard(workspaceId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trust dashboard')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
`
)

write(
  'modules/trust/presentation/ui/TrustDashboardView.tsx',
  `'use client'

import { useParams } from 'next/navigation'
import {
  ClassificationBadge,
  ClassificationLevel,
  ContentLoader,
  MaskedValue,
  Stack,
  Typography,
} from '@/shared/ui'
import { useTrustDashboard } from '../hooks/useTrustDashboard'

export function TrustDashboardView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { data, loading, error } = useTrustDashboard(workspaceId)

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Trust & Compliance</Typography>
      <div className="flex flex-wrap gap-sm">
        <ClassificationBadge level={ClassificationLevel.Confidential} />
        <MaskedValue masked />
      </div>
      <div className="grid grid-cols-1 gap-md md:grid-cols-3">
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Privacy requests
          </Typography>
          <Typography variant="h3">{data?.openPrivacyRequests ?? 0}</Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Legal holds
          </Typography>
          <Typography variant="h3">{data?.activeLegalHolds ?? 0}</Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Access reviews
          </Typography>
          <Typography variant="h3">{data?.pendingAccessReviews ?? 0}</Typography>
        </div>
      </div>
      <Typography tone="muted">
        Dangerous operations require dry-run / readiness checks and legal-hold validation.
      </Typography>
    </Stack>
  )
}
`
)

write(
  'modules/trust/index.ts',
  `export { TrustDashboardView } from './presentation/ui/TrustDashboardView'
export { useTrustDashboard } from './presentation/hooks/useTrustDashboard'
export * as trustApi from './infrastructure/api/trust.api'
`
)

// ── Service Support ──────────────────────────────────────────
write(
  'modules/service-support/domain/enums/support.enum.ts',
  `export const SupportCaseStatus = {
  New: 'NEW',
  Triaged: 'TRIAGED',
  InProgress: 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Closed: 'CLOSED',
} as const
export type SupportCaseStatus =
  (typeof SupportCaseStatus)[keyof typeof SupportCaseStatus]
`
)

write(
  'modules/service-support/domain/model/support.ts',
  `export interface SupportCase {
  id: string
  workspaceId: string
  title: string
  status: string
  priority?: string
  queue?: string | null
}

export interface SupportDashboardSummary {
  openCases: number
  breachedSla: number
  openIncidents: number
}
`
)

write(
  'modules/service-support/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

export const SUPPORT_ENDPOINTS = {
  dashboard: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/support/dashboard\`),
  cases: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/support/cases\`),
  case: (workspaceId: string, caseId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/support/cases/\${caseId}\`),
  incidents: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/support/incidents\`),
  problems: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/support/problems\`),
  maintenance: (workspaceId: string) =>
    apiPath(\`/workspaces/\${workspaceId}/support/maintenance\`),
} as const
`
)

write(
  'modules/service-support/infrastructure/api/support.api.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { SUPPORT_ENDPOINTS } from './endpoints'
import type { SupportCase, SupportDashboardSummary } from '../../domain/model/support'

export async function getSupportDashboard(
  workspaceId: string
): Promise<SupportDashboardSummary> {
  return apiClient.get(SUPPORT_ENDPOINTS.dashboard(workspaceId))
}

export async function listSupportCases(
  workspaceId: string
): Promise<{ items: SupportCase[] }> {
  return apiClient.get(SUPPORT_ENDPOINTS.cases(workspaceId))
}
`
)

write(
  'modules/service-support/presentation/hooks/useSupportCases.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/support.api'
import type { SupportCase, SupportDashboardSummary } from '../../domain/model/support'

export function useSupportCases(workspaceId: string | null) {
  const [items, setItems] = useState<SupportCase[]>([])
  const [dashboard, setDashboard] = useState<SupportDashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [cases, dash] = await Promise.all([
        api.listSupportCases(workspaceId),
        api.getSupportDashboard(workspaceId),
      ])
      setItems(cases.items)
      setDashboard(dash)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, dashboard, loading, error, refetch: load }
}
`
)

write(
  'modules/service-support/presentation/ui/SupportDashboardView.tsx',
  `'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ContentLoader, Stack, Typography } from '@/shared/ui'
import { useSupportCases } from '../hooks/useSupportCases'

export function SupportDashboardView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, dashboard, loading, error } = useSupportCases(workspaceId)

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Support Center</Typography>
      <div className="grid grid-cols-3 gap-md">
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Open cases
          </Typography>
          <Typography variant="h3">{dashboard?.openCases ?? 0}</Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            SLA breached
          </Typography>
          <Typography variant="h3">{dashboard?.breachedSla ?? 0}</Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Incidents
          </Typography>
          <Typography variant="h3">{dashboard?.openIncidents ?? 0}</Typography>
        </div>
      </div>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((c) => (
          <li key={c.id} className="p-md">
            <Link
              href={\`/workspace/\${workspaceId}/support/cases/\${c.id}\`}
              className="hover:underline"
            >
              <Typography variant="small" weight="medium">
                {c.title}
              </Typography>
            </Link>
            <Typography variant="caption" tone="muted">
              {[c.status, c.priority].filter(Boolean).join(' · ')}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
`
)

write(
  'modules/service-support/index.ts',
  `export { SupportDashboardView } from './presentation/ui/SupportDashboardView'
export { useSupportCases } from './presentation/hooks/useSupportCases'
export * as supportApi from './infrastructure/api/support.api'
`
)

console.log('enterprise modules done')
