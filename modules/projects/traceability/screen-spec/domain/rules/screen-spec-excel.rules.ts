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
}

export interface ScreenSpecExcelRevisionRow {
  revisionNo: string
  targetSheetName: string
  details: string
  personInCharge: string
  changedAt: string
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
  screenCode: string
  field: string
  physicalName: string
  ruleType: string
  params: string
  mode: string
  errorMessage: string
  remark: string
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
  databaseTables: string[]
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
  const extra: string[] = []
  const seen = new Set<string>(STANDARD_DEFINE_MODE_CODES)
  for (const screen of screens) {
    for (const mode of screen.modes) {
      const code = String(mode.modeCode)
      if (!seen.has(code)) {
        seen.add(code)
        extra.push(code)
      }
    }
  }
  extra.sort()
  return [...STANDARD_DEFINE_MODE_CODES, ...extra]
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
  const create = field.modeConfigs.find((c) => String(c.modeCode) === ScreenModeCode.Create)
  if (create) return create.isRequired ? MODE_VISIBLE_MARK : ''
  return field.required ? MODE_VISIBLE_MARK : ''
}

export function fieldDefaultValue(field: ScreenFullSpecField): string {
  const create = field.modeConfigs.find((c) => String(c.modeCode) === ScreenModeCode.Create)
  if (create?.defaultValue) return create.defaultValue
  const first = field.modeConfigs.find((c) => c.defaultValue)
  return first?.defaultValue ?? ''
}

export function fieldTableName(field: ScreenFullSpecField): string {
  if (!field.dataField) return ''
  return field.dataField.tableName || field.dataField.entityName || ''
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
  }

  const revisions = sortByOrder(doc.revisions).map((rev) => ({
    revisionNo: rev.revisionNo,
    targetSheetName: rev.targetSheetName ?? '',
    details: rev.details ?? '',
    personInCharge: rev.personInCharge ?? '',
    changedAt: rev.changedAt ?? '',
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
  const tables = new Set<string>()

  for (const entry of groupedEntries) {
    const screen = entry.screen
    if (grouped) {
      defineRows.push({
        kind: 'screen',
        no: '',
        field: `${screen.code} ${screen.name}`.trim(),
        physicalName: '',
        type: '',
        required: '',
        length: '',
        modeMarks: emptyModeMarks(modeCodes),
        defaultValue: '',
        table: '',
        screenCode: screen.code,
      })
      processRows.push({
        kind: 'screen',
        label: `${screen.code} ${screen.name}`.trim(),
        detail: '',
        source: '',
        condition: '',
        extra: '',
        screenCode: screen.code,
      })
      eventRows.push({
        kind: 'screen',
        label: `${screen.code} ${screen.name}`.trim(),
        detail: '',
        source: '',
        condition: '',
        extra: '',
        screenCode: screen.code,
      })
    }

    const sections = sortByOrder(screen.sections)
    const fields = sortByOrder(screen.fields)
    let fieldNo = 0

    for (const section of sections) {
      defineRows.push({
        kind: 'section',
        no: '',
        field: section.name,
        physicalName: '',
        type: '',
        required: '',
        length: '',
        modeMarks: emptyModeMarks(modeCodes),
        defaultValue: '',
        table: '',
        screenCode: screen.code,
      })
      const sectionFields = fields.filter((f) => f.sectionId === section.id)
      for (const field of sectionFields) {
        fieldNo += 1
        defineRows.push(toDefineFieldRow(field, fieldNo, modeCodes, screen.code))
        const table = fieldTableName(field)
        if (table) tables.add(table)
        pushValidationRows(validationRows, field, screen.code)
      }
    }

    const unsectioned = fields.filter((f) => !f.sectionId || !sections.some((s) => s.id === f.sectionId))
    for (const field of unsectioned) {
      fieldNo += 1
      defineRows.push(toDefineFieldRow(field, fieldNo, modeCodes, screen.code))
      const table = fieldTableName(field)
      if (table) tables.add(table)
      pushValidationRows(validationRows, field, screen.code)
    }

    for (const item of sortByOrder(screen.processItems)) {
      processRows.push({
        kind: 'heading',
        label: item.title,
        detail: '',
        source: '',
        condition: '',
        extra: '',
        screenCode: screen.code,
      })
      if (item.content) {
        for (const line of item.content.split('\n').map((l) => l.trim()).filter(Boolean)) {
          processRows.push({
            kind: 'detail',
            label: 'Get',
            detail: line,
            source: '',
            condition: '',
            extra: '',
            screenCode: screen.code,
          })
        }
      }
      if (item.sourceTable) {
        processRows.push({
          kind: 'detail',
          label: 'Table',
          detail: '',
          source: item.sourceTable,
          condition: '',
          extra: '',
          screenCode: screen.code,
        })
        tables.add(item.sourceTable)
      }
      if (item.conditionNote) {
        processRows.push({
          kind: 'detail',
          label: 'Condition',
          detail: '',
          source: '',
          condition: item.conditionNote,
          extra: '',
          screenCode: screen.code,
        })
      }
    }

    for (const item of sortByOrder(screen.eventItems)) {
      eventRows.push({
        kind: 'heading',
        label: item.title,
        detail: '',
        source: '',
        condition: '',
        extra: '',
        screenCode: screen.code,
      })
      if (item.triggerActionCode) {
        eventRows.push({
          kind: 'detail',
          label: 'Trigger',
          detail: item.triggerActionCode,
          source: '',
          condition: '',
          extra: '',
          screenCode: screen.code,
        })
      }
      if (item.content) {
        for (const line of item.content.split('\n').map((l) => l.trim()).filter(Boolean)) {
          eventRows.push({
            kind: 'detail',
            label: 'Get',
            detail: line,
            source: '',
            condition: '',
            extra: '',
            screenCode: screen.code,
          })
        }
      }
      if (item.conditionNote) {
        eventRows.push({
          kind: 'detail',
          label: 'Condition',
          detail: '',
          source: '',
          condition: item.conditionNote,
          extra: '',
          screenCode: screen.code,
        })
      }
      if (item.targetScreenId || item.targetModeCode) {
        eventRows.push({
          kind: 'detail',
          label: 'Navigate',
          detail: [item.targetScreenId, item.targetModeCode].filter(Boolean).join(' / '),
          source: '',
          condition: '',
          extra: item.targetModeCode ?? '',
          screenCode: screen.code,
        })
      }
    }
  }

  return {
    header,
    modeCodes,
    revisions,
    layoutScreens,
    defineRows,
    processRows,
    eventRows,
    validationRows,
    databaseTables: [...tables].sort(),
  }
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
    physicalName: field.dataField?.columnName || field.fieldKey,
    type: fieldTypeLabel(field),
    required: fieldRequiredMark(field),
    length: field.maxLength != null ? String(field.maxLength) : '',
    modeMarks,
    defaultValue: fieldDefaultValue(field),
    table: fieldTableName(field),
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
      mode: rule.modeCode ?? '',
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
