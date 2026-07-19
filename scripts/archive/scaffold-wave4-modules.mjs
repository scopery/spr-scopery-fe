import fs from 'fs'
import path from 'path'

const root = process.cwd()

function write(rel, content) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content.trimStart())
  console.log('W', rel)
}

function makeListHook(apiImport, listFn) {
  return `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/${apiImport}'

export function __HOOK__(scopeId: string | null) {
  const [items, setItems] = useState<Array<{ id: string; title?: string; name?: string; status?: string; code?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!scopeId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.${listFn}(scopeId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [scopeId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
`
}

function makeListView(viewName, hookFile, hookName, title, scope) {
  const scopeExpr =
    scope === 'workspace'
      ? 'params.workspaceId ?? null'
      : 'params.projectId ?? null'
  return `'use client'

import { useParams } from 'next/navigation'
import { ContentLoader, Stack, Typography } from '@/shared/ui'
import { ${hookName} } from '../hooks/${hookFile}'

export function ${viewName}() {
  const params = useParams<{ workspaceId: string; projectId?: string }>()
  const scopeId = ${scopeExpr}
  const { items, loading, error } = ${hookName}(scopeId)

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">${title}</Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No items yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="p-md">
              <Typography variant="small" weight="medium">
                {item.title ?? item.name ?? item.code ?? item.id}
              </Typography>
              {item.status ? (
                <Typography variant="caption" tone="muted">
                  {item.status}
                </Typography>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
`
}

function makeApi(endpointsConst, listCall, getCall) {
  return `import { apiClient } from '@/shared/lib/apiClient'
import { ${endpointsConst} } from './endpoints'

export interface ListResponse<T> {
  items: T[]
  page?: { limit: number; offset: number; total: number }
}

export async function ${listCall}(scopeId: string): Promise<ListResponse<{ id: string; title?: string; name?: string; status?: string; code?: string }>> {
  return apiClient.get(${endpointsConst}.list(scopeId))
}

export async function ${getCall}(scopeId: string, id: string) {
  return apiClient.get(${endpointsConst}.get(scopeId, id))
}
`
}

function makeEndpoints(constName, listPath, getPath) {
  return `import { apiPath } from '@/shared/lib/api-paths'

export const ${constName} = {
  list: (scopeId: string) => apiPath(\`${listPath}\`),
  get: (scopeId: string, id: string) => apiPath(\`${getPath}\`),
} as const
`
}

