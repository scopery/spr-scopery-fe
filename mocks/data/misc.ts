import { MOCK_ORG_ID, MOCK_PROJECT_ID_1, MOCK_USER_ID } from '@/shared/lib/dataMode'

// ─── Effective Permissions ───────────────────────────────────────────────────

export const MOCK_EFFECTIVE_PERMISSIONS = {
  ok: true,
  data: {
    permissions: [
      'workspace.view',
      'workspace.update',
      'workspace.manage_members',
      'workspace.manage_templates',
      'workspace.manage_settings',
      'project.view',
      'project.create',
      'project.update',
      'project.archive',
      'project.manage_members',
      'project.manage_documents',
      'project.manage_sections',
      'document.view',
      'document.create',
      'document.update',
      'document.archive',
      'document.attach_to_project',
      'document.pin',
      'document.move_section',
      'document.create_from_template',
      'document.export',
      'document.link.view',
      'document.link.create',
      'document.link.delete',
      'document.comment.view',
      'document.comment.create',
      'document.comment.resolve',
      'document.suggestion.view',
      'document.suggestion.create',
      'document.suggestion.accept',
      'document.suggestion.reject',
      'document.share_internal',
      'document.manage_collaborators',
      'document.activity.view',
      'document.view_ai_metadata',
      'template.view',
      'template.create',
      'template.update',
      'template.archive',
      'template.duplicate',
      'template.variable.view',
      'template.variable.insert',
      'ai.generate_questions',
      'ai.assess_clarity',
      'ai.view_readiness',
      'ai.generate_document',
      'ai.summarize_document',
      'document_hub.view',
      'document_hub.search',
      'document_hub.filter',
      'document_hub.view_workspace',
      'document_hub.view_project',
      'governance.view',
      'governance.manage',
      'governance.evaluate',
      'agent_control.view',
      'agent_control.manage',
      'prompt_registry.view',
      'prompt_registry.manage',
      'agent_runtime.view',
      'ai_usage.view',
      'user.mention',
    ],
    roles: ['owner'],
    org_role: 'owner',
    project_role: 'editor',
  },
}

// ─── Agent Control ────────────────────────────────────────────────────────────

export const MOCK_AGENT_CONTROL_METADATA = {
  providers: ['anthropic', 'openai', 'google'],
  modes: ['cheap', 'balanced', 'high_quality', 'reasoning', 'vision', 'extraction'],
  risk_levels: ['low', 'medium', 'high'],
  tier_levels: ['low', 'medium', 'high'],
  quality_tiers: ['standard', 'advanced', 'premium'],
  context_sources: ['session_answers', 'project_context', 'org_documents'],
  allowed_actions: ['generate_text', 'analyze_content', 'extract_data'],
  allowed_tools: ['web_search', 'code_execution'],
}

