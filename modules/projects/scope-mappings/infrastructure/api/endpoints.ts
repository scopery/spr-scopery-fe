import { apiPath } from '@/shared/lib/api-paths'

export const SCOPE_MAPPING_ENDPOINTS = {
  wbsMappings: (scopeItemId: string) =>
    apiPath(`/scope-items/${scopeItemId}/wbs-mappings`),
  wbsMapping: (mappingId: string) =>
    apiPath(`/scope-items/wbs-mappings/${mappingId}`),
  taskMappings: (deliverableId: string) =>
    apiPath(`/deliverables/${deliverableId}/task-mappings`),
  taskMapping: (mappingId: string) =>
    apiPath(`/deliverables/task-mappings/${mappingId}`),
} as const
