export { useProjects } from './project/hooks/useProjects'
export { useProject } from './project/hooks/useProject'
export { useCreateProjectModal } from './project/hooks/useCreateProjectModal'
export { useProjectLifecycle } from './project/hooks/useProjectLifecycle'
export { CreateProjectModal } from './project/ui/CreateProjectModal'
export { ProjectDetailView } from './project/ui/ProjectDetailView'
export { ProjectOverviewView } from './project/ui/ProjectOverviewView'
export { ProjectSettingsView } from './project/ui/ProjectSettingsView'
export { ProjectMemberPermissionsView } from './project/ui/ProjectMemberPermissionsView'
export { ProjectsListView } from './project/ui/ProjectsListView'
export { ProjectWorkItemsView } from './task/presentation/ui/ProjectWorkItemsView'
export { useProjectTasks } from './task/presentation/hooks/useProjectTasks'
export { useProjectPhases } from './phase/presentation/hooks/useProjectPhases'
export { usePhaseWatch } from './phase/presentation/hooks/usePhaseWatch'
export { PhaseWatchWidget } from './phase/presentation/ui/PhaseWatchWidget'
export { CurrentNextPhaseWidget } from './phase/presentation/ui/CurrentNextPhaseWidget'
export { PhaseFollowUpDrawer } from './phase/presentation/ui/PhaseFollowUpDrawer'
export type { PhaseWatchProjectRow } from './phase/domain/model/phase-watch'
export { PhaseWatchFollowUpKind, PhaseWatchSignal } from './phase/domain/enums/phase-watch.enum'
export { MeetingsListView } from './meetings/presentation/ui/MeetingsListView'
export { MeetingWorkspaceView } from './meetings/presentation/ui/MeetingWorkspaceView'
export { MeetingModeSwitcher } from './meetings/presentation/ui/MeetingModeSwitcher'
export { MeetingLifecycleStepper } from './meetings/presentation/ui/MeetingLifecycleStepper'
export { CreateActionItemModal } from './meetings/presentation/ui/CreateActionItemModal'
export { useProjectMeetings } from './meetings/presentation/hooks/useProjectMeetings'
export { useMeetingDetail } from './meetings/presentation/hooks/useMeetingDetail'
export {
  defaultMeetingWorkspaceMode,
  MEETING_WORKSPACE_MODE_LABEL,
  MEETING_WORKSPACE_STEPS,
  type MeetingWorkspaceMode,
} from './meetings/domain/rules/meeting.rules'
export { ProjectQuestionsView } from './questions/ui/ProjectQuestionsView'
export { ProjectRequirementsView } from './requirements/ui/ProjectRequirementsView'
export { useProjectQuestions } from './questions/hooks/useProjectQuestions'
export { useRequirements } from './requirements/hooks/useRequirements'
export { useQuestionsGenerate, useQuestionsCommit } from './questions/hooks/useAiQuestions'
export {
  useIntakesUploadUrl,
  useCreateIntake,
  useImpactAnalysis,
  useImpactAnalysisCommit,
} from './ai-impact/hooks/useAiImpact'
export {
  ProjectStepIndicator,
  buildProjectFlowSteps,
  PROJECT_FLOW_STEP_IDS,
} from './project/ui/ProjectStepIndicator'
export type {
  Project,
  ProjectDetail,
  ProjectListItem,
  CreateProjectModalProps,
  ProjectTemplateSelectOption,
  UpdateProjectPayload,
} from './project/model/project'
export type {
  ProjectQuestion,
  ProjectQuestionsResponse,
  CreateQuestionPayload,
} from './questions/model/questions'
export type {
  Requirement,
  RequirementType,
  RequirementsListResponse,
} from './requirements/model/requirements'
export type {
  AiQuestionsGenerateEngine,
  GeneratedQuestionItem,
  QuestionsCommitBody,
  QuestionsCommitEdit,
  QuestionsCommitPatch,
  QuestionsGenerateBody,
  QuestionsGenerateResponse,
} from './questions/model/ai-questions'
export type {
  ImpactAnalysisBody,
  ImpactAnalysisResponse,
  ImpactCommitBody,
  ImpactCommitDecision,
  ImpactProposal,
  IntakesCreateBody,
  IntakesCreateResponse,
  IntakesUploadUrlBody,
  IntakesUploadUrlResponse,
} from './ai-impact/model/ai-impact'
export type { TraceLinksListResponse } from './traceability/model/traceability'
export {
  TraceabilityMatrixView,
  ApplicationRegistryView,
  ApplicationWorkbenchView,
  FunctionalCatalogView,
  ProjectApplicationStructureView,
  OverallStructurePanel,
} from './traceability'
export type { ProjectTask, CreateTaskPayload, UpdateTaskPayload } from './task/domain/model/task'
export type { ProjectPhase, CreateProjectPhasePayload } from './phase/domain/model/phase'
export type { Meeting, CreateMeetingPayload, UpdateMeetingPayload } from './meetings/domain/model/meeting'
export type { MeetingMinutes } from './meetings/domain/model/meeting-minutes'
export type {
  MeetingActionItem,
  CreateActionItemPayload,
} from './meetings/domain/model/meeting-action-item'
export {
  ProjectStatus,
  ProjectPhaseStatus,
  TaskStatus,
  TaskPriority,
} from './project/domain/enums/project.enum'
export {
  MeetingStatus,
  MeetingMinutesStatus,
  MeetingActionItemStatus,
} from './meetings/domain/enums/meeting.enum'
export * as projectsApi from './project/api/projects.api'
export * as phasesApi from './phase/infrastructure/api/phases.api'
export * as tasksApi from './task/infrastructure/api/tasks.api'
export * as questionsApi from './questions/api/questions.api'
export * as requirementsApi from './requirements/api/requirements.api'
export * as aiQuestionsApi from './questions/api/ai-questions.api'
export * as aiImpactApi from './ai-impact/api/ai-impact.api'

