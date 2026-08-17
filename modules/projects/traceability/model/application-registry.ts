/**
 * Application Registry domain types — match BE Registry*Response shapes (camelCase).
 */

export interface RegistryApplication {
  id: string
  workspaceId: string
  code: string
  name: string
  status: string
  createdAt: string
}

export interface RegistryAppModule {
  id: string
  applicationId: string
  workspaceId: string
  code: string
  name: string
  description?: string | null
  status: string
  createdAt: string
}

export interface RegistryScreen {
  id: string
  applicationId: string
  code: string
  name: string
  routePath?: string | null
  mockupUrl?: string | null
  mockupObjectKey?: string | null
  status: string
  createdAt: string
}

export const ApiParamLocation = {
  Query: 'QUERY',
  Path: 'PATH',
  Body: 'BODY',
  Header: 'HEADER',
} as const
export type ApiParamLocation = (typeof ApiParamLocation)[keyof typeof ApiParamLocation]

export const API_PARAM_LOCATION_OPTIONS: ApiParamLocation[] = [
  ApiParamLocation.Query,
  ApiParamLocation.Path,
  ApiParamLocation.Body,
  ApiParamLocation.Header,
]

export const API_PARAM_LOCATION_SELECT_OPTIONS: Array<{ value: ApiParamLocation; label: string }> = [
  { value: ApiParamLocation.Query, label: 'Query' },
  { value: ApiParamLocation.Path, label: 'Path' },
  { value: ApiParamLocation.Body, label: 'Body' },
  { value: ApiParamLocation.Header, label: 'Header' },
]

export interface ApiRequestParam {
  name: string
  in: ApiParamLocation
  type: string
  required?: boolean
  description?: string | null
  example?: string | null
}

export interface RegistryApiEndpoint {
  id: string
  applicationId: string
  method: string
  pathPattern: string
  name?: string | null
  description?: string | null
  requestParams?: ApiRequestParam[] | null
  responseSchemaJson?: string | null
  status: string
  createdAt: string
}

export interface RegistryAppComponent {
  id: string
  applicationId: string
  workspaceId: string
  code: string
  name: string
  description?: string | null
  componentType?: string | null
  screenshotUrl?: string | null
  screenshotObjectKey?: string | null
  status: string
  createdAt: string
}

export interface RegistryDataEntity {
  id: string
  applicationId: string
  workspaceId: string
  code: string
  name: string
  description?: string | null
  tableName?: string | null
  moduleId?: string | null
  status: string
  createdAt: string
}

export interface CommunicationSpecification {
  id: string
  applicationId: string
  workspaceId: string
  code: string
  name: string
  description?: string | null
  status: string
  triggerName?: string | null
  triggerKey?: string | null
  triggerTiming?: string | null
  conditionJson?: string | null
  suppressionConditionJson?: string | null
  deliveryPolicyJson?: string | null
  inAppContractJson?: string | null
  emailContractJson?: string | null
  recipientsJson?: string | null
  ownerId?: string | null
  version?: number
  createdAt: string
  updatedAt?: string | null
  archivedAt?: string | null
}

export interface CreateCommunicationSpecBody {
  code: string
  name: string
  description?: string | null
  triggerName?: string | null
  triggerKey?: string | null
  triggerTiming?: string | null
  conditionJson?: string | null
  suppressionConditionJson?: string | null
  deliveryPolicyJson?: string | null
  inAppContractJson?: string | null
  emailContractJson?: string | null
  recipientsJson?: string | null
  ownerId?: string | null
}

export interface UpdateCommunicationSpecBody {
  name: string
  description?: string | null
  triggerName?: string | null
  triggerKey?: string | null
  triggerTiming?: string | null
  conditionJson?: string | null
  suppressionConditionJson?: string | null
  deliveryPolicyJson?: string | null
  inAppContractJson?: string | null
  emailContractJson?: string | null
  recipientsJson?: string | null
  ownerId?: string | null
}

export interface RegistryScreenSection {
  id: string
  screenId: string
  workspaceId: string
  name: string
  description?: string | null
  displayOrder?: number | null
  status: string
  createdAt: string
}

export interface RegistryScreenField {
  id: string
  screenId: string
  sectionId?: string | null
  workspaceId: string
  fieldKey: string
  label: string
  fieldType: string
  description?: string | null
  required?: boolean | null
  displayOrder?: number | null
  status: string
  createdAt: string
  componentId?: string | null
  dataEntityFieldId?: string | null
  /** Set when this field was copied from a component field via bind-component. */
  componentFieldId?: string | null
  remark?: string | null
}

export interface RegistryScreenAction {
  id: string
  screenId: string
  workspaceId: string
  actionCode: string
  name: string
  actionType?: string | null
  description?: string | null
  displayOrder?: number | null
  status: string
  createdAt: string
}

export interface CreateRegistryApplicationBody {
  code: string
  name: string
  description?: string | null
  ownerUserId?: string | null
}

export interface CreateRegistryAppModuleBody {
  code: string
  name: string
  description?: string | null
}

export interface UpdateRegistryAppModuleBody {
  name: string
  description?: string | null
}

export interface CreateRegistryScreenBody {
  code: string
  name: string
  routePath?: string | null
  projectId?: string | null
}

export interface UpdateRegistryScreenBody {
  name: string
  routePath?: string | null
}

export interface CreateRegistryApiEndpointBody {
  method: string
  pathPattern: string
  name?: string | null
  description?: string | null
  requestParams?: ApiRequestParam[] | null
  responseSchemaJson?: string | null
  projectId?: string | null
}

export interface UpdateRegistryApiEndpointBody {
  method: string
  pathPattern: string
  name: string
  description?: string | null
  requestParams?: ApiRequestParam[] | null
  responseSchemaJson?: string | null
}

export interface CreateRegistryAppComponentBody {
  code: string
  name: string
  description?: string | null
  componentType?: string | null
}

export interface UpdateRegistryAppComponentBody {
  name: string
  description?: string | null
  componentType?: string | null
}

export interface CreateRegistryDataEntityBody {
  code: string
  name: string
  description?: string | null
  tableName?: string | null
  moduleId?: string | null
}

export interface UpdateRegistryDataEntityBody {
  name: string
  description?: string | null
  tableName?: string | null
  moduleId?: string | null
}

export interface CreateRegistryScreenSectionBody {
  name: string
  description?: string | null
  displayOrder?: number | null
}

export interface UpdateRegistryScreenSectionBody {
  name: string
  description?: string | null
  displayOrder?: number | null
}

export interface CreateRegistryScreenFieldBody {
  fieldKey: string
  label: string
  fieldType: string
  description?: string | null
  required?: boolean | null
  displayOrder?: number | null
  sectionId?: string | null
  maxLength?: number | null
  remark?: string | null
  componentId?: string | null
  dataEntityFieldId?: string | null
}

export interface UpdateRegistryScreenFieldBody {
  label: string
  fieldType: string
  description?: string | null
  required?: boolean | null
  displayOrder?: number | null
  sectionId?: string | null
  maxLength?: number | null
  remark?: string | null
  componentId?: string | null
  dataEntityFieldId?: string | null
}

export interface CreateRegistryScreenActionBody {
  actionCode: string
  name: string
  actionType?: string | null
  description?: string | null
  displayOrder?: number | null
}

export interface UpdateRegistryScreenActionBody {
  name: string
  actionType: string
  description?: string | null
  displayOrder?: number | null
}
