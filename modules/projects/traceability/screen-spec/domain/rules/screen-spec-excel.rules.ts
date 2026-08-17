import { ScreenModeCode } from '../enums/screen-spec.enum'
import type {
  ScreenFullSpec,
  ScreenFullSpecField,
  ScreenSpecDocFullSpec,
} from '../model/screen-spec-doc'

export const SCREEN_SPEC_EXCEL_SHEETS = {
  changeHistory: 'Change History',
  layout: 'Layout',
  defines: 'Defines',
  processes: 'Processes',
  event: 'Event',
  validation: 'Validation',
  database: 'Database',
} as const

export const STANDARD_DEFINE_MODE_CODES = [
  ScreenModeCode.Create,
  ScreenModeCode.View,
  ScreenModeCode.Edit,
] as const

const OPTIONAL_DEFINE_MODE_CODES = [ScreenModeCode.Search, ScreenModeCode.Dialog] as const

/** Required / max length live on Defines, matching the Startupper workbook. */
export const DEFINES_COVERED_RULE_CODES = new Set(['REQUIRED', 'MAX_LENGTH'])

export const MODE_VISIBLE_MARK = '〇'
/** Distinct from 〇 so Required / mode visibility stay scannable. */
export const FIELD_READONLY_MARK = '●'

export interface ScreenSpecExcelHeader {
  documentCode: string
  documentName: string
  projectName: string
  systemName: string
  phaseName: string
  language: string
  overview: string
  figmaUrl: string
  screenIdText: string
  screenNameText: string
  grouped: boolean
  author: string
  createdDate: string
  version: string
  updatedBy: string
  updatedDate: string
}

export interface ScreenSpecExcelRevisionRow {
  revisionNo: string
  targetSheetName: string
  details: string
  personInCharge: string
  changedAt: string
  color: string
}

export interface ScreenSpecExcelLayoutRow {
  code: string
  name: string
  routePath: string
  modes: string
  note: string
}

export interface ScreenSpecExcelDefineRow {
  kind: 'screen' | 'section' | 'field'
  no: string
  field: string
  physicalName: string
  type: string
  required: string
  readonly: string
  length: string
  modeMarks: Record<string, string>
  defaultValue: string
  table: string
  columnAttribute: string
  remark: string
  screenCode: string
}

export interface ScreenSpecExcelOutlineRow {
  kind: 'screen' | 'heading' | 'detail'
  label: string
  detail: string
  source: string
  condition: string
  extra: string
  screenCode: string
}

export interface ScreenSpecExcelValidationRow {
  kind: 'screen' | 'section' | 'rule'
  no: string
  screenCode: string
  field: string
  physicalName: string
  mode: string
  ruleType: string
  params: string
  individualRule: string
  errorMessage: string
  remark: string
}

export interface ScreenSpecExcelDatabaseRow {
  name: string
  attributes: string
  notes: string
}

export interface ScreenSpecWorkbookModel {
  header: ScreenSpecExcelHeader
  modeCodes: string[]
  revisions: ScreenSpecExcelRevisionRow[]
  layoutScreens: ScreenSpecExcelLayoutRow[]
  defineRows: ScreenSpecExcelDefineRow[]
  processRows: ScreenSpecExcelOutlineRow[]
  eventRows: ScreenSpecExcelOutlineRow[]
  validationRows: ScreenSpecExcelValidationRow[]
  databaseRows: ScreenSpecExcelDatabaseRow[]
}

const COMPONENT_TYPE_LABELS: Record<string, string> = {
  INPUT: 'Textbox',
  TEXT: 'Textbox',
  TEXTAREA: 'Textarea',
  RADIO: 'Radio',
  CHECKBOX: 'Checkbox',
  SELECT: 'Dropdown',
  DROPDOWN: 'Dropdown',
  BUTTON: 'Button',
  DATE: 'Date',
  DATEPICKER: 'Date',
  LABEL: 'Label',
  HIDDEN: 'Hidden',
  NUMBER: 'Number',
  BOOLEAN: 'Checkbox',
  URL: 'Textbox',
}

