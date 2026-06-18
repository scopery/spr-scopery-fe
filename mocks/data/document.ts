import {
  MOCK_DOCUMENT_ID_1,
  MOCK_DOCUMENT_ID_2,
  MOCK_ORG_ID,
  MOCK_PROJECT_ID_1,
  MOCK_SESSION_ID,
  MOCK_TEMPLATE_ID,
  MOCK_USER_ID,
} from '@/shared/lib/dataMode'

const docBase = {
  org_id: MOCK_ORG_ID,
  created_by: MOCK_USER_ID,
  created_at: '2025-04-15T10:00:00Z',
  updated_at: '2025-06-01T14:00:00Z',
  status: 'active',
  workflow_status: 'draft' as const,
  visibility: 'internal',
  generated_by_ai: false,
  is_pinned: false,
  section_id: null,
  template_id: null,
  version: 1,
}

export const MOCK_DOCUMENT_1 = {
  ...docBase,
  id: MOCK_DOCUMENT_ID_1,
  title: 'Project Requirements Specification',
  document_type: 'requirements',
  project_id: MOCK_PROJECT_ID_1,
  session_id: MOCK_SESSION_ID,
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Project Requirements Specification' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'This document outlines the functional and non-functional requirements for the E-Commerce Platform Redesign project.' }],
      },
    ],
  },
}

export const MOCK_DOCUMENT_2 = {
  ...docBase,
  id: MOCK_DOCUMENT_ID_2,
  title: 'Technical Architecture Overview',
  document_type: 'technical',
  project_id: MOCK_PROJECT_ID_1,
  session_id: null,
  workflow_status: 'in_review' as const,
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Technical Architecture Overview' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'High-level technical architecture for the redesigned platform.' }],
      },
    ],
  },
}

export const MOCK_DOCUMENT_LIST = {
  items: [MOCK_DOCUMENT_1, MOCK_DOCUMENT_2],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_GROUPED_DOCUMENTS = {
  ungrouped: {
    section: null,
    documents: [MOCK_DOCUMENT_1, MOCK_DOCUMENT_2],
  },
}

export const MOCK_PROJECT_SECTIONS = {
  items: [
    {
      id: 'mock-section-001',
      project_id: MOCK_PROJECT_ID_1,
      name: 'Requirements',
      description: null,
      position: 0,
      status: 'active',
      document_count: 1,
      created_at: '2025-04-01T08:00:00Z',
    },
    {
      id: 'mock-section-002',
      project_id: MOCK_PROJECT_ID_1,
      name: 'Technical Design',
      description: null,
      position: 1,
      status: 'active',
      document_count: 1,
      created_at: '2025-04-01T08:00:00Z',
    },
  ],
}

export const MOCK_DOCUMENT_LINKS = {
  items: [],
  page: { limit: 20, offset: 0, total: 0 },
}

export const MOCK_LINK_COUNTS = {}

export const MOCK_ENTITY_LINK_COUNTS = {}

export const MOCK_DOCUMENT_HUB = {
  items: [MOCK_DOCUMENT_1, MOCK_DOCUMENT_2],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_COLLABORATION_COMMENTS = {
  items: [],
  page: { limit: 20, offset: 0, total: 0 },
}

export const MOCK_COLLABORATION_SUGGESTIONS = {
  items: [],
  page: { limit: 20, offset: 0, total: 0 },
}

export const MOCK_COLLABORATION_ACTIVITY = {
  items: [],
  page: { limit: 20, offset: 0, total: 0 },
}

export const MOCK_COLLABORATORS = {
  items: [
    {
      user_id: MOCK_USER_ID,
      display_name: 'Alice Nguyen',
      email: 'alice@acme.com',
      role: 'owner',
      access_level: 'edit',
    },
  ],
}

// Document templates
export const MOCK_TEMPLATE_DETAIL = {
  id: MOCK_TEMPLATE_ID,
  org_id: MOCK_ORG_ID,
  name: 'Requirements Specification Template',
  description: 'Standard template for documenting project requirements.',
  document_type: 'requirements',
  scope: 'org',
  status: 'published',
  category: 'requirements',
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: '{{document_title}}' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Project: {{project_name}}' }],
      },
    ],
  },
  variables: [
    { key: 'document_title', label: 'Document Title', type: 'string', required: true },
    { key: 'project_name', label: 'Project Name', type: 'string', required: true },
  ],
  created_by: MOCK_USER_ID,
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-05-01T10:00:00Z',
}

export const MOCK_TEMPLATES_LIST = {
  items: [
    MOCK_TEMPLATE_DETAIL,
    {
      id: 'mock-template-002',
      org_id: MOCK_ORG_ID,
      name: 'Technical Design Document',
      description: 'Template for architecture and technical design documents.',
      document_type: 'technical',
      scope: 'org',
      status: 'published',
      category: 'technical',
      created_by: MOCK_USER_ID,
      created_at: '2025-02-15T08:00:00Z',
      updated_at: '2025-05-10T10:00:00Z',
    },
    {
      id: 'mock-template-003',
      org_id: MOCK_ORG_ID,
      name: 'Meeting Notes',
      description: 'Lightweight template for capturing meeting notes and action items.',
      document_type: 'notes',
      scope: 'org',
      status: 'draft',
      category: 'general',
      created_by: MOCK_USER_ID,
      created_at: '2025-03-01T08:00:00Z',
      updated_at: '2025-03-01T08:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 3 },
}

export const MOCK_TEMPLATE_VARIABLES = {
  variables: [
    { key: 'project_name', label: 'Project Name', type: 'string', source: 'project' },
    { key: 'org_name', label: 'Organization Name', type: 'string', source: 'org' },
    { key: 'session_name', label: 'Session Name', type: 'string', source: 'session' },
    { key: 'document_title', label: 'Document Title', type: 'string', source: 'input' },
    { key: 'created_date', label: 'Created Date', type: 'date', source: 'system' },
  ],
}

export const MOCK_DELIVERABLE_TEMPLATES = {
  items: [],
}

export const MOCK_DELIVERABLE_CONTEXT = {
  project_id: MOCK_PROJECT_ID_1,
  session_id: MOCK_SESSION_ID,
  available_sections: ['Business Context', 'Technical Requirements', 'Success Criteria'],
}

export const MOCK_DOCUMENT_AI_METADATA = {
  document_id: MOCK_DOCUMENT_ID_1,
  is_ai_generated: false,
  ai_generated_at: null,
  ai_model: null,
  summary: null,
  related_documents: [],
}

export const MOCK_RELATED_DOCUMENTS = {
  items: [],
  page: { limit: 5, offset: 0, total: 0 },
}
