/**
 * Project domain model — matches BE `ProjectResponse` (`GET/POST /api/projects`).
 * Snake_case + `my_role` fields are UI compatibility aliases until project authz is wired.
 */

export interface ProjectV1 {
  id: string
  workspaceId: string
  organizationId: string
  code: string
  name: string
  description: string | null
  ownerUserId: string | null
  defaultCurrency: string | null
  plannedStartDate: string | null
  plannedEndDate: string | null
  status: string
  activatedAt: string | null
  activatedBy: string | null
  archivedAt: string | null
  archivedBy: string | null
  sourceTemplateId: string | null
  sourceTemplateVersionId: string | null
  sourceTemplateAppliedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

/** List/detail shape used by existing views (aliases included). */
export interface ProjectListItem extends ProjectV1 {
  org_id: string
  created_by: string
  created_at: string
  /** Temporary default until IAM check replaces role inference. */
  my_role: 'editor' | 'viewer'
}

export interface ProjectListResponse {
  items: ProjectListItem[]
  page: { limit: number; offset: number; total: number }
}

export interface ProjectDetail extends ProjectListItem {
  latest_session_id: string | null
  active_session_id: string | null
  questions_count: number
  answered_count: number
}

export interface CreateProjectPayload {
  workspaceId: string
  code: string
  name: string
  description?: string
  ownerUserId?: string
  defaultCurrency?: string
  plannedStartDate?: string
  plannedEndDate?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string | null
  ownerUserId?: string | null
  defaultCurrency?: string | null
  plannedStartDate?: string | null
  plannedEndDate?: string | null
}

export interface CreateProjectModalProps {
  workspaceId: string
  open: boolean
  onClose: () => void
  onSuccess: (projectId: string) => void
}

export interface ProjectTemplateSelectOption {
  value: string
  label: string
}

/** BE page envelope after apiClient unwrap. */
export interface ProjectPageResponse {
  items: ProjectV1[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
  first?: boolean
  last?: boolean
}

export function mapProjectV1ToListItem(p: ProjectV1): ProjectListItem {
  return {
    ...p,
    description: p.description ?? null,
    ownerUserId: p.ownerUserId ?? null,
    defaultCurrency: p.defaultCurrency ?? null,
    plannedStartDate: p.plannedStartDate ?? null,
    plannedEndDate: p.plannedEndDate ?? null,
    activatedAt: p.activatedAt ?? null,
    activatedBy: p.activatedBy ?? null,
    archivedAt: p.archivedAt ?? null,
    archivedBy: p.archivedBy ?? null,
    sourceTemplateId: p.sourceTemplateId ?? null,
    sourceTemplateVersionId: p.sourceTemplateVersionId ?? null,
    sourceTemplateAppliedAt: p.sourceTemplateAppliedAt ?? null,
    org_id: p.organizationId,
    created_by: p.ownerUserId ?? '',
    created_at: p.createdAt,
    my_role: 'editor',
  }
}

export function mapProjectV1ToDetail(p: ProjectV1): ProjectDetail {
  return {
    ...mapProjectV1ToListItem(p),
    latest_session_id: null,
    active_session_id: null,
    questions_count: 0,
    answered_count: 0,
  }
}

/** Derive a short project code from the display name (BE requires `code`). */
export function projectCodeFromName(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32)
  return base || `PRJ_${Date.now().toString(36).toUpperCase()}`
}

/** Alias used by hooks / controlled lists. */
export type Project = ProjectListItem
