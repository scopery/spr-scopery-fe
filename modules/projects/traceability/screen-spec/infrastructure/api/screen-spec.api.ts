import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { SCREEN_SPEC_ENDPOINTS as EP } from './endpoints'
import type {
  ApplicationComponentDetail,
  ComponentOption,
  CreateComponentOptionBody,
  CreateDataEntityFieldBody,
  CreateFieldValidationBody,
  CreateScreenModeBody,
  DataEntityField,
  ReplaceFieldModeConfigsBody,
  ScreenFieldDetail,
  ScreenFieldModeConfig,
  ScreenFieldValidation,
  ScreenMode,
  UpdateComponentOptionBody,
  UpdateComponentSourceBody,
  UpdateDataEntityFieldBody,
  UpdateFieldValidationBody,
  UpdateScreenFieldSpecBody,
  UpdateScreenModeBody,
  UpsertScreenEventItemBody,
  UpsertScreenProcessItemBody,
  ValidationRuleType,
  ScreenEventItem,
  ScreenProcessItem,
} from '../../domain/model/screen-spec'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function str(value: unknown): string | null {
  if (value == null) return null
  return String(value)
}

function num(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function bool(value: unknown, fallback = false): boolean {
  if (value == null) return fallback
  if (typeof value === 'boolean') return value
  return value === 'true'
}

export function mapDataEntityField(raw: unknown): DataEntityField {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    dataEntityId: String(r.dataEntityId ?? r.data_entity_id ?? ''),
    columnName: String(r.columnName ?? r.column_name ?? ''),
    dataType: String(r.dataType ?? r.data_type ?? 'VARCHAR'),
    maxLength: num(r.maxLength ?? r.max_length),
    isNullable: r.isNullable == null && r.is_nullable == null ? true : Boolean(r.isNullable ?? r.is_nullable),
    isUnique: Boolean(r.isUnique ?? r.is_unique),
    remark: str(r.remark),
    displayOrder: num(r.displayOrder ?? r.display_order),
    status: str(r.status) ?? undefined,
  }
}

export function mapComponentOption(raw: unknown): ComponentOption {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    componentId: String(r.componentId ?? r.component_id ?? ''),
    optionValue: String(r.optionValue ?? r.option_value ?? ''),
    optionLabel: String(r.optionLabel ?? r.option_label ?? ''),
    displayOrder: num(r.displayOrder ?? r.display_order),
  }
}

export function mapComponentDetail(raw: unknown): ApplicationComponentDetail {
  const r = asRecord(raw)
  const filter = r.sourceFilterJson ?? r.source_filter_json
  return {
    id: String(r.id ?? ''),
    applicationId: String(r.applicationId ?? r.application_id ?? ''),
    code: String(r.code ?? ''),
    name: String(r.name ?? ''),
    description: str(r.description),
    componentType: str(r.componentType ?? r.component_type),
    optionSourceType: String(r.optionSourceType ?? r.option_source_type ?? 'NONE'),
    sourceEntityId: str(r.sourceEntityId ?? r.source_entity_id),
    sourceValueColumn: str(r.sourceValueColumn ?? r.source_value_column),
    sourceLabelColumn: str(r.sourceLabelColumn ?? r.source_label_column),
    sourceFilterJson: Array.isArray(filter) ? (filter as ApplicationComponentDetail['sourceFilterJson']) : null,
    status: str(r.status) ?? undefined,
  }
}

export function mapScreenMode(raw: unknown): ScreenMode {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    screenId: String(r.screenId ?? r.screen_id ?? ''),
    modeCode: String(r.modeCode ?? r.mode_code ?? ''),
    name: String(r.name ?? ''),
    displayOrder: num(r.displayOrder ?? r.display_order),
    status: String(r.status ?? 'ACTIVE'),
  }
}

function mapModeConfig(raw: unknown): ScreenFieldModeConfig {
  const r = asRecord(raw)
  return {
    modeId: String(r.modeId ?? r.mode_id ?? ''),
    modeCode: str(r.modeCode ?? r.mode_code) ?? undefined,
    isVisible: bool(r.isVisible ?? r.is_visible, true),
    isRequired: bool(r.isRequired ?? r.is_required),
    isReadonly: bool(r.isReadonly ?? r.is_readonly),
    defaultValue: str(r.defaultValue ?? r.default_value),
    displayOrder: num(r.displayOrder ?? r.display_order),
  }
}