const modules = [
  {
    dir: 'quality',
    enumName: 'quality.enum.ts',
    enumBody: `export const QualityPlanStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type QualityPlanStatus = (typeof QualityPlanStatus)[keyof typeof QualityPlanStatus]

export const DefectStatus = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Closed: 'CLOSED',
} as const
export type DefectStatus = (typeof DefectStatus)[keyof typeof DefectStatus]

export const ReleaseStatus = {
  Planned: 'PLANNED',
  Ready: 'READY',
  Released: 'RELEASED',
} as const
export type ReleaseStatus = (typeof ReleaseStatus)[keyof typeof ReleaseStatus]
`,
    modelName: 'quality.ts',
    modelBody: `export interface QualityPlan {
  id: string
  projectId: string
  title: string
  status: string
  createdAt?: string
}

export interface TestPlan {
  id: string
  projectId: string
  title: string
  status: string
}

export interface TestCase {
  id: string
  projectId: string
  code?: string
  title: string
  status: string
}

export interface TestRun {
  id: string
  projectId: string
  title: string
  status: string
}

export interface Defect {
  id: string
  projectId: string
  code?: string
  title: string
  status: string
  priority?: string
}

export interface ReleasePackage {
  id: string
  projectId: string
  title: string
  status: string
}

export interface Deployment {
  id: string
  projectId: string
  title: string
  status: string
}
`,
    endpoints: makeEndpoints(
      'QUALITY_ENDPOINTS',
      '/projects/${scopeId}/quality/plans',
      '/projects/${scopeId}/quality/plans/${id}'
    ).replace(
      `list: (scopeId: string) => apiPath(\`/projects/\${scopeId}/quality/plans\`),
  get: (scopeId: string, id: string) => apiPath(\`/projects/\${scopeId}/quality/plans/\${id}\`),`,
      `plans: (projectId: string) => apiPath(\`/projects/\${projectId}/quality/plans\`),
  plan: (projectId: string, id: string) => apiPath(\`/projects/\${projectId}/quality/plans/\${id}\`),
  testPlans: (projectId: string) => apiPath(\`/projects/\${projectId}/test-plans\`),
  testCases: (projectId: string) => apiPath(\`/projects/\${projectId}/test-cases\`),
  testRuns: (projectId: string) => apiPath(\`/projects/\${projectId}/test-runs\`),
  defects: (projectId: string) => apiPath(\`/projects/\${projectId}/defects\`),
  defect: (projectId: string, id: string) => apiPath(\`/projects/\${projectId}/defects/\${id}\`),
  releases: (projectId: string) => apiPath(\`/projects/\${projectId}/releases\`),
  release: (projectId: string, id: string) => apiPath(\`/projects/\${projectId}/releases/\${id}\`),
  deployments: (projectId: string) => apiPath(\`/projects/\${projectId}/deployments\`),
  list: (projectId: string) => apiPath(\`/projects/\${projectId}/quality/plans\`),
  get: (projectId: string, id: string) => apiPath(\`/projects/\${projectId}/quality/plans/\${id}\`),`
    ),
    apiFile: 'quality.api.ts',
    apiBody: makeApi('QUALITY_ENDPOINTS', 'listQualityPlans', 'getQualityPlan'),
    hooks: [
      {
        file: 'useQualityCenter.ts',
        body: makeListHook('quality.api', 'listQualityPlans').replaceAll('__HOOK__', 'useQualityCenter'),
      },
      {
        file: 'useDefects.ts',
        body: `'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/shared/lib/apiClient'
import { QUALITY_ENDPOINTS } from '../../infrastructure/api/endpoints'
import type { Defect } from '../../domain/model/quality'

export function useDefects(projectId: string | null) {
  const [items, setItems] = useState<Defect[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<{ items: Defect[] }>(QUALITY_ENDPOINTS.defects(projectId))
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load defects')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
`,
      },
      {
        file: 'useReleases.ts',
        body: `'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/shared/lib/apiClient'
import { QUALITY_ENDPOINTS } from '../../infrastructure/api/endpoints'
import type { ReleasePackage } from '../../domain/model/quality'

export function useReleases(projectId: string | null) {
  const [items, setItems] = useState<ReleasePackage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<{ items: ReleasePackage[] }>(
        QUALITY_ENDPOINTS.releases(projectId)
      )
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load releases')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
`,
      },
    ],
    views: [
      {
        file: 'QualityCenterView.tsx',
        body: makeListView('QualityCenterView', 'useQualityCenter', 'useQualityCenter', 'Quality Center', 'project'),
      },
      {
        file: 'DefectCenterView.tsx',
        body: makeListView('DefectCenterView', 'useDefects', 'useDefects', 'Defect Center', 'project'),
      },
      {
        file: 'ReleaseCenterView.tsx',
        body: makeListView('ReleaseCenterView', 'useReleases', 'useReleases', 'Release Center', 'project'),
      },
      {
        file: 'TestManagementView.tsx',
        body: `'use client'

import { Stack, Typography } from '@/shared/ui'

export function TestManagementView() {
  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Test Management</Typography>
      <Typography tone="muted">
        Test plans, suites, cases and runs. Links Requirement → Test Case → Result → Defect → Release.
      </Typography>
    </Stack>
  )
}
`,
      },
      {
        file: 'DeploymentCenterView.tsx',
        body: `'use client'

import { Stack, Typography } from '@/shared/ui'

export function DeploymentCenterView() {
  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Deployment Center</Typography>
      <Typography tone="muted">Track deployments and rollbacks for this project.</Typography>
    </Stack>
  )
}
`,
      },
    ],
    index: `export { QualityCenterView } from './presentation/ui/QualityCenterView'
export { DefectCenterView } from './presentation/ui/DefectCenterView'
export { ReleaseCenterView } from './presentation/ui/ReleaseCenterView'
export { TestManagementView } from './presentation/ui/TestManagementView'
export { DeploymentCenterView } from './presentation/ui/DeploymentCenterView'
export { useQualityCenter } from './presentation/hooks/useQualityCenter'
export { useDefects } from './presentation/hooks/useDefects'
export { useReleases } from './presentation/hooks/useReleases'
export * as qualityApi from './infrastructure/api/quality.api'
export type { QualityPlan, Defect, ReleasePackage } from './domain/model/quality'
`,
  },
]

