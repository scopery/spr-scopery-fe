import { apiPath } from '@/shared/lib/api-paths'

/**
 * Meetings (Wave 2 — Collaboration)
 * Base: /api/projects/{projectId}/meetings
 */
export const MEETING_ENDPOINTS = {
  list: (projectId: string, params?: { page?: number; size?: number }) => {
    const p = new URLSearchParams()
    if (params?.page != null) p.set('page', String(params.page))
    if (params?.size != null) p.set('size', String(params.size))
    const q = p.toString()
    return apiPath(`/projects/${projectId}/meetings`) + (q ? `?${q}` : '')
  },
  get: (projectId: string, meetingId: string) =>
    apiPath(`/projects/${projectId}/meetings/${meetingId}`),
  create: (projectId: string) => apiPath(`/projects/${projectId}/meetings`),
  update: (projectId: string, meetingId: string) =>
    apiPath(`/projects/${projectId}/meetings/${meetingId}`),
  start: (projectId: string, meetingId: string) =>
    apiPath(`/projects/${projectId}/meetings/${meetingId}/start`),
  complete: (projectId: string, meetingId: string) =>
    apiPath(`/projects/${projectId}/meetings/${meetingId}/complete`),
  cancel: (projectId: string, meetingId: string) =>
    apiPath(`/projects/${projectId}/meetings/${meetingId}/cancel`),
  archive: (projectId: string, meetingId: string) =>
    apiPath(`/projects/${projectId}/meetings/${meetingId}/archive`),

  agendaItems: {
    list: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/agenda-items`),
    create: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/agenda-items`),
    update: (projectId: string, meetingId: string, agendaItemId: string) =>
      apiPath(
        `/projects/${projectId}/meetings/${meetingId}/agenda-items/${agendaItemId}`),
    delete: (projectId: string, meetingId: string, agendaItemId: string) =>
      apiPath(
        `/projects/${projectId}/meetings/${meetingId}/agenda-items/${agendaItemId}`),
    reorder: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/agenda-items/reorder`),
  },

  participants: {
    list: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/participants`),
    create: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/participants`),
    update: (projectId: string, meetingId: string, participantId: string) =>
      apiPath(
        `/projects/${projectId}/meetings/${meetingId}/participants/${participantId}`),
    remove: (projectId: string, meetingId: string, participantId: string) =>
      apiPath(
        `/projects/${projectId}/meetings/${meetingId}/participants/${participantId}`),
    markAttended: (projectId: string, meetingId: string, participantId: string) =>
      apiPath(
        `/projects/${projectId}/meetings/${meetingId}/participants/${participantId}/attended`),
  },

  minutes: {
    list: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/minutes`),
    create: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/minutes`),
    update: (projectId: string, meetingId: string, minutesId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/minutes/${minutesId}`),
    submitReview: (projectId: string, meetingId: string, minutesId: string) =>
      apiPath(
        `/projects/${projectId}/meetings/${meetingId}/minutes/${minutesId}/submit-review`),
    approve: (projectId: string, meetingId: string, minutesId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/minutes/${minutesId}/approve`),
    reject: (projectId: string, meetingId: string, minutesId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/minutes/${minutesId}/reject`),
    generateDocument: (projectId: string, meetingId: string, minutesId: string) =>
      apiPath(
        `/projects/${projectId}/meetings/${meetingId}/minutes/${minutesId}/generate-document`),
  },

  actionItems: {
    list: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/action-items`),
    create: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/action-items`),
    /* --- Standalone (read + update): /api/projects/{projectId}/meeting-action-items --- */
    get: (projectId: string, actionItemId: string) =>
      apiPath(`/projects/${projectId}/meeting-action-items/${actionItemId}`),
    update: (projectId: string, actionItemId: string) =>
      apiPath(`/projects/${projectId}/meeting-action-items/${actionItemId}`),
    complete: (projectId: string, actionItemId: string) =>
      apiPath(`/projects/${projectId}/meeting-action-items/${actionItemId}/complete`),
    archive: (projectId: string, actionItemId: string) =>
      apiPath(`/projects/${projectId}/meeting-action-items/${actionItemId}/archive`),
    createLinkedTask: (projectId: string, actionItemId: string) =>
      apiPath(
        `/projects/${projectId}/meeting-action-items/${actionItemId}/create-linked-task`),
  },
  notes: {
    list: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes`),
    create: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes`),
    update: (projectId: string, meetingId: string, noteId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes/${noteId}`),
    archive: (projectId: string, meetingId: string, noteId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes/${noteId}/archive`),
    convertToDecision: (projectId: string, meetingId: string, noteId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes/${noteId}/convert-to-decision`),
    convertToRaidItem: (projectId: string, meetingId: string, noteId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes/${noteId}/convert-to-raid-item`),
    convertToRequirement: (projectId: string, meetingId: string, noteId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes/${noteId}/convert-to-requirement`),
    convertToChangeRequest: (projectId: string, meetingId: string, noteId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/notes/${noteId}/convert-to-change-request`),
  },

  artifactLinks: {
    list: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/artifact-links`),
    create: (projectId: string, meetingId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/artifact-links`),
    delete: (projectId: string, meetingId: string, linkId: string) =>
      apiPath(`/projects/${projectId}/meetings/${meetingId}/artifact-links/${linkId}`),
  },
} as const