function parseJsonish(value: unknown): unknown {
  if (typeof value !== 'string') return value ?? null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function mapValidation(raw: unknown): ScreenFieldValidation {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    modeId: str(r.modeId ?? r.mode_id),
    modeCode: str(r.modeCode ?? r.mode_code),
    ruleTypeId: str(r.ruleTypeId ?? r.rule_type_id) ?? undefined,
    ruleTypeCode: String(r.ruleTypeCode ?? r.rule_type_code ?? ''),
    ruleParamJson: parseJsonish(r.ruleParamJson ?? r.rule_param_json),
    conditionJson: parseJsonish(r.conditionJson ?? r.condition_json),
    errorMessage: str(r.errorMessage ?? r.error_message),
    remark: str(r.remark),
    displayOrder: num(r.displayOrder ?? r.display_order),
  }
}

export function mapScreenFieldDetail(raw: unknown): ScreenFieldDetail {
  const r = asRecord(raw)
  const component = asRecord(r.component)
  const dataField = asRecord(r.dataField ?? r.data_field)
  return {
    id: String(r.id ?? ''),
    screenId: str(r.screenId ?? r.screen_id) ?? undefined,
    sectionId: str(r.sectionId ?? r.section_id),
    fieldKey: String(r.fieldKey ?? r.field_key ?? ''),
    label: String(r.label ?? r.fieldLabel ?? r.field_label ?? ''),
    fieldType: String(r.fieldType ?? r.field_type ?? 'TEXT'),
    description: str(r.description),
    required: r.required == null ? null : bool(r.required),
    displayOrder: num(r.displayOrder ?? r.display_order),
    maxLength: num(r.maxLength ?? r.max_length),
    remark: str(r.remark),
    componentId: str(r.componentId ?? r.component_id ?? component.id),
    dataEntityFieldId: str(r.dataEntityFieldId ?? r.data_entity_field_id ?? dataField.id),
    modeConfigs: Array.isArray(r.modeConfigs)
      ? (r.modeConfigs as unknown[]).map(mapModeConfig)
      : Array.isArray(r.mode_configs)
        ? (r.mode_configs as unknown[]).map(mapModeConfig)
        : [],
    validations: Array.isArray(r.validations) ? (r.validations as unknown[]).map(mapValidation) : [],
  }
}

export function mapValidationRuleType(raw: unknown): ValidationRuleType {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    code: String(r.code ?? ''),
    name: String(r.name ?? ''),
    category: String(r.category ?? ''),
    paramSchemaJson: (r.paramSchemaJson ?? r.param_schema_json ?? null) as ValidationRuleType['paramSchemaJson'],
    defaultMessage: str(r.defaultMessage ?? r.default_message),
    description: str(r.description),
    displayOrder: num(r.displayOrder ?? r.display_order),
    isSystem: Boolean(r.isSystem ?? r.is_system),
  }
}

export async function listDataEntityFields(
  workspaceId: string,
  entityId: string
): Promise<{ items: DataEntityField[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.dataEntityFields(workspaceId, entityId))
  return { items: normalizeItemList(res).items.map(mapDataEntityField) }
}

export async function createDataEntityField(
  workspaceId: string,
  entityId: string,
  body: CreateDataEntityFieldBody
): Promise<DataEntityField> {
  const res = await apiClient.post<unknown>(EP.dataEntityFields(workspaceId, entityId), body)
  return mapDataEntityField(res)
}

export async function updateDataEntityField(
  workspaceId: string,
  entityId: string,
  fieldId: string,
  body: UpdateDataEntityFieldBody
): Promise<DataEntityField> {
  const res = await apiClient.put<unknown>(EP.dataEntityField(workspaceId, entityId, fieldId), body)
  return mapDataEntityField(res)
}

export async function deleteDataEntityField(
  workspaceId: string,
  entityId: string,
  fieldId: string
): Promise<void> {
  await apiClient.delete<void>(EP.dataEntityField(workspaceId, entityId, fieldId), { parseJson: false })
}

export async function getApplicationComponent(
  workspaceId: string,
  applicationId: string,
  componentId: string
): Promise<ApplicationComponentDetail> {
  const res = await apiClient.get<unknown>(EP.applicationComponent(workspaceId, applicationId, componentId))
  return mapComponentDetail(res)
}

export async function updateApplicationComponentSource(
  workspaceId: string,
  applicationId: string,
  componentId: string,
  body: UpdateComponentSourceBody
): Promise<ApplicationComponentDetail> {
  const res = await apiClient.put<unknown>(
    EP.applicationComponent(workspaceId, applicationId, componentId),
    body
  )
  return mapComponentDetail(res)
}

