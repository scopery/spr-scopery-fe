export {
  BaselineStatus,
  ChangeRequestStatus,
  ChangeType,
  ChangePriority,
  ChangeItemOperation,
  AffectedArea,
  ScopeImpact,
  RiskImpact,
  ChangeOrderStatus,
} from './domain/enums/project-control.enum'

export type {
  ProjectBaseline,
  BaselineSummary,
  BaselineTreeNode,
  BaselineHealth,
  BaselineProvenance,
  BaselineCompareResponse,
  CreateBaselinePayload,
  ChangeRequest,
  CreateChangeRequestPayload,
  ChangeRequestItem,
  ChangeImpact,
  ChangeOrder,
} from './domain/model/project-control'

export {
  baselineStatusLabel,
  baselineStatusTone,
  canEditBaseline,
  canValidateBaseline,
  canApproveBaseline,
  canMarkBaselineCurrent,
  canCaptureBaselineSnapshot,
  shouldCreateUpdatedBaseline,
  mapBaselineSummaryToMetrics,
  mapProjectTree,
  buildBaselineHealth,
  crStatusLabel,
  crStatusTone,
  canEditChangeRequest,
  canSubmitChangeRequest,
  canApproveChangeRequest,
  canRejectChangeRequest,
  canApplyChangeRequest,
  changeTypeLabel,
  priorityTone,
  priorityLabel,
  changeItemOperationLabel,
  changeItemTargetLabel,
  affectedAreaLabel,
  getCrSubmitBlockers,
  isCrReadyToSubmit,
  getCrWorkflowPhase,
  getCrNextStepHint,
  shouldShowImplementationPlan,
} from './domain/rules/project-control.rules'

export type {
  CrWorkflowPhase,
  BaselineViewMode,
  BaselineSummaryMetrics,
  BaselineHealthSummary,
  SnapshotTreeNode,
} from './domain/rules/project-control.rules'

export * as projectControlApi from './infrastructure/api/project-control.api'

export { useBaselines } from './presentation/hooks/useBaselines'
export { useBaselineDetail } from './presentation/hooks/useBaselineDetail'
export {
  useChangeRequests,
  useChangeRequestWorkbench,
  type CrWorkbenchTab,
} from './presentation/hooks/useChangeRequests'

export { BaselinesRegisterView } from './presentation/ui/BaselinesRegisterView'
export { BaselineDetailView } from './presentation/ui/BaselineDetailView'
export { ChangeRequestsRegisterView } from './presentation/ui/ChangeRequestsRegisterView'
export { ChangeRequestWorkbenchView } from './presentation/ui/ChangeRequestWorkbenchView'
