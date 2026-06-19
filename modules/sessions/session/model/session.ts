import type { ProjectQuestion } from '@/modules/projects'

export const SESSION_STATUS_LABEL: Record<'in_progress' | 'submitted' | 'locked', string> = {
  in_progress: 'In progress',
  submitted: 'Submitted',
  locked: 'Locked',
}

export interface SessionListItem {
  id: string
  project_id: string
  name: string
  status: 'in_progress' | 'submitted' | 'locked'
  created_by: string
  created_at: string
  submitted_at: string | null
}

export interface SessionListResponse {
  items: SessionListItem[]
  page: { limit: number; offset: number; total: number }
}

export interface AnswerItem {
  session_id: string
  question_id: string
  answer_status: 'answered' | 'skipped' | 'na'
  value: unknown
  skip_reason: string | null
  answered_by: string
  answered_at: string
}

export interface SessionDetail {
  id: string
  project_id: string
  name: string
  status: 'in_progress' | 'submitted' | 'locked'
  created_by: string
  created_at: string
  submitted_at: string | null
  questions: ProjectQuestion[]
  answers: AnswerItem[]
}

export interface PutAnswersPayload {
  answers: Array<{
    question_id: string
    answer_status: 'answered' | 'skipped' | 'na'
    value: unknown
    skip_reason?: string | null
  }>
}

export interface SessionProgress {
  total: number
  answered: number
  skipped: number
  na: number
  required_missing: number
  required_total: number
  required_answered: number
  optional_total: number
  optional_answered: number
  coverage_score: number
  coverage_percent: number
  coverage_label: string
}

export interface CreateSessionModalProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (sessionId: string) => void
}

export type SessionAnswerStatus = 'answered' | 'skipped' | 'na'
