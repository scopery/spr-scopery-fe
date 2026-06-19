export type { Project } from './project-types'

export interface ProjectListItem {
  id: string
  org_id: string
  name: string
  description: string | null
  status: string
  created_by: string
  created_at: string
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

export interface CreateProjectModalProps {
  orgId: string
  open: boolean
  onClose: () => void
  onSuccess: (projectId: string) => void
}

export interface ProjectTemplateSelectOption {
  value: string
  label: string
}
