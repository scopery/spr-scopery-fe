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

export interface ScreenSpecExcelEventRow {
  kind: 'screen' | 'event'
  title: string
  content: string
  trigger: string
  triggerField: string
  condition: string
  navigateTo: string
  screenCode: string
}

export interface ScreenSpecExcelValidationRow {
  screenCode: string
  field: string
  physicalName: string
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
  eventRows: ScreenSpecExcelEventRow[]
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
  meta?: Partial<Pick<ScreenSpecDocFullSpec, 'documentCode' | 'documentName' | 'projectName' | 'systemName' | 'phaseName' | 'language' | 'overview' | 'figmaUrl'>>
): ScreenSpecDocFullSpec {
  return {
    id: screen.id,
    projectId: '',
    documentCode: meta?.documentCode ?? screen.code,
    documentName: meta?.documentName ?? screen.name,
    projectName: meta?.projectName ?? null,
    systemName: meta?.systemName ?? null,
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
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
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
  const eventRows: ScreenSpecExcelEventRow[] = []
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
      eventRows.push(emptyEventGroupRow(`${screen.code} ${screen.name}`.trim(), screen.code))
    }

    const sections = sortByOrder(screen.sections)
    const fields = sortByOrder(screen.fields)
    let fieldNo = 0

    for (const section of sections) {
      defineRows.push(emptyGroupDefineRow('section', section.name, screen.code, modeCodes))
      const sectionFields = fields.filter((f) => f.sectionId === section.id)
      for (const field of sectionFields) {
        fieldNo += 1
        defineRows.push(toDefineFieldRow(field, fieldNo, modeCodes, screen.code))
        rememberTable(fieldLinkedDataSource(field), field.dataField?.columnName || field.fieldKey)
        pushValidationRows(validationRows, field, screen.code)
      }
    }

    const unsectioned = fields.filter((f) => !f.sectionId || !sections.some((s) => s.id === f.sectionId))
    for (const field of unsectioned) {
      fieldNo += 1
      defineRows.push(toDefineFieldRow(field, fieldNo, modeCodes, screen.code))
      rememberTable(fieldLinkedDataSource(field), field.dataField?.columnName || field.fieldKey)
      pushValidationRows(validationRows, field, screen.code)
    }

    for (const item of sortByOrder(screen.processItems)) {
      processRows.push(emptyOutlineRow('heading', item.title, screen.code))
      processRows.push({
        kind: 'detail',
        label: 'Get',
        detail: item.content ?? '',
        source: '',
        condition: '',
        extra: '',
        screenCode: screen.code,
      })
      processRows.push({
        kind: 'detail',
        label: 'Source',
        detail: '',
        source: item.sourceTable ?? '',
        condition: '',
        extra: '',
        screenCode: screen.code,
      })
      processRows.push({
        kind: 'detail',
        label: 'Filter',
        detail: '',
        source: '',
        condition: item.conditionNote ?? '',
        extra: '',
        screenCode: screen.code,
      })
      processRows.push({
        kind: 'detail',
        label: 'Trigger',
        detail: '',
        source: '',
        condition: '',
        extra: '',
        screenCode: screen.code,
      })
    }

    for (const item of sortByOrder(screen.eventItems)) {
      eventRows.push({
        kind: 'event',
        title: item.title,
        content: item.content ?? '',
        trigger: item.triggerActionCode ?? '',
        triggerField: eventTriggerFieldLabel(item.triggerFieldId, fields),
        condition: item.conditionNote ?? '',
        navigateTo: eventNavigateToLabel(item.targetScreenId, screens),
        screenCode: screen.code,
      })
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
    length: '',
    modeMarks: emptyModeMarks(modeCodes),
    defaultValue: '',
    table: '',
    columnAttribute: '',
    remark: '',
    screenCode,
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

function emptyEventGroupRow(title: string, screenCode: string): ScreenSpecExcelEventRow {
  return {
    kind: 'screen',
    title,
    content: '',
    trigger: '',
    triggerField: '',
    condition: '',
    navigateTo: '',
    screenCode,
  }
}

export function eventTriggerFieldLabel(
  triggerFieldId: string | null | undefined,
  fields: Array<{ id: string; fieldKey: string; label: string }>
): string {
  if (!triggerFieldId) return ''
  const field = fields.find((f) => f.id === triggerFieldId)
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
  screenCode: string
) {
  for (const rule of sortByOrder(field.validations)) {
    if (DEFINES_COVERED_RULE_CODES.has(rule.ruleTypeCode)) continue
    rows.push({
      screenCode,
      field: field.label,
      physicalName: field.fieldKey,
      ruleType: rule.ruleTypeCode,
      params: formatRuleParams(rule.ruleParamJson),
      individualRule: formatRuleParams(rule.conditionJson),
      errorMessage: rule.errorMessage ?? '',
      remark: rule.remark ?? '',
    })
  }
}

export function suggestScreenSpecExcelFilename(doc: ScreenSpecDocFullSpec): string {
  const project = (doc.projectName || 'Screen-Spec').replace(/[/\\?*[\]]/g, '-')
  const name = (doc.documentName || doc.documentCode).replace(/[/\\?*[\]]/g, '-')
  return `【${project}】${name}.xlsx`.slice(0, 120)
}
