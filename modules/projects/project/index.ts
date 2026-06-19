export { ProjectsListView } from './ui/ProjectsListView'
export { ProjectDetailView } from './ui/ProjectDetailView'
export { useProjects } from './hooks/useProjects'
export { useProject } from './hooks/useProject'
export { useCreateProjectModal } from './hooks/useCreateProjectModal'
export { CreateProjectModal } from './ui/CreateProjectModal'
export {
  ProjectStepIndicator,
  buildProjectFlowSteps,
  PROJECT_FLOW_STEP_IDS,
} from './ui/ProjectStepIndicator'
export type {
  Project,
  ProjectDetail,
  ProjectListItem,
  CreateProjectModalProps,
  ProjectTemplateSelectOption,
} from './model/project'
export * as projectsApi from './api/projects.api'