/* --- Wave 2 P3: Scope, Deliverables, RAID, Decisions, Reports --- */
export { ScopeRegisterView } from './scope/presentation/ui/ScopeRegisterView'
export { useScopeRegister } from './scope/presentation/hooks/useScopeRegister'
export * as scopeApi from './scope/infrastructure/api/scope.api'
export type {
  ScopePackage,
  ScopeItem,
  CreateScopePackagePayload,
  CreateScopeItemPayload,
  UpdateScopeItemPayload,
} from './scope/domain/model/scope'
export {
  ScopePackageStatus,
  ScopeItemType,
  ScopeItemPriority,
} from './scope/domain/enums/scope.enum'

export { DeliverablesView } from './deliverables/presentation/ui/DeliverablesView'
export { useDeliverables } from './deliverables/presentation/hooks/useDeliverables'
export { useDeliverableDetail } from './deliverables/presentation/hooks/useDeliverableDetail'
export * as deliverablesApi from './deliverables/infrastructure/api/deliverables.api'
export type {
  Deliverable,
  AcceptanceCriteria,
  CreateDeliverablePayload,
  UpdateDeliverablePayload,
} from './deliverables/domain/model/deliverable'
export {
  DeliverableStatus,
  AcceptanceCriteriaStatus,
} from './deliverables/domain/enums/deliverable.enum'

export { RaidRegisterView } from './raid/presentation/ui/RaidRegisterView'
export { RaidRiskMatrixView } from './raid/presentation/ui/RaidRiskMatrixView'
export { CreateRaidItemModal } from './raid/presentation/ui/CreateRaidItemModal'
export { useRaidRegister } from './raid/presentation/hooks/useRaidRegister'
export * as raidApi from './raid/infrastructure/api/raid.api'
export type { RaidItem, CreateRaidItemPayload, UpdateRaidItemPayload } from './raid/domain/model/raid'
export {
  RaidItemType,
  RaidItemStatus,
  RaidRiskProbability,
  RaidRiskImpact,
  RaidRiskResponseStrategy,
  RaidIssueSeverity,
  RaidValidationStatus,
  RaidDependencyType,
} from './raid/domain/enums/raid.enum'

