/**
 * API v2 enums — match Scopery API doc.
 * Use single_select / multi_select (not single_choice).
 */

export type ProfileRole = 'admin' | 'user'
export type ProfileStatus = 'active' | 'suspended'

export type OrgStatus = 'active' | 'deactivated'
export type OrgMemberRole = 'owner' | 'member' | 'partner'
export type OrgMemberStatus = 'active' | 'removed'

export type ProjectRole = 'editor' | 'viewer'

export type TemplateStatus = 'draft' | 'published' | 'deprecated'

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'single_select'
  | 'multi_select'
  | 'number'
  | 'date'
  | 'boolean'
  | 'json'

export type SessionStatus = 'in_progress' | 'submitted' | 'locked'

export type AnswerStatus = 'answered' | 'skipped' | 'na'

export type QuestionSource = 'manual' | 'template'
/** Project question source (project_questions.source). */
export type ProjectQuestionSource = 'template' | 'manual' | 'ai'

/** AI Questions Generate Engine */
export type AiQuestionsGenerateEngine = 'legacy' | 'agentkit_v2_file'

/** AI Engine Types (for admin config) */
export type AiEngineType = 'legacy_chat' | 'workflow_api' | 'agents_sdk'

/** AI Purpose */
export type AiPurpose =
  | 'improve_answer'
  | 'qgen_clarifying_questions'
  | 'clarity_assess_one'
  | 'impact_analysis'

/** AI Run Status */
export type AiRunStatus = 'success' | 'fallback_success' | 'failed'

/** Org Node Types */
export type OrgNodeType = 'system' | 'subsystem' | 'module'

/** Org Node Status */
export type OrgNodeStatus = 'active' | 'archived'

/** Node Link Types */
export type NodeLinkType = 'integrates_with' | 'shares_data_with' | 'depends_on' | 'relates_to'

/** Scope Role */
export type ScopeRole = 'primary' | 'impacted' | 'out_of_scope'

/** Actor Kind */
export type ActorKind = 'persona' | 'system' | 'team' | 'external'

/** Requirement Type */
export type RequirementType = 'BO' | 'BR' | 'FR' | 'NFR'

/** Trace Link Type */
export type TraceLinkType = 'implements' | 'satisfies' | 'relates_to' | 'traces_to'

/** Trace Entity Type */
export type TraceEntityType = 'requirement' | 'org_node'
