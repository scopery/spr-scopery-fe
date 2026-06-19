import { MOCK_PROJECT_ID_1, MOCK_SESSION_ID, MOCK_USER_ID } from '@/shared/lib/dataMode'
import { MOCK_PROJECT_QUESTIONS } from './project'

export const MOCK_SESSION_LIST = {
  items: [
    {
      id: MOCK_SESSION_ID,
      project_id: MOCK_PROJECT_ID_1,
      name: 'Initial Requirements Session',
      status: 'in_progress' as const,
      created_by: MOCK_USER_ID,
      created_at: '2025-04-10T09:00:00Z',
      submitted_at: null,
    },
    {
      id: 'mock-session-002',
      project_id: MOCK_PROJECT_ID_1,
      name: 'Stakeholder Review',
      status: 'submitted' as const,
      created_by: MOCK_USER_ID,
      created_at: '2025-03-20T09:00:00Z',
      submitted_at: '2025-03-25T14:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

const allQuestions = [...Object.values(MOCK_PROJECT_QUESTIONS).flat()]

export const MOCK_SESSION_DETAIL = {
  id: MOCK_SESSION_ID,
  project_id: MOCK_PROJECT_ID_1,
  name: 'Initial Requirements Session',
  status: 'in_progress' as const,
  created_by: MOCK_USER_ID,
  created_at: '2025-04-10T09:00:00Z',
  submitted_at: null,
  questions: allQuestions,
  answers: [
    {
      session_id: MOCK_SESSION_ID,
      question_id: 'mock-q-001',
      answer_status: 'answered' as const,
      value:
        'The primary problem is that the current checkout flow has a 68% abandonment rate due to a complex multi-step process. We need to simplify it to a single-page checkout.',
      skip_reason: null,
      answered_by: MOCK_USER_ID,
      answered_at: '2025-04-10T10:00:00Z',
    },
    {
      session_id: MOCK_SESSION_ID,
      question_id: 'mock-q-002',
      answer_status: 'answered' as const,
      value:
        'Primary: end customers (B2C shoppers, 18-45 years old). Secondary: admin staff for order management and product updates.',
      skip_reason: null,
      answered_by: MOCK_USER_ID,
      answered_at: '2025-04-10T10:15:00Z',
    },
    {
      session_id: MOCK_SESSION_ID,
      question_id: 'mock-q-003',
      answer_status: 'skipped' as const,
      value: null,
      skip_reason: 'To be determined in technical spike',
      answered_by: MOCK_USER_ID,
      answered_at: '2025-04-10T10:20:00Z',
    },
  ],
}

export const MOCK_SESSION_PROGRESS = {
  session_id: MOCK_SESSION_ID,
  total_questions: 4,
  answered: 2,
  skipped: 1,
  na: 0,
  unanswered: 1,
  completion_percentage: 75,
}

export const MOCK_CLARITY_SUMMARY = {
  session_id: MOCK_SESSION_ID,
  overall_score: 72,
  assessed_at: '2025-04-10T11:00:00Z',
  dimensions: [
    {
      key: 'completeness',
      label: 'Completeness',
      score: 80,
      insight: 'Most required fields answered.',
    },
    {
      key: 'specificity',
      label: 'Specificity',
      score: 65,
      insight: 'Some answers could be more specific with measurable criteria.',
    },
    {
      key: 'consistency',
      label: 'Consistency',
      score: 70,
      insight: 'Minor inconsistencies between stakeholder definitions.',
    },
  ],
  top_issues: [
    'Question 3 (Technical integrations) was skipped — consider revisiting.',
    'Success metrics lack quantifiable targets.',
  ],
}
