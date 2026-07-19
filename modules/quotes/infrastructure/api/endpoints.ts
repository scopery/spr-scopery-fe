import { apiPath } from '@/shared/lib/api-paths'

export const QUOTE_ENDPOINTS = {
  quotes: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/quotes`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/quotes`),
    get: (projectId: string, quoteId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}`),
    update: (projectId: string, quoteId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}`),
    archive: (projectId: string, quoteId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}/archive`),
  },
  versions: {
    list: (projectId: string, quoteId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}/versions`),
    create: (projectId: string, quoteId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}/versions`),
    get: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}/versions/${versionId}`),
    update: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}/versions/${versionId}`),
    duplicate: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/duplicate`),
    archive: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/archive`),
    summary: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/summary`),
    recalculate: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/recalculate`),
    solveTargetMargin: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/solve-target-margin`),
    submit: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/submit`),
    approve: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/approve`),
    reject: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/reject`),
    send: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(`/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/send`),
    markAccepted: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/mark-accepted`),
    markCurrent: (projectId: string, quoteId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/mark-current`),
    lines: {
      list: (projectId: string, quoteId: string, versionId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/lines`),
      create: (projectId: string, quoteId: string, versionId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/lines`),
      update: (projectId: string, quoteId: string, versionId: string, lineId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/lines/${lineId}`),
      delete: (projectId: string, quoteId: string, versionId: string, lineId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/lines/${lineId}`),
      reorder: (projectId: string, quoteId: string, versionId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/lines/reorder`),
    },
    terms: {
      list: (projectId: string, quoteId: string, versionId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/terms`),
      create: (projectId: string, quoteId: string, versionId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/terms`),
      update: (projectId: string, quoteId: string, versionId: string, termId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/terms/${termId}`),
      delete: (projectId: string, quoteId: string, versionId: string, termId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/terms/${termId}`),
      reorder: (projectId: string, quoteId: string, versionId: string) =>
        apiPath(
          `/projects/${projectId}/quotes/${quoteId}/versions/${versionId}/terms/reorder`),
    },
  },
} as const
