import { apiClient } from '@/shared/lib/apiClient'
import {
  assertBulkItemCount,
  BulkJobStatus,
  getBulkJobFailures,
  pollBulkJobUntilDone,
  type BulkJobResponse,
} from '@/shared/lib/bulkJobs'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { SCREEN_SPEC_ENDPOINTS as EP } from './endpoints'
import type {
  ApplicationComponentDetail,
  ApplicationComponentField,
  BindComponentToSectionBody,
  BindComponentToSectionResult,
  ComponentApiLink,
  ComponentOption,
  CreateComponentFieldBody,
  CreateComponentOptionBody,
  CreateComponentApiLinkBody,
  CreateDataEntityFieldBody,
  CreateFieldValidationBody,
  CreateScreenFieldBody,
  CreateScreenModeBody,
  DataEntityField,
  ReplaceFieldModeConfigsBody,
  ScreenFieldDetail,
  ScreenFieldModeConfig,
  ScreenFieldValidation,
  ScreenMode,
  UpdateComponentFieldBody,
  UpdateComponentOptionBody,
  UpdateComponentApiLinkBody,
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
import type { ComponentImportItem } from '../../domain/model/component-import'
import { COMPONENT_IMPORT_FULL_MAX_ITEMS } from '../../domain/model/component-import'
import type { EntityImportItem } from '../../domain/model/entity-import'
import { ENTITY_IMPORT_FULL_MAX_ITEMS } from '../../domain/model/entity-import'

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

export function mapComponentField(raw: unknown): ApplicationComponentField {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    componentId: String(r.componentId ?? r.component_id ?? ''),
    fieldKey: String(r.fieldKey ?? r.field_key ?? ''),
    label: String(r.label ?? ''),
    fieldType: String(r.fieldType ?? r.field_type ?? 'TEXT'),
    required: r.required == null ? null : bool(r.required),
    maxLength: num(r.maxLength ?? r.max_length),
    remark: str(r.remark),
    displayOrder: num(r.displayOrder ?? r.display_order),
  }
}

export function mapBindComponentToSectionResult(raw: unknown): BindComponentToSectionResult {
  const r = asRecord(raw)
  const keys = r.importedFieldKeys ?? r.imported_field_keys
  return {
    fieldsImported: num(r.fieldsImported ?? r.fields_imported) ?? 0,
    importedFieldKeys: Array.isArray(keys) ? keys.map((k) => String(k)) : [],
  }
}