export { DecisionsView } from './decisions/presentation/ui/DecisionsView'
export { useDecisions } from './decisions/presentation/hooks/useDecisions'
export { useDecisionDetail } from './decisions/presentation/hooks/useDecisionDetail'
export * as decisionsApi from './decisions/infrastructure/api/decisions.api'
export type {
  DecisionRecord,
  DecisionOption,
  CreateDecisionPayload,
  UpdateDecisionPayload,
} from './decisions/domain/model/decision'
export { DecisionStatus, DecisionCategory } from './decisions/domain/enums/decision.enum'

export { ProjectReportsView } from './reports/presentation/ui/ProjectReportsView'
export { useProjectReports } from './reports/presentation/hooks/useProjectReports'
export * as reportsApi from './reports/infrastructure/api/reports.api'
export type {
  ProjectReportKey,
  ProjectReportOption,
  ProjectReportResult,
} from './reports/domain/model/reports'
export { PROJECT_REPORT_OPTIONS } from './reports/domain/rules/reports.rules'
export * as meetingsApi from './meetings/infrastructure/api/meetings.api'

/* --- Meeting Series --- */
export { MeetingSeriesView } from './meeting-series/presentation/ui/MeetingSeriesView'
export { CreateMeetingSeriesModal } from './meeting-series/presentation/ui/CreateMeetingSeriesModal'
export { useProjectMeetingSeries } from './meeting-series/presentation/hooks/useProjectMeetingSeries'
export * as meetingSeriesApi from './meeting-series/infrastructure/api/meeting-series.api'
export { SeriesStatus } from './meeting-series/domain/enums/meeting-series.enum'
export type {
  MeetingSeries,
  CreateMeetingSeriesPayload,
  UpdateMeetingSeriesPayload,
} from './meeting-series/domain/model/meeting-series'

/* --- Wave 2 P2: WBS, Gantt, Schedule (Planning MVP) --- */
export { ProjectWbsView } from './wbs/presentation/ui/ProjectWbsView'
export { useProjectWbs } from './wbs/presentation/hooks/useProjectWbs'
export * as wbsApi from './wbs/infrastructure/api/wbs.api'
export type {
  WbsNode,
  WbsTreeNode,
  CreateWbsNodePayload,
  UpdateWbsNodePayload,
  MoveWbsNodePayload,
} from './wbs/domain/model/wbs'
export { WbsNodeStatus, WbsNodeType } from './wbs/domain/enums/wbs.enum'

export { ProjectGanttView } from './gantt/presentation/ui/ProjectGanttView'
/** @deprecated Prefer ProjectGanttView — same timeline page. */
export { ProjectGanttView as ProjectTimelineView } from './gantt/presentation/ui/ProjectGanttView'
export { useProjectGantt } from './gantt/presentation/hooks/useProjectGantt'
export * as ganttApi from './gantt/infrastructure/api/gantt.api'
export type {
  GanttItem,
  GanttTreeItem,
  GanttView,
  GanttViewParams,
  GanttSummary,
  RecalculateGanttPayload,
} from './gantt/domain/model/gantt'

export { ProjectScheduleView } from './schedule/presentation/ui/ProjectScheduleView'
export { useProjectSchedule } from './schedule/presentation/hooks/useProjectSchedule'
export * as scheduleApi from './schedule/infrastructure/api/schedule.api'
export type {
  ScheduleRun,
  CreateScheduleRunPayload,
  CreateScheduleRunOptions,
  TaskSchedule,
  TaskScheduleParams,
} from './schedule/domain/model/schedule'
export { ScheduleRunStatus } from './schedule/domain/enums/schedule.enum'

/* --- Deliverable Review --- */
export { DeliverableReviewPanel } from './deliverable-review'
export { useDeliverableReview } from './deliverable-review'
export type { DeliverableReview } from './deliverable-review'
export { ReviewStatus } from './deliverable-review'
