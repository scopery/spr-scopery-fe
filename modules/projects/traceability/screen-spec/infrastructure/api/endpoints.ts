import { apiPath } from '@/shared/lib/api-paths'

export const SCREEN_SPEC_ENDPOINTS = {
  dataEntityFields: (workspaceId: string, entityId: string) =>
    apiPath(`/workspaces/${workspaceId}/data-entities/${entityId}/fields`),
  dataEntityField: (workspaceId: string, entityId: string, fieldId: string) =>
    apiPath(`/workspaces/${workspaceId}/data-entities/${entityId}/fields/${fieldId}`),

  applicationComponent: (workspaceId: string, applicationId: string, componentId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/components/${componentId}`),
  componentOptions: (workspaceId: string, componentId: string) =>
    apiPath(`/workspaces/${workspaceId}/application-components/${componentId}/options`),
  componentOption: (workspaceId: string, componentId: string, optionId: string) =>
    apiPath(`/workspaces/${workspaceId}/application-components/${componentId}/options/${optionId}`),
  componentFields: (workspaceId: string, componentId: string) =>
    apiPath(`/workspaces/${workspaceId}/application-components/${componentId}/fields`),
  componentField: (workspaceId: string, componentId: string, fieldId: string) =>
    apiPath(`/workspaces/${workspaceId}/application-components/${componentId}/fields/${fieldId}`),
  componentApis: (workspaceId: string, componentId: string) =>
    apiPath(`/workspaces/${workspaceId}/application-components/${componentId}/apis`),
  componentApi: (workspaceId: string, componentId: string, apiLinkId: string) =>
    apiPath(`/workspaces/${workspaceId}/application-components/${componentId}/apis/${apiLinkId}`),

  bindComponentToSection: (workspaceId: string, screenId: string, sectionId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/sections/${sectionId}/bind-component`),

  screenModes: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/modes`),
  screenMode: (workspaceId: string, screenId: string, modeId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/modes/${modeId}`),

  screenField: (workspaceId: string, screenId: string, fieldId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/fields/${fieldId}`),
  fieldModeConfigs: (workspaceId: string, screenId: string, fieldId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/fields/${fieldId}/mode-configs`),
  fieldValidations: (workspaceId: string, screenId: string, fieldId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/fields/${fieldId}/validations`),
  fieldValidation: (workspaceId: string, screenId: string, fieldId: string, validationId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/screens/${screenId}/fields/${fieldId}/validations/${validationId}`
    ),

  validationRuleTypes: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/validation-rule-types`),

  processItems: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/process-items`),
  processItem: (workspaceId: string, screenId: string, itemId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/process-items/${itemId}`),
  eventItems: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/event-items`),
  eventItem: (workspaceId: string, screenId: string, itemId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/event-items/${itemId}`),

  screenFullSpec: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/full-spec`),

  screenSpecDocs: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/screen-spec-docs`),
  screenSpecDocsByProject: (workspaceId: string, projectId: string) =>
    apiPath(`/workspaces/${workspaceId}/screen-spec-docs`) +
    `?${new URLSearchParams({ projectId }).toString()}`,
  screenSpecDoc: (workspaceId: string, docId: string) =>
    apiPath(`/workspaces/${workspaceId}/screen-spec-docs/${docId}`),
  screenSpecDocScreens: (workspaceId: string, docId: string) =>
    apiPath(`/workspaces/${workspaceId}/screen-spec-docs/${docId}/screens`),
  screenSpecDocScreen: (workspaceId: string, docId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screen-spec-docs/${docId}/screens/${screenId}`),
  screenSpecDocRevisions: (workspaceId: string, docId: string) =>
    apiPath(`/workspaces/${workspaceId}/screen-spec-docs/${docId}/revisions`),
  screenSpecDocRevision: (workspaceId: string, docId: string, revisionId: string) =>
    apiPath(`/workspaces/${workspaceId}/screen-spec-docs/${docId}/revisions/${revisionId}`),
  screenSpecDocFullSpec: (workspaceId: string, docId: string) =>
    apiPath(`/workspaces/${workspaceId}/screen-spec-docs/${docId}/full-spec`),

  screensImportFull: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/screens/import-full`),
} as const
