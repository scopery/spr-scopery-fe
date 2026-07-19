import type {
  CapabilityStatus,
  IfNullBehavior,
  ParameterValueType,
  SupportStatus,
} from '../enums/capability.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiParameterCapability {
  id: string
  modelId: string
  parameterName: string
  apiParameterKey: string | null
  supportStatus: SupportStatus
  valueType: ParameterValueType | null
  minValue: string | null
  maxValue: string | null
  defaultValue: string | null
  nullable: boolean | null
  ifNullBehavior: IfNullBehavior | null
  description: string | null
  status: CapabilityStatus
  createdAt?: string
  updatedAt?: string
}

export interface CreateAiParameterCapabilityPayload {
  modelId: string
  parameterName: string
  apiParameterKey?: string | null
  supportStatus: SupportStatus
  valueType?: ParameterValueType | null
  minValue?: string | null
  maxValue?: string | null
  defaultValue?: string | null
  nullable?: boolean | null
  ifNullBehavior?: IfNullBehavior | null
  description?: string | null
}

export type UpdateAiParameterCapabilityPayload = Omit<
  CreateAiParameterCapabilityPayload,
  'modelId'
>

export interface SearchAiParameterCapabilitiesParams {
  modelId?: string
  parameterName?: string
  supportStatus?: SupportStatus | ''
  valueType?: ParameterValueType | ''
  status?: CapabilityStatus | ''
  page?: number
  size?: number
}

export type AiParameterCapabilityPage = AiAdminPage<AiParameterCapability>
