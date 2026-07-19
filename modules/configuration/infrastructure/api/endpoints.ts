import { apiPath } from '@/shared/lib/api-paths'

const workspaceConfigBase = (workspaceId: string) => `/workspaces/${workspaceId}/config`

export const CONFIGURATION_ENDPOINTS = {
  objectTypes: {
    list: () => apiPath('/config/object-types'),
  },

  customFields: {
    list: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/custom-fields`),
    create: (workspaceId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-fields`),
    get: (workspaceId: string, fieldId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}`),
  },

  fieldOptions: {
    list: (workspaceId: string, fieldId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}/options`),
    create: (workspaceId: string, fieldId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}/options`),
    archive: (workspaceId: string, fieldId: string, optionId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}/options/${optionId}/archive`
      ),
  },

  fieldValues: {
    upsert: (workspaceId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-field-values`),
    get: (workspaceId: string, objectType: string, targetId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/custom-field-values?objectType=${encodeURIComponent(
          objectType
        )}&targetId=${encodeURIComponent(targetId)}`
      ),
  },

  fieldVisibility: {
    list: (workspaceId: string, fieldId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}/visibility-policies`
      ),
    set: (workspaceId: string, fieldId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}/visibility-policies`
      ),
  },

  forms: {
    list: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/forms`),
    create: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/forms`),
    get: (workspaceId: string, formId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/forms/${formId}`),
    versions: {
      list: (workspaceId: string, formId: string) =>
        apiPath(`${workspaceConfigBase(workspaceId)}/forms/${formId}/versions`),
      create: (workspaceId: string, formId: string) =>
        apiPath(`${workspaceConfigBase(workspaceId)}/forms/${formId}/versions`),
      publish: (workspaceId: string, formId: string, versionId: string) =>
        apiPath(
          `${workspaceConfigBase(workspaceId)}/forms/${formId}/versions/${versionId}/publish`
        ),
    },
  },

  formSections: {
    list: (workspaceId: string, formId: string, versionId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/forms/${formId}/versions/${versionId}/sections`
      ),
    create: (workspaceId: string, formId: string, versionId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/forms/${formId}/versions/${versionId}/sections`
      ),
  },

  formFields: {
    list: (workspaceId: string, formId: string, versionId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/forms/${formId}/versions/${versionId}/fields`
      ),
    create: (workspaceId: string, formId: string, versionId: string) =>
      apiPath(
        `${workspaceConfigBase(workspaceId)}/forms/${formId}/versions/${versionId}/fields`
      ),
  },

  formSubmissions: {
    submit: (workspaceId: string, formId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/forms/${formId}/submit`),
    list: (workspaceId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/form-submissions`),
    get: (workspaceId: string, submissionId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/form-submissions/${submissionId}`),
  },

  layouts: {
    list: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/layouts`),
    create: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/layouts`),
    publish: (workspaceId: string, layoutId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/layouts/${layoutId}/publish`),
  },

  statusSets: {
    list: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/status-sets`),
    create: (workspaceId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/status-sets`),
    values: {
      list: (workspaceId: string, setId: string) =>
        apiPath(`${workspaceConfigBase(workspaceId)}/status-sets/${setId}/values`),
      create: (workspaceId: string, setId: string) =>
        apiPath(`${workspaceConfigBase(workspaceId)}/status-sets/${setId}/values`),
    },
  },

  tags: {
    list: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/tags`),
    create: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/tags`),
    get: (workspaceId: string, tagId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/tags/${tagId}`),
  },

  tagAssignments: {
    list: (workspaceId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/tag-assignments`),
    create: (workspaceId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/tag-assignments`),
    delete: (workspaceId: string, assignmentId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/tag-assignments/${assignmentId}`),
  },

  taxonomies: {
    list: (workspaceId: string) => apiPath(`${workspaceConfigBase(workspaceId)}/taxonomies`),
    create: (workspaceId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/taxonomies`),
    terms: {
      list: (workspaceId: string, taxonomyId: string) =>
        apiPath(`${workspaceConfigBase(workspaceId)}/taxonomies/${taxonomyId}/terms`),
      create: (workspaceId: string, taxonomyId: string) =>
        apiPath(`${workspaceConfigBase(workspaceId)}/taxonomies/${taxonomyId}/terms`),
    },
  },

  validationRules: {
    list: (workspaceId: string, fieldId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}/validation-rules`),
    create: (workspaceId: string, fieldId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-fields/${fieldId}/validation-rules`),
    delete: (workspaceId: string, ruleId: string) =>
      apiPath(`${workspaceConfigBase(workspaceId)}/custom-field-validation-rules/${ruleId}`),
  },
} as const