export function wrapSingleScreenAsDocument(
  screen: ScreenFullSpec,
  meta?: Partial<
    Pick<
      ScreenSpecDocFullSpec,
      | 'documentCode'
      | 'documentName'
      | 'projectName'
      | 'systemName'
      | 'applicationName'
      | 'phaseName'
      | 'language'
      | 'overview'
      | 'figmaUrl'
    >
  >
): ScreenSpecDocFullSpec {
  return {
    id: screen.id,
    projectId: '',
    documentCode: meta?.documentCode ?? screen.code,
    documentName: meta?.documentName ?? screen.name,
    projectName: meta?.projectName ?? null,
    systemName: meta?.systemName ?? null,
    applicationName: meta?.applicationName ?? null,
    phaseName: meta?.phaseName ?? null,
    language: meta?.language ?? 'EN',
    overview: meta?.overview ?? null,
    figmaUrl: meta?.figmaUrl ?? null,
    status: 'ACTIVE',
    revisions: [],
    screens: [{ displayOrder: 1, note: null, screen }],
  }
}

export function collectDefineModeCodes(screens: ScreenFullSpec[]): string[] {
  const present = new Set<string>()
  for (const screen of screens) {
    for (const mode of screen.modes) {
      const code = String(mode.modeCode ?? '').trim().toUpperCase()
      if (code) present.add(code)
    }
  }
  const optional = OPTIONAL_DEFINE_MODE_CODES.filter((code) => present.has(code))
  const known = new Set<string>([...STANDARD_DEFINE_MODE_CODES, ...OPTIONAL_DEFINE_MODE_CODES])
  const extra = [...present].filter((code) => !known.has(code)).sort()
  return [...STANDARD_DEFINE_MODE_CODES, ...optional, ...extra]
}

export function defineModeColumnLabel(modeCode: string): string {
  const labels: Record<string, string> = {
    CREATE: 'Create SC',
    VIEW: 'View SC',
    EDIT: 'Edit SC',
    SEARCH: 'Search SC',
    DIALOG: 'Dialog SC',
  }
  return labels[modeCode] ?? `${modeCode} SC`
}

export function fieldTypeLabel(field: ScreenFullSpecField): string {
  const fromComponent = field.component?.componentType?.trim()
  const raw = (fromComponent || field.fieldType || '').toUpperCase()
  return COMPONENT_TYPE_LABELS[raw] ?? (fromComponent || field.fieldType || '')
}

export function modeVisibleMark(field: ScreenFullSpecField, modeCode: string): string {
  const config = field.modeConfigs.find((c) => String(c.modeCode) === modeCode)
  if (!config) return MODE_VISIBLE_MARK
  return config.isVisible ? MODE_VISIBLE_MARK : ''
}

export function fieldRequiredMark(field: ScreenFullSpecField): string {
  if (field.modeConfigs.some((c) => c.isRequired)) return MODE_VISIBLE_MARK
  if (field.required) return MODE_VISIBLE_MARK
  if (field.validations.some((v) => String(v.ruleTypeCode).toUpperCase() === 'REQUIRED')) {
    return MODE_VISIBLE_MARK
  }
  return ''
}

export function fieldReadonlyMark(field: ScreenFullSpecField): string {
  return field.modeConfigs.some((c) => c.isReadonly) ? FIELD_READONLY_MARK : ''
}

export function fieldLengthValue(field: ScreenFullSpecField): string {
  if (field.maxLength != null) return String(field.maxLength)
  if (field.dataField?.maxLength != null) return String(field.dataField.maxLength)
  const rule = field.validations.find((v) => String(v.ruleTypeCode).toUpperCase() === 'MAX_LENGTH')
  if (!rule) return ''
  const params = rule.ruleParamJson
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    const rec = params as Record<string, unknown>
    const n = rec.maxLength ?? rec.max_length ?? rec.max ?? rec.value
    if (n != null && n !== '') return String(n)
  }
  if (typeof params === 'number' || (typeof params === 'string' && params.trim())) return String(params)
  return ''
}

