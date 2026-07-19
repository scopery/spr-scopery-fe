// Domain — enums
export {
  RateCardScope,
  RateCardEntityStatus,
  RateCardStatus,
  RateCardVersionStatus,
  CompoundFrequency,
  RateType,
} from './domain/enums/rate-card.enum'

// Domain — models
export type { PageResponse, PageParams } from './domain/model/common'
export type {
  CostRole,
  CreateCostRolePayload,
  UpdateCostRolePayload,
  CostRoleSearchParams,
} from './domain/model/cost-role'
export type {
  InflationPolicy,
  CreateInflationPolicyPayload,
  UpdateInflationPolicyPayload,
  InflationPolicySearchParams,
} from './domain/model/inflation-policy'
export type {
  MemberCostRole,
  CreateMemberCostRolePayload,
  UpdateMemberCostRolePayload,
  MemberCostRoleSearchParams,
} from './domain/model/member-cost-role'
export type {
  RateCard,
  CreateRateCardPayload,
  UpdateRateCardPayload,
  RateCardSearchParams,
} from './domain/model/rate-card'
export type {
  RateCardVersion,
  CreateRateCardVersionPayload,
  UpdateRateCardVersionPayload,
} from './domain/model/rate-card-version'
export type {
  RateCardLine,
  CreateRateCardLinePayload,
  UpdateRateCardLinePayload,
} from './domain/model/rate-card-line'
export type {
  ResolveRatePayload,
  RateSnapshot,
  PreviewTaskRatePayload,
  TaskRatePreview,
} from './domain/model/rate-resolution'

// Domain — rules
export {
  isCostRoleActive,
  isCostRoleArchived,
  isInflationPolicyActive,
  isInflationPolicyArchived,
  isMemberCostRoleActive,
  isMemberCostRoleArchived,
  isRateCardDraft,
  isRateCardArchived,
  canArchiveRateCard,
  isVersionDraft,
  isVersionPublished,
  isVersionArchived,
  canEditVersionLines,
  canPublishVersion,
  canArchiveVersion,
  canDuplicateVersion,
} from './domain/rules/rate-card.rules'

// Infrastructure — API
export * as costRolesApi from './infrastructure/api/cost-roles.api'
export * as inflationPoliciesApi from './infrastructure/api/inflation-policies.api'
export * as memberCostRolesApi from './infrastructure/api/member-cost-roles.api'
export * as rateCardsApi from './infrastructure/api/cards.api'
export * as rateCardVersionsApi from './infrastructure/api/versions.api'
export * as rateCardLinesApi from './infrastructure/api/lines.api'
export * as rateResolutionApi from './infrastructure/api/resolution.api'

// Presentation — hooks
export { useCostingSetup } from './presentation/hooks/useCostingSetup'
export { useRateCardLibrary } from './presentation/hooks/useRateCardLibrary'
export type { CreateRateCardFormPayload } from './presentation/hooks/useRateCardLibrary'
export { useRateCardEditor } from './presentation/hooks/useRateCardEditor'
export { useRateResolution } from './presentation/hooks/useRateResolution'

// Presentation — views
export { CostingSetupView } from './presentation/ui/CostingSetupView'
export { RateCardLibraryView } from './presentation/ui/RateCardLibraryView'
export { RateCardEditorView } from './presentation/ui/RateCardEditorView'
export { RateResolutionView } from './presentation/ui/RateResolutionView'
export { RateLookupView } from './presentation/ui/RateLookupView'
