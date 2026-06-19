import { getApiBaseUrl } from '@/shared/lib/apiClient'
import { getGovernanceBlockedMessage } from '@/utils/governanceError'
import type { ProblemDetails } from '@/shared/lib/api-types'

export type DocumentExportFormat = 'markdown' | 'text'

export type ExportPackageFormat = 'json' | 'zip'

export interface DocumentExportFile {
  filename: string
  mime_type: string
  content: string
}

export interface ExportManifest {
  export_id: string
  export_type: string
  org_id: string
  project_id: string | null
  generated_at: string
  generated_by: string
  document_count: number
  evidence_link_count: number
  included_formats: string[]
  filters_used: Record<string, unknown>
  include_archived: boolean
  include_answer_content: boolean
  include_requirement_metadata: boolean
  source_entity_type?: string
  source_entity_id?: string
  warnings: string[]
  package_format?: ExportPackageFormat
  content_format?: DocumentExportFormat
}

export interface DocumentExportPackageResult {
  manifest: ExportManifest
  files: DocumentExportFile[]
}

function toProxyUrl(url: string): string {
  if (typeof window === 'undefined') return url
  const base = getApiBaseUrl()
  const prefix = base + '/api/'
  if (base && url.startsWith(prefix)) {
    return '/api/proxy/' + url.slice(prefix.length)
  }
  return url
}

function parseFilenameFromDisposition(disposition: string | null, fallback: string): string {
  const match = disposition?.match(/filename="([^"]+)"/)
  return match?.[1] ?? fallback
}

function parseExportErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const governanceMessage = getGovernanceBlockedMessage(body)
  if (governanceMessage) return governanceMessage
  const problem = body as ProblemDetails
  return problem.detail ?? problem.title ?? fallback
}

export async function downloadSingleDocumentExport(
  orgId: string,
  documentId: string,
  params?: { format?: DocumentExportFormat; project_id?: string }
): Promise<void> {
  const search = new URLSearchParams()
  if (params?.format) search.set('format', params.format)
  if (params?.project_id) search.set('project_id', params.project_id)
  const q = search.toString()
  const url =
    toProxyUrl(`${getApiBaseUrl()}/api/v2/orgs/${orgId}/documents/${documentId}/export`) +
    (q ? `?${q}` : '')

  const res = await fetch(url)
  if (!res.ok) {
    let message = 'Export failed'
    try {
      const body = (await res.json()) as unknown
      message = parseExportErrorMessage(body, message)
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  const blob = await res.blob()
  const filename = parseFilenameFromDisposition(
    res.headers.get('Content-Disposition'),
    `document.${params?.format === 'text' ? 'txt' : 'md'}`
  )
  triggerBlobDownload(blob, filename)
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

export function downloadExportPackage(result: DocumentExportPackageResult) {
  for (const file of result.files) {
    const blob = new Blob([file.content], { type: file.mime_type })
    triggerBlobDownload(blob, file.filename)
  }
}

export function downloadManifestOnly(result: DocumentExportPackageResult) {
  const manifestFile = result.files.find((f) => f.filename === 'manifest.json')
  if (manifestFile) {
    const blob = new Blob([manifestFile.content], { type: manifestFile.mime_type })
    triggerBlobDownload(blob, manifestFile.filename)
  }
}

export async function fetchExportPackageResponse(
  url: string,
  body: Record<string, unknown>,
  token?: string | null
): Promise<
  | { kind: 'zip'; blob: Blob; filename: string }
  | { kind: 'json'; result: DocumentExportPackageResult }
> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(toProxyUrl(url), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
  })

  if (!res.ok) {
    let message = 'Export failed'
    try {
      const problem = (await res.json()) as unknown
      message = parseExportErrorMessage(problem, message)
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  const contentType = res.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/zip')) {
    const blob = await res.blob()
    const filename = parseFilenameFromDisposition(
      res.headers.get('Content-Disposition'),
      'export.zip'
    )
    return { kind: 'zip', blob, filename }
  }

  const result = (await res.json()) as DocumentExportPackageResult
  return { kind: 'json', result }
}

export async function downloadExportPackageFromResponse(
  response:
    | { kind: 'zip'; blob: Blob; filename: string }
    | { kind: 'json'; result: DocumentExportPackageResult }
) {
  if (response.kind === 'zip') {
    triggerBlobDownload(response.blob, response.filename)
    return
  }
  downloadExportPackage(response.result)
}

export async function downloadExportPackageRequest(
  url: string,
  body: Record<string, unknown>,
  token?: string | null
) {
  const response = await fetchExportPackageResponse(url, body, token)
  await downloadExportPackageFromResponse(response)
}