export const MOCK_ORG_MODEL_POLICIES = {
  items: [
    {
      id: 'mock-policy-model-001',
      org_id: MOCK_ORG_ID,
      project_id: null,
      policy_key: 'default-balanced',
      name: 'Default Balanced Policy',
      description: 'Balanced cost/quality policy for most operations.',
      provider: 'anthropic' as const,
      model_name: 'claude-3-5-sonnet-20241022',
      mode: 'balanced' as const,
      temperature: 0.3,
      max_output_tokens: 4096,
      max_input_tokens: null,
      fallback_policy_id: null,
      cost_tier: 'medium' as const,
      latency_tier: 'medium' as const,
      quality_tier: 'advanced' as const,
      status: 'active' as const,
      created_at: '2025-01-01T08:00:00Z',
      updated_at: '2025-06-01T08:00:00Z',
      archived_at: null,
      fallback_policy_key: null,
      fallback_policy_name: null,
    },
    {
      id: 'mock-policy-model-002',
      org_id: MOCK_ORG_ID,
      project_id: null,
      policy_key: 'economy-generation',
      name: 'Economy Generation Policy',
      description: 'Low-cost policy for bulk text generation tasks.',
      provider: 'anthropic' as const,
      model_name: 'claude-3-haiku-20240307',
      mode: 'cheap' as const,
      temperature: 0.5,
      max_output_tokens: 2048,
      max_input_tokens: null,
      fallback_policy_id: null,
      cost_tier: 'low' as const,
      latency_tier: 'low' as const,
      quality_tier: 'standard' as const,
      status: 'active' as const,
      created_at: '2025-02-01T08:00:00Z',
      updated_at: '2025-06-01T08:00:00Z',
      archived_at: null,
      fallback_policy_key: null,
      fallback_policy_name: null,
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_ORG_AGENTS_LIST = {
  items: [
    {
      id: 'mock-org-agent-001',
      org_id: MOCK_ORG_ID,
      project_id: null,
      agent_key: 'question-generator',
      name: 'Question Generator',
      description: 'Generates clarifying questions for elicitation sessions.',
      purpose: 'elicitation',
      status: 'active' as const,
      default_model_policy_id: 'mock-policy-model-001',
      allowed_context_sources: ['session_answers', 'project_context'],
      allowed_actions: ['generate_text'],
      allowed_tools: [],
      output_contract: null,
      risk_level: 'medium' as const,
      preset_key: null,
      created_at: '2025-01-01T08:00:00Z',
      updated_at: '2025-06-01T08:00:00Z',
      archived_at: null,
      default_model_policy_key: 'default-balanced',
      default_model_policy_name: 'Default Balanced Policy',
    },
  ],
  total: 1,
}

export const MOCK_AGENT_CONTROL_PRESETS = {
  items: [
    {
      preset_key: 'cost-optimized',
      name: 'Cost Optimized',
      description: 'Configure all agents to use the most economical models.',
      provider: 'anthropic',
      mode: 'cheap',
    },
    {
      preset_key: 'quality-first',
      name: 'Quality First',
      description: 'Configure agents for highest quality outputs.',
      provider: 'anthropic',
      mode: 'high_quality',
    },
  ],
}

export const MOCK_RUNTIME_USAGE_SUMMARY = {
  period_start: '2025-06-01T00:00:00Z',
  period_end: '2025-06-30T23:59:59Z',
  total_runs: 47,
  total_input_tokens: 98420,
  total_output_tokens: 34120,
  total_cost_usd: 1.84,
  by_agent: [
    { agent_key: 'question-generator', runs: 24, cost_usd: 0.98 },
    { agent_key: 'answer-improver', runs: 18, cost_usd: 0.72 },
    { agent_key: 'clarity-assessor', runs: 5, cost_usd: 0.14 },
  ],
}

export const MOCK_PROMPT_REGISTRY = {
  templates: [
    {
      id: 'mock-prompt-001',
      key: 'question-generator-v3',
      name: 'Question Generator v3',
      agent_key: 'question-generator',
      version: 3,
      status: 'published',
      created_at: '2025-05-01T08:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 1 },
}

// ─── Controlled Lists ─────────────────────────────────────────────────────────

export const MOCK_CONTROLLED_LISTS = {
  items: [
    {
      id: 'mock-list-001',
      org_id: MOCK_ORG_ID,
      name: 'Document Types',
      key: 'document_types',
      description: 'List of allowed document types in the organization.',
      value_count: 5,
      status: 'active',
      created_at: '2025-01-01T08:00:00Z',
    },
    {
      id: 'mock-list-002',
      org_id: MOCK_ORG_ID,
      name: 'Project Categories',
      key: 'project_categories',
      description: 'Categorization options for projects.',
      value_count: 4,
      status: 'active',
      created_at: '2025-01-01T08:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

export const MOCK_CONTROLLED_LIST_DETAIL = {
  id: 'mock-list-001',
  org_id: MOCK_ORG_ID,
  name: 'Document Types',
  key: 'document_types',
  description: 'List of allowed document types.',
  status: 'active',
  created_at: '2025-01-01T08:00:00Z',
  values: [
    { id: 'mock-val-001', value: 'requirements', label: 'Requirements', position: 0, active: true },
    {
      id: 'mock-val-002',
      value: 'technical',
      label: 'Technical Design',
      position: 1,
      active: true,
    },
    { id: 'mock-val-003', value: 'analysis', label: 'Analysis', position: 2, active: true },
    { id: 'mock-val-004', value: 'notes', label: 'Meeting Notes', position: 3, active: true },
    { id: 'mock-val-005', value: 'report', label: 'Report', position: 4, active: true },
  ],
}

// ─── Stakeholders ─────────────────────────────────────────────────────────────

export const MOCK_STAKEHOLDERS = {
  items: [
    {
      id: 'mock-stakeholder-001',
      org_id: MOCK_ORG_ID,
      name: 'Product Management',
      type: 'internal_team',
      influence: 'high',
      interest: 'high',
      description: 'Owns the product roadmap and requirements.',
      created_at: '2025-01-15T08:00:00Z',
    },
    {
      id: 'mock-stakeholder-002',
      org_id: MOCK_ORG_ID,
      name: 'Engineering Team',
      type: 'internal_team',
      influence: 'high',
      interest: 'medium',
      description: 'Responsible for implementation.',
      created_at: '2025-01-15T08:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

// ─── Audit Events ─────────────────────────────────────────────────────────────

export const MOCK_AUDIT_EVENTS = {
  items: [
    {
      id: 'mock-audit-001',
      org_id: MOCK_ORG_ID,
      entity_type: 'document',
      entity_id: 'mock-doc-001',
      action: 'created',
      actor_id: MOCK_USER_ID,
      actor_name: 'Alice Nguyen',
      details: {},
      created_at: '2025-06-01T14:00:00Z',
    },
    {
      id: 'mock-audit-002',
      org_id: MOCK_ORG_ID,
      entity_type: 'project',
      entity_id: MOCK_PROJECT_ID_1,
      action: 'updated',
      actor_id: MOCK_USER_ID,
      actor_name: 'Alice Nguyen',
      details: {},
      created_at: '2025-05-28T11:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 2 },
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export const MOCK_ATTACHMENTS = {
  items: [],
  page: { limit: 20, offset: 0, total: 0 },
}

// ─── Change Requests ──────────────────────────────────────────────────────────

export const MOCK_CHANGE_REQUESTS = {
  items: [],
  page: { limit: 20, offset: 0, total: 0 },
}

// ─── AI Document Intelligence ─────────────────────────────────────────────────

export const MOCK_AI_DOCUMENT_METADATA = {
  document_id: 'mock-doc-001',
  is_ai_generated: false,
  summary: null,
  ai_model: null,
  metadata: {},
}

// ─── Traceability ─────────────────────────────────────────────────────────────

export const MOCK_PROJECT_TRACE = {
  nodes: [],
  links: [],
}

// ─── Landscape ────────────────────────────────────────────────────────────────

export const MOCK_LANDSCAPE_NODES = {
  items: [],
  page: { limit: 50, offset: 0, total: 0 },
}

export const MOCK_LANDSCAPE_NODE_LINKS = {
  items: [],
}