// Knowledge (again, idempotent)
write(
  'modules/knowledge/domain/enums/knowledge.enum.ts',
  `export const DocumentTypeStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type DocumentTypeStatus = (typeof DocumentTypeStatus)[keyof typeof DocumentTypeStatus]
`
)
write(
  'modules/knowledge/domain/model/knowledge.ts',
  `import type { DocumentTypeStatus } from '../enums/knowledge.enum'

export interface DocumentType {
  id: string
  code: string
  name: string
  status: DocumentTypeStatus | string
  scope?: string | null
  description?: string | null
  createdAt?: string
}

export interface DocumentTypeListResponse {
  items: DocumentType[]
  page?: { limit: number; offset: number; total: number }
}
`
)
write(
  'modules/knowledge/infrastructure/api/endpoints.ts',
  `import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const q = p.toString()
  return q ? \`\${base}?\${q}\` : base
}

export const KNOWLEDGE_ENDPOINTS = {
  list: (params?: { q?: string }) =>
    withQuery(apiPath('/knowledge/document-types'), params),
  get: (id: string) => apiPath(\`/knowledge/document-types/\${id}\`),
} as const
`
)
write(
  'modules/knowledge/infrastructure/api/knowledge.ts',
  `import { apiClient } from '@/shared/lib/apiClient'
import { KNOWLEDGE_ENDPOINTS } from './endpoints'
import type { DocumentType, DocumentTypeListResponse } from '../../domain/model/knowledge'

export async function listDocumentTypes(params?: {
  q?: string
}): Promise<DocumentTypeListResponse> {
  return apiClient.get<DocumentTypeListResponse>(KNOWLEDGE_ENDPOINTS.list(params))
}

export async function getDocumentType(id: string): Promise<DocumentType> {
  return apiClient.get<DocumentType>(KNOWLEDGE_ENDPOINTS.get(id))
}
`
)
write(
  'modules/knowledge/presentation/hooks/useDocumentTypes.ts',
  `'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/knowledge'
import type { DocumentType } from '../../domain/model/knowledge'

export function useDocumentTypes(_workspaceId?: string | null) {
  const [items, setItems] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDocumentTypes()
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
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
  'modules/knowledge/presentation/ui/DocumentTypeLibraryView.tsx',
  `'use client'

import { ContentLoader, Stack, Typography } from '@/shared/ui'
import { useDocumentTypes } from '../hooks/useDocumentTypes'

export function DocumentTypeLibraryView() {
  const { items, loading, error } = useDocumentTypes()

  if (loading) return <ContentLoader />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Document Type Library</Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No document types yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="p-md">
              <Typography variant="small" weight="medium">
                {item.name}
              </Typography>
              <Typography variant="caption" tone="muted">
                {[item.code, item.status].filter(Boolean).join(' · ')}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
`
)
write(
  'modules/knowledge/presentation/ui/KnowledgeIndexingView.tsx',
  `'use client'

import { Stack, Typography, LongRunningJobPanel } from '@/shared/ui'
import type { UnifiedJob } from '@/shared/lib/unifiedJob'

export function KnowledgeIndexingView() {
  const job: UnifiedJob | null = null
  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Knowledge Indexing Center</Typography>
      <Typography tone="muted">
        Queue reindex jobs and monitor progress. Requires X-Workspace-Id header.
      </Typography>
      <LongRunningJobPanel job={job} label="Reindex" />
    </Stack>
  )
}
`
)
write(
  'modules/knowledge/presentation/ui/KnowledgeGraphView.tsx',
  `'use client'

import { Stack, Typography } from '@/shared/ui'

export function KnowledgeGraphView() {
  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Knowledge Graph Explorer</Typography>
      <Typography tone="muted">
        Explore related entities from semantic retrieval.
      </Typography>
    </Stack>
  )
}
`
)
write(
  'modules/knowledge/index.ts',
  `export { DocumentTypeLibraryView } from './presentation/ui/DocumentTypeLibraryView'
export { KnowledgeIndexingView } from './presentation/ui/KnowledgeIndexingView'
export { KnowledgeGraphView } from './presentation/ui/KnowledgeGraphView'
export { useDocumentTypes } from './presentation/hooks/useDocumentTypes'
export * as knowledgeApi from './infrastructure/api/knowledge'
export type { DocumentType } from './domain/model/knowledge'
`
)

for (const m of modules) {
  write(`modules/${m.dir}/domain/enums/${m.enumName}`, m.enumBody)
  write(`modules/${m.dir}/domain/model/${m.modelName}`, m.modelBody)
  write(`modules/${m.dir}/infrastructure/api/endpoints.ts`, m.endpoints)
  write(`modules/${m.dir}/infrastructure/api/${m.apiFile}`, m.apiBody)
  for (const h of m.hooks) write(`modules/${m.dir}/presentation/hooks/${h.file}`, h.body)
  for (const v of m.views) write(`modules/${m.dir}/presentation/ui/${v.file}`, v.body)
  write(`modules/${m.dir}/index.ts`, m.index)
}

console.log('part A done')
