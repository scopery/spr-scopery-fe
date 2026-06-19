import { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'
import { apiClient, getApiBaseUrl } from '@/shared/lib/apiClient'
import {
  downloadExportPackageRequest,
  type DocumentExportFormat,
  type ExportPackageFormat,
} from '@/utils/exportDownload'

type ExportPackageBody = {
  format?: DocumentExportFormat
  package_format?: ExportPackageFormat
  include_metadata?: boolean
  include_evidence_index?: boolean
  include_archived?: boolean
  include_document_exports?: boolean
  include_requirements_list?: boolean
  document_ids?: string[]
  project_id?: string
  preview_used?: boolean
}

export interface ExportGovernanceDecisionPreview {
  allowed: boolean
  effect: string
  action_key: string
  warnings: string[]
  blocked_reasons: string[]
  suggested_actions: string[]
  matched_rules?: Array<{
    rule_id: string
    rule_key: string
    policy_id: string
    policy_key: string
    action_key: string
    effect: string
    priority: number
    explanation: string
  }>
  decision_id?: string
}

export interface DocumentHubExportPreviewResult {
  document_count: number
  evidence_link_count: number
  estimated_serialized_size_bytes: number
  estimated_zip_size_bytes: number
  package_format: ExportPackageFormat
  content_format: DocumentExportFormat
  include_evidence_index: boolean
  include_archived: boolean
  selected_mode: 'selected' | 'filtered'
  filters_summary: Record<string, unknown>
  warnings: string[]
  limit_status: 'ok' | 'warning' | 'blocked'
  can_export: boolean
  blocked_reason: string | null
  suggested_filename: string
  total_matching: number | null
  governance_decision?: ExportGovernanceDecisionPreview
}

async function postExportPackage(urlPath: string, body: ExportPackageBody) {
  const url = `${getApiBaseUrl()}${urlPath}`
  await downloadExportPackageRequest(url, body)
}

export async function previewDocumentHubExport(
  orgId: string,
  body: ExportPackageBody & {
    mode: 'selected' | 'filtered'
    document_ids?: string[]
    filters?: Record<string, unknown>
  }
): Promise<DocumentHubExportPreviewResult> {
  return apiClient.post<DocumentHubExportPreviewResult>(
    DOCUMENT_ENDPOINTS.previewDocumentHubExport(orgId),
    body
  )
}

export async function exportDocuments(
  orgId: string,
  body: ExportPackageBody & { document_ids: string[] }
): Promise<void> {
  await postExportPackage(DOCUMENT_ENDPOINTS.exportDocuments(orgId), body)
}

export async function exportDocumentHub(
  orgId: string,
  body: ExportPackageBody & {
    mode: 'selected' | 'filtered'
    document_ids?: string[]
    filters?: Record<string, unknown>
  }
): Promise<void> {
  await postExportPackage(DOCUMENT_ENDPOINTS.exportDocumentHub(orgId), body)
}

export async function exportRequirementEvidencePack(
  orgId: string,
  projectId: string,
  requirementId: string,
  body?: ExportPackageBody
): Promise<void> {
  await postExportPackage(
    DOCUMENT_ENDPOINTS.exportRequirementEvidence(orgId, projectId, requirementId),
    body ?? {}
  )
}

export async function exportSessionEvidencePack(
  orgId: string,
  projectId: string,
  sessionId: string,
  body?: ExportPackageBody
): Promise<void> {
  await postExportPackage(
    DOCUMENT_ENDPOINTS.exportSessionEvidence(orgId, projectId, sessionId),
    body ?? {}
  )
}

export async function exportProjectHandoffPackage(
  orgId: string,
  projectId: string,
  body?: ExportPackageBody
): Promise<void> {
  await postExportPackage(DOCUMENT_ENDPOINTS.exportProjectHandoff(orgId, projectId), body ?? {})
}

export function formatExportSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