export function fieldDefaultValue(field: ScreenFullSpecField): string {
  return field.modeConfigs.find((c) => c.defaultValue)?.defaultValue ?? ''
}

export function fieldTableName(field: ScreenFullSpecField): string {
  if (!field.dataField) return ''
  return field.dataField.tableName || field.dataField.entityName || ''
}

/** Physical table only — do not infer from entity name or process Source text. */
export function fieldLinkedDataSource(field: ScreenFullSpecField): string {
  return field.dataField?.tableName?.trim() ?? ''
}

export function formatRuleParams(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return formatRuleParams(JSON.parse(trimmed) as unknown)
      } catch {
        return trimmed
      }
    }
    return trimmed
  }
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    const parts = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== '')
      .map(([key, v]) => `${key}=${Array.isArray(v) ? v.map(String).join(',') : String(v)}`)
    return parts.join('; ')
  }
  return String(value)
}

export function formatValidationCondition(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>
    const fieldKey = typeof rec.fieldKey === 'string' ? rec.fieldKey.trim() : ''
    const op = typeof rec.op === 'string' ? rec.op.trim() : ''
    const raw = rec.value
    const rhs = raw == null || raw === '' ? '' : String(raw)
    if (fieldKey || op || rhs) return [fieldKey, op, rhs].filter(Boolean).join(' ')
  }
  return formatRuleParams(value)
}

export function validationRuleTypeCode(rule: { ruleTypeCode?: string | null }): string {
  return String(rule.ruleTypeCode ?? '').trim().toUpperCase()
}

export function isDefinesCoveredValidation(rule: { ruleTypeCode?: string | null }): boolean {
  return DEFINES_COVERED_RULE_CODES.has(validationRuleTypeCode(rule))
}

export function pickValidationsWithRuleCodes<
  T extends { ruleTypeCode: string; ruleTypeId?: string; errorMessage?: string | null },
>(...lists: T[][]): T[] {
  let best: T[] = []
  let bestScore = -1
  for (const list of lists) {
    if (list.length === 0) continue
    let score = list.length
    for (const item of list) {
      if (item.ruleTypeCode.trim()) score += 10
      if (item.ruleTypeId) score += 3
      if (item.errorMessage) score += 1
    }
    if (score > bestScore) {
      best = list
      bestScore = score
    }
  }
  return best
}

export function resolveValidationRuleCodes<T extends { ruleTypeId?: string; ruleTypeCode: string }>(
  validations: T[],
  types: Array<{ id: string; code: string }>
): T[] {
  if (types.length === 0) return validations
  const byId = new Map(types.map((type) => [type.id, type.code]))
  return validations.map((rule) => {
    if (rule.ruleTypeCode.trim()) return rule
    const code = rule.ruleTypeId ? byId.get(rule.ruleTypeId) : undefined
    return code ? { ...rule, ruleTypeCode: code } : rule
  })
}

function validationModeLabel(
  rule: { modeId: string | null; modeCode?: string | null },
  modes: Array<{ id: string; modeCode: string }>
): string {
  if (rule.modeCode?.trim()) return rule.modeCode.trim().toUpperCase()
  if (rule.modeId) {
    const match = modes.find((mode) => mode.id === rule.modeId)
    if (match) return String(match.modeCode).toUpperCase()
  }
  return 'All'
}

