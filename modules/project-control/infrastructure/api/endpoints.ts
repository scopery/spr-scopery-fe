import { apiPath } from '@/shared/lib/api-paths'

export const PROJECT_CONTROL_ENDPOINTS = {
  baselines: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/baselines`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/baselines`),
    current: (projectId: string) => apiPath(`/projects/${projectId}/baseline/current`),
    get: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}`),
    update: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}`),
    refreshSnapshot: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}/refresh-snapshot`),
    validate: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}/validate`),
    approve: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}/approve`),
    markCurrent: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}/mark-current`),
    archive: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}/archive`),
    compareCurrent: (projectId: string, baselineId: string) =>
      apiPath(`/projects/${projectId}/baselines/${baselineId}/compare-current`),
  },
  changeRequests: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/change-requests`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/change-requests`),
    get: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}`),
    update: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}`),
    submit: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/submit`),
    approve: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/approve`),
    reject: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/reject`),
    cancel: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/cancel`),
    apply: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/apply`),
    archive: (projectId: string, changeRequestId: string) =>
      apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/archive`),
    items: {
      list: (projectId: string, changeRequestId: string) =>
        apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/items`),
      create: (projectId: string, changeRequestId: string) =>
        apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/items`),
      update: (projectId: string, changeRequestId: string, itemId: string) =>
        apiPath(
          `/projects/${projectId}/change-requests/${changeRequestId}/items/${itemId}`),
      delete: (projectId: string, changeRequestId: string, itemId: string) =>
        apiPath(
          `/projects/${projectId}/change-requests/${changeRequestId}/items/${itemId}`),
    },
    impact: {
      get: (projectId: string, changeRequestId: string) =>
        apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/impact`),
      put: (projectId: string, changeRequestId: string) =>
        apiPath(`/projects/${projectId}/change-requests/${changeRequestId}/impact`),
      calculate: (projectId: string, changeRequestId: string) =>
        apiPath(
          `/projects/${projectId}/change-requests/${changeRequestId}/impact/calculate`),
    },
    changeOrders: {
      list: (projectId: string, changeRequestId: string) =>
        apiPath(
          `/projects/${projectId}/change-requests/${changeRequestId}/change-orders`),
      create: (projectId: string, changeRequestId: string) =>
        apiPath(
          `/projects/${projectId}/change-requests/${changeRequestId}/change-orders`),
    },
  },
  changeOrders: {
    get: (projectId: string, changeOrderId: string) =>
      apiPath(`/projects/${projectId}/change-orders/${changeOrderId}`),
    approve: (projectId: string, changeOrderId: string) =>
      apiPath(`/projects/${projectId}/change-orders/${changeOrderId}/approve`),
    reject: (projectId: string, changeOrderId: string) =>
      apiPath(`/projects/${projectId}/change-orders/${changeOrderId}/reject`),
    archive: (projectId: string, changeOrderId: string) =>
      apiPath(`/projects/${projectId}/change-orders/${changeOrderId}/archive`),
  },
} as const
