import { apiPath } from '@/shared/lib/api-paths'

export const AUTOMATION_ENDPOINTS = {
  reminderRules: {
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/notifications/reminder-rules`),
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/notifications/reminder-rules`),
  },
  alertRules: {
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/notifications/alert-rules`),
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/notifications/alert-rules`),
  },
  digestRules: {
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/notifications/digest-rules`),
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/notifications/digest-rules`),
  },
  digestRuns: {
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/notifications/digest-runs`),
  },
} as const
