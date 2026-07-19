import { apiPath } from '@/shared/lib/api-paths'

function buildQuery(params?: object): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const CAPACITY_ENDPOINTS = {
  calendars: {
    list: (params: object) => apiPath(`/capacity/calendars${buildQuery(params)}`),
    create: (workspaceId: string) =>
      apiPath(`/capacity/calendars${buildQuery({ workspaceId })}`),
    get: (calendarId: string) => apiPath(`/capacity/calendars/${calendarId}`),
    update: (calendarId: string) => apiPath(`/capacity/calendars/${calendarId}`),
    activate: (calendarId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/activate`),
    deactivate: (calendarId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/deactivate`),
    archive: (calendarId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/archive`),
    setDefault: (calendarId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/set-default`),
  },
  dayRules: {
    list: (calendarId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/day-rules`),
    replace: (calendarId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/day-rules`),
  },
  exceptions: {
    list: (calendarId: string, params?: object) =>
      apiPath(`/capacity/calendars/${calendarId}/exceptions${buildQuery(params)}`),
    create: (calendarId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/exceptions`),
    get: (calendarId: string, exceptionId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/exceptions/${exceptionId}`),
    update: (calendarId: string, exceptionId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/exceptions/${exceptionId}`),
    delete: (calendarId: string, exceptionId: string) =>
      apiPath(`/capacity/calendars/${calendarId}/exceptions/${exceptionId}`),
  },
  roles: {
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/resources/roles`),
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/resources/roles`),
  },
  skills: {
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/resources/skills`),
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/resources/skills`),
  },
  resources: {
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/resources`),
    get: (workspaceId: string, resourceId: string) =>
      apiPath(`/workspaces/${workspaceId}/resources/${resourceId}`),
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/resources`),
    archive: (workspaceId: string, resourceId: string) =>
      apiPath(`/workspaces/${workspaceId}/resources/${resourceId}/archive`),
    syncFromMembers: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/resources/sync-from-members`),
    rebuildUtilization: (workspaceId: string, resourceId: string) =>
      apiPath(`/workspaces/${workspaceId}/resources/${resourceId}/utilization/rebuild`),
  },
  calculation: {
    overview: (workspaceId: string, params?: object) =>
      apiPath(
        `/capacity/workspaces/${workspaceId}/overview${buildQuery(params)}`),
    overAllocations: (params: object) =>
      apiPath(`/capacity/over-allocations${buildQuery(params)}`),
    calculate: (workspaceId: string) =>
      apiPath(`/capacity/calculate${buildQuery({ workspaceId })}`),
    userAvailability: (userId: string, params: object) =>
      apiPath(`/capacity/users/${userId}/availability${buildQuery(params)}`),
    projectAllocationSummary: (projectId: string, params?: object) =>
      apiPath(
        `/capacity/projects/${projectId}/allocations/summary${buildQuery(params)}`),
  },
  allocations: {
    list: (params: object) =>
      apiPath(`/capacity/project-allocations${buildQuery(params)}`),
    create: (workspaceId: string) =>
      apiPath(`/capacity/project-allocations${buildQuery({ workspaceId })}`),
    get: (allocationId: string) =>
      apiPath(`/capacity/project-allocations/${allocationId}`),
    update: (allocationId: string) =>
      apiPath(`/capacity/project-allocations/${allocationId}`),
    activate: (allocationId: string) =>
      apiPath(`/capacity/project-allocations/${allocationId}/activate`),
    deactivate: (allocationId: string) =>
      apiPath(`/capacity/project-allocations/${allocationId}/deactivate`),
    archive: (allocationId: string) =>
      apiPath(`/capacity/project-allocations/${allocationId}/archive`),
  },
  taskAssignments: {
    list: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/resource-assignments`),
    create: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/resource-assignments`),
    delete: (projectId: string, taskId: string, assignmentId: string) =>
      apiPath(
        `/projects/${projectId}/tasks/${taskId}/resource-assignments/${assignmentId}`),
  },
  projectResources: {
    effortEstimates: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/effort-estimates`),
    actualEffort: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/actual-effort-records`),
    cancelActualEffort: (projectId: string, recordId: string) =>
      apiPath(`/projects/${projectId}/resources/actual-effort-records/${recordId}/cancel`),
    workloadSnapshots: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/workload-snapshots`),
    rebuildEffortForecast: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/effort-forecasts/rebuild`),
    rebuildCapacitySummary: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/capacity-summary/rebuild`),
    costInputs: (projectId: string, includeSensitive?: boolean) =>
      apiPath(
        `/projects/${projectId}/resources/cost-inputs${buildQuery({
          includeSensitive,
        })}`
      ),
    rebuildCostInputs: (projectId: string, includeSensitive?: boolean) =>
      apiPath(
        `/projects/${projectId}/resources/cost-inputs/rebuild${buildQuery({
          includeSensitive,
        })}`
      ),
    riskFlags: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/risk-flags`),
    mitigateRisk: (projectId: string, riskFlagId: string) =>
      apiPath(`/projects/${projectId}/resources/risk-flags/${riskFlagId}/mitigate`),
    closeRisk: (projectId: string, riskFlagId: string) =>
      apiPath(`/projects/${projectId}/resources/risk-flags/${riskFlagId}/close`),
    conflicts: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/assignment-conflicts`),
    acknowledgeConflict: (projectId: string, conflictId: string) =>
      apiPath(
        `/projects/${projectId}/resources/assignment-conflicts/${conflictId}/acknowledge`
      ),
    recalculateConflicts: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/conflicts/recalculate`),
    utilizationPolicy: (projectId: string) =>
      apiPath(`/projects/${projectId}/resources/utilization-threshold-policy`),
  },
  userProfiles: {
    list: (params: object) => apiPath(`/capacity/user-profiles${buildQuery(params)}`),
    create: (workspaceId: string) =>
      apiPath(`/capacity/user-profiles${buildQuery({ workspaceId })}`),
    get: (profileId: string) => apiPath(`/capacity/user-profiles/${profileId}`),
    update: (profileId: string) => apiPath(`/capacity/user-profiles/${profileId}`),
    activate: (profileId: string) =>
      apiPath(`/capacity/user-profiles/${profileId}/activate`),
    deactivate: (profileId: string) =>
      apiPath(`/capacity/user-profiles/${profileId}/deactivate`),
    archive: (profileId: string) =>
      apiPath(`/capacity/user-profiles/${profileId}/archive`),
  },
  utilizationPolicy: {
    getWorkspace: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/resources/utilization-threshold-policy`),
    updateWorkspace: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/resources/utilization-threshold-policy`),
  },
} as const