function sortByOrder<T extends { displayOrder: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

function emptyModeMarks(modeCodes: string[]): Record<string, string> {
  return Object.fromEntries(modeCodes.map((code) => [code, '']))
}

function formatAuditDate(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.includes('T') ? trimmed.slice(0, 10) : trimmed
}

function headerAuditFromDoc(doc: ScreenSpecDocFullSpec): Pick<
  ScreenSpecExcelHeader,
  'author' | 'createdDate' | 'version' | 'updatedBy' | 'updatedDate'
> {
  const revisions = sortByOrder(doc.revisions)
  const byDate = [...doc.revisions].sort((a, b) =>
    (a.changedAt ?? '').localeCompare(b.changedAt ?? '')
  )
  const first = byDate.find((r) => r.changedAt) ?? revisions[0]
  const last = [...byDate].reverse().find((r) => r.changedAt) ?? revisions[revisions.length - 1]
  const latestVersion = [...revisions].reverse().find((r) => r.revisionNo)?.revisionNo ?? last?.revisionNo ?? ''
  return {
    author: doc.createdByName ?? first?.personInCharge ?? '',
    createdDate: formatAuditDate(doc.createdAt ?? first?.changedAt),
    version: latestVersion,
    updatedBy: doc.updatedByName ?? last?.personInCharge ?? '',
    updatedDate: formatAuditDate(doc.updatedAt ?? last?.changedAt),
  }
}

export function buildScreenSpecWorkbookModel(doc: ScreenSpecDocFullSpec): ScreenSpecWorkbookModel {
  const groupedEntries = sortByOrder(doc.screens)
  const screens = groupedEntries.map((entry) => entry.screen)
  const grouped = screens.length > 1
  const modeCodes = collectDefineModeCodes(screens)
  const header: ScreenSpecExcelHeader = {
    documentCode: doc.documentCode,
    documentName: doc.documentName,
    projectName: doc.projectName ?? '',
    systemName: doc.systemName ?? '',
    phaseName: doc.phaseName ?? '',
    language: doc.language ?? 'EN',
    overview: doc.overview ?? '',
    figmaUrl: doc.figmaUrl ?? '',
    screenIdText: grouped ? doc.documentCode : (screens[0]?.code ?? doc.documentCode),
    screenNameText: grouped ? doc.documentName : (screens[0]?.name ?? doc.documentName),
    grouped,
    ...headerAuditFromDoc(doc),
  }

  const revisions = sortByOrder(doc.revisions).map((rev) => ({
    revisionNo: rev.revisionNo,
    targetSheetName: rev.targetSheetName ?? '',
    details: rev.details ?? '',
    personInCharge: rev.personInCharge ?? '',
    changedAt: rev.changedAt ?? '',
    color: rev.color ?? '',
  }))

  const layoutScreens = groupedEntries.map((entry) => ({
    code: entry.screen.code,
    name: entry.screen.name,
    routePath: entry.screen.routePath ?? '',
    modes: sortByOrder(entry.screen.modes)
      .map((m) => m.name || String(m.modeCode))
      .join(', '),
    note: entry.note ?? '',
  }))

  const defineRows: ScreenSpecExcelDefineRow[] = []
  const processRows: ScreenSpecExcelOutlineRow[] = []
  const eventRows: ScreenSpecExcelOutlineRow[] = []
  const validationRows: ScreenSpecExcelValidationRow[] = []
  const tableAttrs = new Map<string, Set<string>>()

  function rememberTable(name: string, attribute?: string) {
    const key = name.trim()
    if (!key) return
    const attrs = tableAttrs.get(key) ?? new Set<string>()
    if (attribute?.trim()) attrs.add(attribute.trim())
    tableAttrs.set(key, attrs)
  }

  for (const entry of groupedEntries) {
    const screen = entry.screen
    if (grouped) {
      defineRows.push(emptyGroupDefineRow('screen', `${screen.code} ${screen.name}`.trim(), screen.code, modeCodes))
      processRows.push(emptyOutlineRow('screen', `${screen.code} ${screen.name}`.trim(), screen.code))
      eventRows.push(emptyOutlineRow('screen', `${screen.code} ${screen.name}`.trim(), screen.code))
    }

    const sections = sortByOrder(screen.sections)
    const fields = sortByOrder(screen.fields)
    let fieldNo = 0
    let validationNo = 0
    const screenHasValidations = fields.some((f) => f.validations.length > 0)
    if (grouped && screenHasValidations) {
      validationRows.push(
        emptyGroupValidationRow('screen', `${screen.code} ${screen.name}`.trim(), screen.code)
      )
    }

    for (const section of sections) {
      defineRows.push(emptyGroupDefineRow('section', section.name, screen.code, modeCodes))
      const sectionFields = fields.filter((f) => f.sectionId === section.id)
      const sectionValidated = sectionFields.filter((f) => f.validations.length > 0)
      if (sectionValidated.length > 0) {
        validationRows.push(emptyGroupValidationRow('section', section.name, screen.code))
      }
      for (const field of sectionFields) {
        fieldNo += 1
        defineRows.push(toDefineFieldRow(field, fieldNo, modeCodes, screen.code))
        rememberTable(fieldLinkedDataSource(field), field.dataField?.columnName || field.fieldKey)
        validationNo = pushValidationRows(
          validationRows,
          field,
          screen.code,
          screen.modes,
          validationNo
        )
      }
    }

    const unsectioned = fields.filter((f) => !f.sectionId || !sections.some((s) => s.id === f.sectionId))
    const unsectionedValidated = unsectioned.filter((f) => f.validations.length > 0)
    if (unsectionedValidated.length > 0 && sections.length > 0) {
      validationRows.push(emptyGroupValidationRow('section', 'No section', screen.code))
    }
    for (const field of unsectioned) {
      fieldNo += 1
      defineRows.push(toDefineFieldRow(field, fieldNo, modeCodes, screen.code))
      rememberTable(fieldLinkedDataSource(field), field.dataField?.columnName || field.fieldKey)
      validationNo = pushValidationRows(
        validationRows,
        field,
        screen.code,
        screen.modes,
        validationNo
      )
    }

    for (const item of sortByOrder(screen.processItems)) {
      processRows.push(emptyOutlineRow('heading', item.title, screen.code))
      processRows.push(outlineDetail('Title', item.title, screen.code))
      processRows.push(outlineDetail('Content', item.content ?? '', screen.code))
      processRows.push(outlineDetail('Source table', item.sourceTable ?? '', screen.code))
      processRows.push(outlineDetail('Condition', item.conditionNote ?? '', screen.code))
      processRows.push(
        outlineDetail('Field', excelLinkedFieldLabel(item.targetFieldId, fields), screen.code)
      )
    }

    for (const item of sortByOrder(screen.eventItems)) {
      eventRows.push(emptyOutlineRow('heading', item.title, screen.code))
      eventRows.push(outlineDetail('Title', item.title, screen.code))
      eventRows.push(outlineDetail('Content', item.content ?? '', screen.code))
      eventRows.push(outlineDetail('Trigger', item.triggerActionCode ?? '', screen.code))
      eventRows.push(
        outlineDetail('Trigger field', excelLinkedFieldLabel(item.triggerFieldId, fields), screen.code)
      )
      eventRows.push(outlineDetail('Condition', item.conditionNote ?? '', screen.code))
      eventRows.push(
        outlineDetail('Navigate to', eventNavigateToLabel(item.targetScreenId, screens), screen.code)
      )
    }
  }

  const databaseRows = [...tableAttrs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, attrs]) => ({
      name,
      attributes: [...attrs].sort().join(', '),
      notes: '',
    }))

  return {
    header,
    modeCodes,
    revisions,
    layoutScreens,
    defineRows,
    processRows,
    eventRows,
    validationRows,
    databaseRows,
  }
}