export async function listComponentOptions(
  workspaceId: string,
  componentId: string
): Promise<{ items: ComponentOption[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.componentOptions(workspaceId, componentId))
  return { items: normalizeItemList(res).items.map(mapComponentOption) }
}

export async function createComponentOption(
  workspaceId: string,
  componentId: string,
  body: CreateComponentOptionBody
): Promise<ComponentOption> {
  const res = await apiClient.post<unknown>(EP.componentOptions(workspaceId, componentId), body)
  return mapComponentOption(res)
}

export async function updateComponentOption(
  workspaceId: string,
  componentId: string,
  optionId: string,
  body: UpdateComponentOptionBody
): Promise<ComponentOption> {
  const res = await apiClient.put<unknown>(EP.componentOption(workspaceId, componentId, optionId), body)
  return mapComponentOption(res)
}

export async function deleteComponentOption(
  workspaceId: string,
  componentId: string,
  optionId: string
): Promise<void> {
  await apiClient.delete<void>(EP.componentOption(workspaceId, componentId, optionId), { parseJson: false })
}

export async function listScreenModes(
  workspaceId: string,
  screenId: string
): Promise<{ items: ScreenMode[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.screenModes(workspaceId, screenId))
  return { items: normalizeItemList(res).items.map(mapScreenMode) }
}

export async function createScreenMode(
  workspaceId: string,
  screenId: string,
  body: CreateScreenModeBody
): Promise<ScreenMode> {
  const res = await apiClient.post<unknown>(EP.screenModes(workspaceId, screenId), body)
  return mapScreenMode(res)
}

export async function updateScreenMode(
  workspaceId: string,
  screenId: string,
  modeId: string,
  body: UpdateScreenModeBody
): Promise<ScreenMode> {
  const res = await apiClient.put<unknown>(EP.screenMode(workspaceId, screenId, modeId), body)
  return mapScreenMode(res)
}

export async function deleteScreenMode(
  workspaceId: string,
  screenId: string,
  modeId: string
): Promise<void> {
  await apiClient.delete<void>(EP.screenMode(workspaceId, screenId, modeId), { parseJson: false })
}

export async function getScreenFieldDetail(
  workspaceId: string,
  screenId: string,
  fieldId: string
): Promise<ScreenFieldDetail> {
  const res = await apiClient.get<unknown>(EP.screenField(workspaceId, screenId, fieldId))
  return mapScreenFieldDetail(res)
}

export async function updateScreenFieldSpec(
  workspaceId: string,
  screenId: string,
  fieldId: string,
  body: UpdateScreenFieldSpecBody
): Promise<ScreenFieldDetail> {
  const res = await apiClient.put<unknown>(EP.screenField(workspaceId, screenId, fieldId), body)
  return mapScreenFieldDetail(res)
}

export async function listFieldModeConfigs(
  workspaceId: string,
  screenId: string,
  fieldId: string
): Promise<{ items: ScreenFieldModeConfig[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.fieldModeConfigs(workspaceId, screenId, fieldId))
  const items = normalizeItemList(res).items.map(mapModeConfig)
  return { items }
}

export async function replaceFieldModeConfigs(
  workspaceId: string,
  screenId: string,
  fieldId: string,
  body: ReplaceFieldModeConfigsBody
): Promise<{ items: ScreenFieldModeConfig[] }> {
  const res = await apiClient.put<ListPayload<unknown> | unknown>(
    EP.fieldModeConfigs(workspaceId, screenId, fieldId),
    body
  )
  if (Array.isArray(res) || (res && typeof res === 'object' && 'items' in (res as object))) {
    return { items: normalizeItemList(res as ListPayload<unknown>).items.map(mapModeConfig) }
  }
  return listFieldModeConfigs(workspaceId, screenId, fieldId)
}

export async function listFieldValidations(
  workspaceId: string,
  screenId: string,
  fieldId: string
): Promise<{ items: ScreenFieldValidation[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.fieldValidations(workspaceId, screenId, fieldId))
  return { items: normalizeItemList(res).items.map(mapValidation) }
}

export async function createFieldValidation(
  workspaceId: string,
  screenId: string,
  fieldId: string,
  body: CreateFieldValidationBody
): Promise<ScreenFieldValidation> {
  const res = await apiClient.post<unknown>(EP.fieldValidations(workspaceId, screenId, fieldId), body)
  return mapValidation(res)
}

