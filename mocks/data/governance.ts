import { MOCK_ORG_ID, MOCK_POLICY_ID } from '@/shared/lib/dataMode'

export const MOCK_GOVERNANCE_POLICIES = {
  items: [
    {
      id: MOCK_POLICY_ID,
      org_id: MOCK_ORG_ID,
      project_id: null,
      project_name: null,
      policy_key: 'doc-approval',
      name: 'Document Approval Policy',
      description: 'Requires documents to be reviewed before approval.',
      scope_type: 'org' as const,
      status: 'active' as const,
      priority: 10,
      preset_key: null,
      rule_count: 2,
      active_rule_count: 2,
      created_at: '2025-02-01T08:00:00Z',
      updated_at: '2025-05-01T10:00:00Z',
    },
    {
      id: 'mock-policy-002',
      org_id: MOCK_ORG_ID,
      project_id: null,
      project_name: null,
      policy_key: 'ai-content-moderation',
      name: 'AI Content Moderation',
      description: 'Restricts AI-generated content types for compliance.',
      scope_type: 'org' as const,
      status: 'inactive' as const,
      priority: 20,
      preset_key: null,
      rule_count: 1,
      active_rule_count: 0,
      created_at: '2025-03-01T08:00:00Z',
      updated_at: '2025-03-15T10:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_GOVERNANCE_POLICY_DETAIL = {
  id: MOCK_POLICY_ID,
  org_id: MOCK_ORG_ID,
  project_id: null,
  policy_key: 'doc-approval',
  name: 'Document Approval Policy',
  description: 'Requires documents to be reviewed before approval workflow transition.',
  scope_type: 'org' as const,
  status: 'active' as const,
  priority: 10,
  preset_key: null,
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-05-01T10:00:00Z',
  rules: [
    {
      id: 'mock-rule-001',
      policy_id: MOCK_POLICY_ID,
      rule_key: 'require-review-before-approve',
      name: 'Require Review Before Approve',
      description: 'Documents must pass in_review status before being approved.',
      action_key: 'document.workflow.transition' as const,
      effect: 'deny' as const,
      priority: 10,
      status: 'active' as const,
      conditions: {
        all: [
          { field: 'target_workflow_status', operator: 'eq', value: 'approved' },
          { field: 'current_workflow_status', operator: 'eq', value: 'draft' },
        ],
      },
      explanation_template: 'Documents must go through review before approval.',
      created_at: '2025-02-01T08:00:00Z',
      updated_at: '2025-05-01T10:00:00Z',
    },
  ],
}

export const MOCK_GOVERNANCE_PRESETS = {
  items: [
    {
      preset_key: 'strict-approval',
      name: 'Strict Approval Workflow',
      description: 'Enforces a strict multi-step approval process for all documents.',
      scope_type: 'org' as const,
      policy_key: 'strict-approval-policy',
      priority: 5,
      rules: [],
    },
    {
      preset_key: 'ai-moderation',
      name: 'AI Content Moderation',
      description: 'Standard preset for moderating AI-generated document content.',
      scope_type: 'org' as const,
      policy_key: 'ai-moderation-policy',
      priority: 15,
      rules: [],
    },
  ],
}

export const MOCK_GOVERNANCE_STATUS = {
  enforcement_enabled: true,
  active_policy_count: 1,
  active_rule_count: 2,
  inactive_policy_count: 1,
  message: 'Governance is active with 1 enforced policy.',
}

export const MOCK_GOVERNANCE_EVALUATE = {
  allowed: true,
  effect: 'allow' as const,
  matched_rules: [],
  warnings: [],
  blocked_reasons: [],
  suggested_actions: [],
}