function emptyGroupDefineRow(
  kind: 'screen' | 'section',
  field: string,
  screenCode: string,
  modeCodes: string[]
): ScreenSpecExcelDefineRow {
  return {
    kind,
    no: '',
    field,
    physicalName: '',
    type: '',
    required: '',
    readonly: '',
    length: '',
    modeMarks: emptyModeMarks(modeCodes),
    defaultValue: '',
    table: '',
    columnAttribute: '',
    remark: '',
    screenCode,
  }
}

function emptyGroupValidationRow(
  kind: 'screen' | 'section',
  field: string,
  screenCode: string
): ScreenSpecExcelValidationRow {
  return {
    kind,
    no: '',
    screenCode,
    field,
    physicalName: '',
    mode: '',
    ruleType: '',
    params: '',
    individualRule: '',
    errorMessage: '',
    remark: '',
  }
}

function emptyOutlineRow(
  kind: 'screen' | 'heading',
  label: string,
  screenCode: string
): ScreenSpecExcelOutlineRow {
  return {
    kind,
    label,
    detail: '',
    source: '',
    condition: '',
    extra: '',
    screenCode,
  }
}

function outlineDetail(label: string, value: string, screenCode: string): ScreenSpecExcelOutlineRow {
  return {
    kind: 'detail',
    label,
    detail: value,
    source: '',
    condition: '',
    extra: '',
    screenCode,
  }
}