export async function updateFieldValidation(
  workspaceId: string,
  screenId: string,
  fieldId: string,
  validationId: string,
  body: UpdateFieldValidationBody
): Promise<ScreenFieldValidation> {
  const res = await apiClient.put<unknown>(
    EP.fieldValidation(workspaceId, screenId, fieldId, validationId),
    body
  )
  return mapValidation(res)
}

export async function deleteFieldValidation(
  workspaceId: string,
  screenId: string,
  fieldId: string,
  validationId: string
): Promise<void> {
  await apiClient.delete<void>(EP.fieldValidation(workspaceId, screenId, fieldId, validationId), {
    parseJson: false,
  })
}

export async function listValidationRuleTypes(
  workspaceId: string
): Promise<{ items: ValidationRuleType[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.validationRuleTypes(workspaceId))
  return { items: normalizeItemList(res).items.map(mapValidationRuleType) }
}

export function mapProcessItem(raw: unknown): ScreenProcessItem {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    screenId: str(r.screenId ?? r.screen_id) ?? undefined,
    modeId: str(r.modeId ?? r.mode_id),
    modeCode: str(r.modeCode ?? r.mode_code),
    targetFieldId: str(r.targetFieldId ?? r.target_field_id),
    title: String(r.title ?? ''),
    content: str(r.content),
    sourceTable: str(r.sourceTable ?? r.source_table),
    conditionNote: str(r.conditionNote ?? r.condition_note),
    displayOrder: num(r.displayOrder ?? r.display_order),
  }
}

export function mapEventItem(raw: unknown): ScreenEventItem {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    screenId: str(r.screenId ?? r.screen_id) ?? undefined,
    modeId: str(r.modeId ?? r.mode_id),
    modeCode: str(r.modeCode ?? r.mode_code),
    triggerFieldId: str(r.triggerFieldId ?? r.trigger_field_id),
    triggerActionCode: str(r.triggerActionCode ?? r.trigger_action_code),
    title: String(r.title ?? ''),
    content: str(r.content),
    conditionNote: str(r.conditionNote ?? r.condition_note),
    targetScreenId: str(r.targetScreenId ?? r.target_screen_id),
    targetModeCode: str(r.targetModeCode ?? r.target_mode_code),
    displayOrder: num(r.displayOrder ?? r.display_order),
  }
}

export async function listProcessItems(
  workspaceId: string,
  screenId: string
): Promise<{ items: ScreenProcessItem[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.processItems(workspaceId, screenId))
  return { items: normalizeItemList(res).items.map(mapProcessItem) }
}

export async function createProcessItem(
  workspaceId: string,
  screenId: string,
  body: UpsertScreenProcessItemBody
): Promise<ScreenProcessItem> {
  const res = await apiClient.post<unknown>(EP.processItems(workspaceId, screenId), body)
  return mapProcessItem(res)
}

export async function updateProcessItem(
  workspaceId: string,
  screenId: string,
  itemId: string,
  body: UpsertScreenProcessItemBody
): Promise<ScreenProcessItem> {
  const res = await apiClient.put<unknown>(EP.processItem(workspaceId, screenId, itemId), body)
  return mapProcessItem(res)
}

export async function deleteProcessItem(
  workspaceId: string,
  screenId: string,
  itemId: string
): Promise<void> {
  await apiClient.delete<void>(EP.processItem(workspaceId, screenId, itemId), { parseJson: false })
}

export async function listEventItems(
  workspaceId: string,
  screenId: string
): Promise<{ items: ScreenEventItem[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.eventItems(workspaceId, screenId))
  return { items: normalizeItemList(res).items.map(mapEventItem) }
}

export async function createEventItem(
  workspaceId: string,
  screenId: string,
  body: UpsertScreenEventItemBody
): Promise<ScreenEventItem> {
  const res = await apiClient.post<unknown>(EP.eventItems(workspaceId, screenId), body)
  return mapEventItem(res)
}

export async function updateEventItem(
  workspaceId: string,
  screenId: string,
  itemId: string,
  body: UpsertScreenEventItemBody
): Promise<ScreenEventItem> {
  const res = await apiClient.put<unknown>(EP.eventItem(workspaceId, screenId, itemId), body)
  return mapEventItem(res)
}

export async function deleteEventItem(
  workspaceId: string,
  screenId: string,
  itemId: string
): Promise<void> {
  await apiClient.delete<void>(EP.eventItem(workspaceId, screenId, itemId), { parseJson: false })
}
