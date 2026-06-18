import {
  MOCK_ORG_ID,
  MOCK_PROJECT_ID_1,
  MOCK_PROJECT_ID_2,
  MOCK_SESSION_ID,
  MOCK_USER_ID,
} from '@/shared/lib/dataMode'

const base = {
  org_id: MOCK_ORG_ID,
  created_by: MOCK_USER_ID,
  created_at: '2025-03-01T08:00:00Z',
  my_role: 'editor' as const,
}

export const MOCK_PROJECT_1 = {
  ...base,
  id: MOCK_PROJECT_ID_1,
  name: 'E-Commerce Platform Redesign',
  description: 'Redesign of the core e-commerce platform including checkout flow and product catalog.',
  status: 'active',
  latest_session_id: MOCK_SESSION_ID,
  active_session_id: MOCK_SESSION_ID,
  questions_count: 12,
  answered_count: 8,
}

export const MOCK_PROJECT_2 = {
  ...base,
  id: MOCK_PROJECT_ID_2,
  name: 'Mobile App v2',
  description: 'Second version of the mobile application with new features and improved UX.',
  status: 'active',
  latest_session_id: null,
  active_session_id: null,
  questions_count: 8,
  answered_count: 3,
}

export const MOCK_PROJECT_LIST = {
  items: [MOCK_PROJECT_1, MOCK_PROJECT_2],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_PROJECT_QUESTIONS = {
  'Business Context': [
    {
      id: 'mock-q-001',
      project_id: MOCK_PROJECT_ID_1,
      source: 'system',
      system_question_id: 'sq-001',
      section: 'Business Context',
      tags: ['business', 'scope'],
      q_type: 'text',
      prompt: 'What is the primary business problem this project aims to solve?',
      help_text: 'Describe the core pain point or opportunity driving this project.',
      required: true,
      answer_schema: { type: 'string' },
      visibility_logic: null,
      status: 'active',
      position: 0,
      created_at: '2025-03-01T08:00:00Z',
    },
    {
      id: 'mock-q-002',
      project_id: MOCK_PROJECT_ID_1,
      source: 'system',
      system_question_id: 'sq-002',
      section: 'Business Context',
      tags: ['stakeholders'],
      q_type: 'text',
      prompt: 'Who are the primary stakeholders and end users?',
      help_text: null,
      required: true,
      answer_schema: { type: 'string' },
      visibility_logic: null,
      status: 'active',
      position: 1,
      created_at: '2025-03-01T08:00:00Z',
    },
  ],
  'Technical Requirements': [
    {
      id: 'mock-q-003',
      project_id: MOCK_PROJECT_ID_1,
      source: 'system',
      system_question_id: 'sq-003',
      section: 'Technical Requirements',
      tags: ['technical', 'integration'],
      q_type: 'text',
      prompt: 'What existing systems or APIs must this project integrate with?',
      help_text: 'List any legacy systems, third-party APIs, or internal services.',
      required: false,
      answer_schema: { type: 'string' },
      visibility_logic: null,
      status: 'active',
      position: 0,
      created_at: '2025-03-01T08:00:00Z',
    },
  ],
  'Success Criteria': [
    {
      id: 'mock-q-004',
      project_id: MOCK_PROJECT_ID_1,
      source: 'system',
      system_question_id: 'sq-004',
      section: 'Success Criteria',
      tags: ['metrics', 'kpi'],
      q_type: 'text',
      prompt: 'How will success be measured for this project?',
      help_text: 'Define quantifiable success metrics and KPIs.',
      required: true,
      answer_schema: { type: 'string' },
      visibility_logic: null,
      status: 'active',
      position: 0,
      created_at: '2025-03-01T08:00:00Z',
    },
  ],
}

export const MOCK_PROJECT_MEMBERS = {
  items: [
    {
      user_id: MOCK_USER_ID,
      display_name: 'Alice Nguyen',
      email: 'alice@acme.com',
      role: 'editor' as const,
      status: 'active',
    },
    {
      user_id: 'mock-user-002',
      display_name: 'Bob Tran',
      email: 'bob@acme.com',
      role: 'viewer' as const,
      status: 'active',
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_REQUIREMENTS = {
  items: [
    {
      id: 'mock-req-001',
      project_id: MOCK_PROJECT_ID_1,
      title: 'User Authentication',
      description: 'Users must be able to register and login using email/password and Google OAuth.',
      priority: 'high',
      status: 'active',
      category: 'functional',
      source_type: 'session',
      source_session_id: MOCK_SESSION_ID,
      created_at: '2025-04-01T10:00:00Z',
      updated_at: '2025-04-01T10:00:00Z',
    },
    {
      id: 'mock-req-002',
      project_id: MOCK_PROJECT_ID_1,
      title: 'Product Search & Filtering',
      description: 'Users should be able to search products by keyword and filter by category, price range, and availability.',
      priority: 'high',
      status: 'active',
      category: 'functional',
      source_type: 'manual',
      source_session_id: null,
      created_at: '2025-04-02T10:00:00Z',
      updated_at: '2025-04-02T10:00:00Z',
    },
    {
      id: 'mock-req-003',
      project_id: MOCK_PROJECT_ID_1,
      title: 'Page Load Performance < 2s',
      description: 'All key pages must load within 2 seconds on a standard 4G connection.',
      priority: 'medium',
      status: 'active',
      category: 'non_functional',
      source_type: 'manual',
      source_session_id: null,
      created_at: '2025-04-03T10:00:00Z',
      updated_at: '2025-04-03T10:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 3 },
}

export const MOCK_PROJECT_SCOPE = {
  in_scope: 'Redesign of checkout flow, product catalog, and user account management.',
  out_of_scope: 'Backend inventory management, supplier portal.',
  constraints: 'Must maintain backward compatibility with existing customer data.',
  assumptions: 'Mobile-first design approach. Target browsers: Chrome, Safari, Firefox (last 2 versions).',
}

export const MOCK_ACTORS = {
  items: [
    {
      id: 'mock-actor-001',
      org_id: MOCK_ORG_ID,
      name: 'End Customer',
      description: 'Primary user of the e-commerce platform.',
      type: 'user',
      status: 'active',
      created_at: '2025-02-01T08:00:00Z',
    },
    {
      id: 'mock-actor-002',
      org_id: MOCK_ORG_ID,
      name: 'Admin Staff',
      description: 'Internal staff managing products and orders.',
      type: 'user',
      status: 'active',
      created_at: '2025-02-01T08:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_TRACE_LINKS = {
  items: [],
  page: { limit: 20, offset: 0, total: 0 },
}
