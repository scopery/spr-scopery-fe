export interface SyncedBlock {
  id: string
  workspaceId: string
  projectId: string
  title: string
  status: 'ACTIVE' | 'ARCHIVED' | string
  currentRevisionNo: number
  schemaVersion?: number
  createdAt?: string
  updatedAt?: string
}

export interface NativeTemplateVariableDef {
  variableKey: string
  label: string
  variableType?: string
  required?: boolean
  defaultValue?: string | null
  sensitive?: boolean
  ordinal?: number
}

export interface PublishNativeTemplateVersionBody {
  ast: string
  variables?: NativeTemplateVariableDef[]
}

export interface InstantiateNativeTemplateBody {
  projectId: string
  targetDocumentId: string
  variables?: Record<string, string>
}