export function excelLinkedFieldLabel(
  fieldId: string | null | undefined,
  fields: Array<{ id: string; fieldKey: string; label: string }>
): string {
  if (!fieldId) return ''
  const field = fields.find((f) => f.id === fieldId)
  if (!field) return ''
  return field.label ? `${field.fieldKey} · ${field.label}` : field.fieldKey
}

export function eventNavigateToLabel(
  targetScreenId: string | null | undefined,
  screens: Array<{ id: string; code: string; name: string }>
): string {
  if (!targetScreenId) return ''
  const target = screens.find((s) => s.id === targetScreenId)
  if (!target) return ''
  return `${target.code} · ${target.name}`
}

function toDefineFieldRow(
  field: ScreenFullSpecField,
  no: number,
  modeCodes: string[],
  screenCode: string
): ScreenSpecExcelDefineRow {
  const modeMarks = emptyModeMarks(modeCodes)
  for (const code of modeCodes) {
    modeMarks[code] = modeVisibleMark(field, code)
  }
  return {
    kind: 'field',
    no: String(no),
    field: field.label,
    physicalName: field.fieldKey,
    type: fieldTypeLabel(field),
    required: fieldRequiredMark(field),
    readonly: fieldReadonlyMark(field),
    length: fieldLengthValue(field),
    modeMarks,
    defaultValue: fieldDefaultValue(field),
    table: fieldTableName(field),
    columnAttribute: field.dataField?.columnName ?? '',
    remark: field.remark ?? '',
    screenCode,
  }
}

function pushValidationRows(
  rows: ScreenSpecExcelValidationRow[],
  field: ScreenFullSpecField,
  screenCode: string,
  modes: Array<{ id: string; modeCode: string }>,
  startNo: number
): number {
  let no = startNo
  for (const rule of sortByOrder(field.validations)) {
    no += 1
    const ruleType = validationRuleTypeCode(rule) || 'RULE'
    rows.push({
      kind: 'rule',
      no: String(no),
      screenCode,
      field: field.label,
      physicalName: field.fieldKey,
      mode: validationModeLabel(rule, modes),
      ruleType,
      params: formatRuleParams(rule.ruleParamJson),
      individualRule: formatValidationCondition(rule.conditionJson),
      errorMessage: rule.errorMessage ?? '',
      remark: rule.remark ?? '',
    })
  }
  return no
}

export function suggestScreenSpecExcelFilename(doc: ScreenSpecDocFullSpec): string {
  const app = (doc.applicationName || doc.systemName || 'Screen-Spec').replace(/[/\\?*[\]]/g, '-')
  const name = (doc.documentName || doc.documentCode).replace(/[/\\?*[\]]/g, '-')
  return `【${app}】${name}.xlsx`.slice(0, 120)
}