export function mapComponentApiLink(raw: unknown): ComponentApiLink {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    componentId: String(r.componentId ?? r.component_id ?? ''),
    apiId: String(r.apiId ?? r.api_id ?? ''),
    workspaceId: String(r.workspaceId ?? r.workspace_id ?? ''),
    role: String(r.role ?? ''),
    note: str(r.note),
    displayOrder: num(r.displayOrder ?? r.display_order),
    status: String(r.status ?? 'ACTIVE'),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
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

function modeFromRaw(raw: Record<string, unknown>): { modeId: string | null; modeCode: string | null } {
  const nested = asRecord(raw.mode ?? raw.screenMode ?? raw.screen_mode)
  return {
    modeId: str(raw.modeId ?? raw.mode_id ?? nested.id ?? raw.screenModeId ?? raw.screen_mode_id),
    modeCode: str(raw.modeCode ?? raw.mode_code ?? nested.modeCode ?? nested.mode_code),
  }
}

function mapValidation(raw: unknown): ScreenFieldValidation {
  const r = asRecord(raw)
  const mode = modeFromRaw(r)
  return {
    id: String(r.id ?? ''),
    modeId: mode.modeId,
    modeCode: mode.modeCode,
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
    componentFieldId: str(r.componentFieldId ?? r.component_field_id),
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

export async function submitDataEntityFieldsBulk(
  workspaceId: string,
  entityId: string,
  items: CreateDataEntityFieldBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    EP.dataEntityFieldsBulk(workspaceId, entityId),
    { items },
    { skipGlobalLoading: true }
  )
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

export async function listComponentFields(
  workspaceId: string,
  componentId: string
): Promise<{ items: ApplicationComponentField[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.componentFields(workspaceId, componentId))
  return { items: normalizeItemList(res).items.map(mapComponentField) }
}

export async function createComponentField(
  workspaceId: string,
  componentId: string,
  body: CreateComponentFieldBody
): Promise<ApplicationComponentField> {
  const res = await apiClient.post<unknown>(EP.componentFields(workspaceId, componentId), body)
  return mapComponentField(res)
}

export async function submitComponentFieldsBulk(
  workspaceId: string,
  componentId: string,
  items: CreateComponentFieldBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    EP.componentFieldsBulk(workspaceId, componentId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function importFullComponents(
  workspaceId: string,
  applicationId: string,
  items: ComponentImportItem[]
): Promise<BulkJobResponse> {
  if (items.length < 1) throw new Error('At least one item is required')
  if (items.length > COMPONENT_IMPORT_FULL_MAX_ITEMS) {
    throw new Error(`Maximum ${COMPONENT_IMPORT_FULL_MAX_ITEMS} components per import-full request`)
  }
  return apiClient.post<BulkJobResponse>(
    EP.componentsImportFull(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function importFullDataEntities(
  workspaceId: string,
  applicationId: string,
  items: EntityImportItem[]
): Promise<BulkJobResponse> {
  if (items.length < 1) throw new Error('At least one item is required')
  if (items.length > ENTITY_IMPORT_FULL_MAX_ITEMS) {
    throw new Error(`Maximum ${ENTITY_IMPORT_FULL_MAX_ITEMS} data entities per import-full request`)
  }
  return apiClient.post<BulkJobResponse>(
    EP.dataEntitiesImportFull(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function submitScreenFieldsBulk(
  workspaceId: string,
  screenId: string,
  items: CreateScreenFieldBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    EP.screenFieldsBulk(workspaceId, screenId),
    { items },
    { skipGlobalLoading: true }
  )
}

export interface FieldBulkCreateResult {
  succeeded: number
  failed: Array<{ index: number; message: string }>
}

export async function waitForFieldBulkJob(job: BulkJobResponse): Promise<FieldBulkCreateResult> {
  const done = await pollBulkJobUntilDone(job.id)
  const failed = getBulkJobFailures(done).map((f) => ({
    index: f.index,
    message: f.message?.trim() || String(f.errorCode ?? 'Failed'),
  }))
  if (done.status === BulkJobStatus.Failed && failed.length === 0) {
    throw new Error(done.errorMessage?.trim() || done.resultSummary?.trim() || 'Bulk create failed')
  }
  return { succeeded: done.succeededItems, failed }
}

export async function updateComponentField(
  workspaceId: string,
  componentId: string,
  fieldId: string,
  body: UpdateComponentFieldBody
): Promise<ApplicationComponentField> {
  const res = await apiClient.put<unknown>(EP.componentField(workspaceId, componentId, fieldId), body)
  return mapComponentField(res)
}

export async function deleteComponentField(
  workspaceId: string,
  componentId: string,
  fieldId: string
): Promise<void> {
  await apiClient.delete<void>(EP.componentField(workspaceId, componentId, fieldId), { parseJson: false })
}

export async function listComponentApis(
  workspaceId: string,
  componentId: string
): Promise<{ items: ComponentApiLink[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.componentApis(workspaceId, componentId))
  return { items: normalizeItemList(res).items.map(mapComponentApiLink) }
}

export async function createComponentApi(
  workspaceId: string,
  componentId: string,
  body: CreateComponentApiLinkBody
): Promise<ComponentApiLink> {
  const res = await apiClient.post<unknown>(EP.componentApis(workspaceId, componentId), body)
  return mapComponentApiLink(res)
}

export async function updateComponentApi(
  workspaceId: string,
  componentId: string,
  apiLinkId: string,
  body: UpdateComponentApiLinkBody
): Promise<ComponentApiLink> {
  const res = await apiClient.put<unknown>(EP.componentApi(workspaceId, componentId, apiLinkId), body)
  return mapComponentApiLink(res)
}

export async function deleteComponentApi(
  workspaceId: string,
  componentId: string,
  apiLinkId: string
): Promise<void> {
  await apiClient.delete<void>(EP.componentApi(workspaceId, componentId, apiLinkId), { parseJson: false })
}

export async function bindComponentToSection(
  workspaceId: string,
  screenId: string,
  sectionId: string,
  body: BindComponentToSectionBody
): Promise<BindComponentToSectionResult> {
  const res = await apiClient.post<unknown>(
    EP.bindComponentToSection(workspaceId, screenId, sectionId),
    body
  )
  return mapBindComponentToSectionResult(res)
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
  const mode = modeFromRaw(r)
  return {
    id: String(r.id ?? ''),
    screenId: str(r.screenId ?? r.screen_id) ?? undefined,
    modeId: mode.modeId,
    modeCode: mode.modeCode,
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
  const mode = modeFromRaw(r)
  return {
    id: String(r.id ?? ''),
    screenId: str(r.screenId ?? r.screen_id) ?? undefined,
    modeId: mode.modeId,
    modeCode: mode.modeCode,
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
