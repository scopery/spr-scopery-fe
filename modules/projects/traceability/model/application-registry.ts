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
  status: string
  createdAt: string
}

export interface RegistryApiEndpoint {
  id: string
  applicationId: string
  method: string
  pathPattern: string
  name?: string | null
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
  projectId?: string | null
}

export interface UpdateRegistryApiEndpointBody {
  method: string
  pathPattern: string
  name: string
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
