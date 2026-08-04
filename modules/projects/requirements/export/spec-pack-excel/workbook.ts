import ExcelJS from 'exceljs'
import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import { formatSpecPackDate } from '../../model/spec-pack'
import { flattenSpecPackForExcel } from './rows'

const FONT = { name: 'Century Gothic', size: 10 }
const HEADER_FONT = { name: 'Century Gothic', size: 10, bold: true }
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
}

function styleHeader(sheet: ExcelJS.Worksheet): void {
  const row = sheet.getRow(1)
  row.font = HEADER_FONT
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
}

function applyBodyFont(sheet: ExcelJS.Worksheet): void {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.font = FONT
    row.alignment = { vertical: 'top', wrapText: true }
  })
}

function addSummarySheet(
  wb: ExcelJS.Workbook,
  doc: SpecPackPreviewDocument,
  stats: {
    groupCount: number
    requirementCount: number
    functionCount: number
    useCaseCount: number
  }
): void {
  const sheet = wb.addWorksheet('Summary')
  sheet.columns = [
    { header: 'Field', key: 'field', width: 28 },
    { header: 'Value', key: 'value', width: 72 },
  ]
  sheet.addRows([
    { field: 'Title', value: doc.title },
    { field: 'Note', value: doc.note ?? '' },
    { field: 'Created', value: formatSpecPackDate(doc.createdAt) },
    { field: 'Generated', value: formatSpecPackDate(doc.generatedAt) },
    { field: 'Groups', value: stats.groupCount },
    { field: 'Requirements', value: stats.requirementCount },
    { field: 'Functions', value: stats.functionCount },
    { field: 'Use cases', value: stats.useCaseCount },
    { field: 'Pack ID', value: doc.packId },
    { field: 'Project ID', value: doc.projectId },
  ])
  styleHeader(sheet)
  applyBodyFont(sheet)
  sheet.getColumn(1).font = HEADER_FONT
}

function addGroupsSheet(
  wb: ExcelJS.Workbook,
  sections: ReturnType<typeof flattenSpecPackForExcel>['sections']
): void {
  const sheet = wb.addWorksheet('Groups', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  sheet.columns = [
    { header: '#', key: 'no', width: 6 },
    { header: 'Group name', key: 'name', width: 28 },
    { header: 'Description', key: 'description', width: 48 },
    { header: 'Requirements', key: 'reqCount', width: 14 },
    { header: 'Group ID', key: 'id', width: 36 },
  ]
  sections.forEach((s, i) => {
    sheet.addRow({
      no: i + 1,
      name: s.group.name,
      description: s.group.description ?? '',
      reqCount: s.chapters.length,
      id: s.group.id,
    })
  })
  styleHeader(sheet)
  applyBodyFont(sheet)
}

function addRequirementsSheet(
  wb: ExcelJS.Workbook,
  rows: ReturnType<typeof flattenSpecPackForExcel>['requirementRows']
): void {
  const sheet = wb.addWorksheet('Requirements', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  sheet.columns = [
    { header: 'Group #', key: 'groupNo', width: 10 },
    { header: 'Group', key: 'groupName', width: 22 },
    { header: 'Chapter #', key: 'chapterNo', width: 11 },
    { header: 'Code', key: 'code', width: 16 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Description', key: 'description', width: 48 },
    { header: 'Functions', key: 'functionCount', width: 11 },
    { header: 'Load error', key: 'loadError', width: 24 },
    { header: 'Requirement ID', key: 'requirementId', width: 36 },
  ]
  for (const r of rows) sheet.addRow(r)
  styleHeader(sheet)
  applyBodyFont(sheet)
}

function addFunctionsSheet(
  wb: ExcelJS.Workbook,
  rows: ReturnType<typeof flattenSpecPackForExcel>['functionRows']
): void {
  const sheet = wb.addWorksheet('Functions', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  sheet.columns = [
    { header: 'Group', key: 'groupName', width: 20 },
    { header: 'Chapter #', key: 'chapterNo', width: 11 },
    { header: 'Requirement', key: 'requirementCode', width: 16 },
    { header: 'Fn #', key: 'fnIndex', width: 8 },
    { header: 'Code', key: 'code', width: 16 },
    { header: 'Name', key: 'name', width: 32 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Acceptance criteria', key: 'acceptanceCriteria', width: 36 },
    { header: 'Business rules', key: 'businessRules', width: 36 },
    { header: 'Created', key: 'createdAt', width: 18 },
    { header: 'Updated', key: 'updatedAt', width: 18 },
    { header: 'Function ID', key: 'functionId', width: 36 },
  ]
  for (const r of rows) sheet.addRow(r)
  styleHeader(sheet)
  applyBodyFont(sheet)
}

function addLinksSheet(
  wb: ExcelJS.Workbook,
  rows: ReturnType<typeof flattenSpecPackForExcel>['linkRows']
): void {
  const sheet = wb.addWorksheet('Linked artifacts', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  sheet.columns = [
    { header: 'Requirement', key: 'requirementCode', width: 16 },
    { header: 'Function code', key: 'functionCode', width: 16 },
    { header: 'Function name', key: 'functionName', width: 28 },
    { header: 'Artifact type', key: 'artifactType', width: 14 },
    { header: 'Code', key: 'code', width: 16 },
    { header: 'Name', key: 'name', width: 32 },
    { header: 'Secondary', key: 'secondary', width: 24 },
  ]
  for (const r of rows) sheet.addRow(r)
  styleHeader(sheet)
  applyBodyFont(sheet)
}

function addUseCasesSheet(
  wb: ExcelJS.Workbook,
  rows: ReturnType<typeof flattenSpecPackForExcel>['useCaseRows']
): void {
  const sheet = wb.addWorksheet('Use cases', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  sheet.columns = [
    { header: 'Requirement', key: 'requirementCode', width: 16 },
    { header: 'Function', key: 'functionCode', width: 16 },
    { header: 'UC key', key: 'useCaseKey', width: 14 },
    { header: 'UC name', key: 'useCaseName', width: 28 },
    { header: 'Goal', key: 'goal', width: 36 },
    { header: 'Primary actor', key: 'primaryActor', width: 18 },
    { header: 'Trigger', key: 'trigger', width: 28 },
    { header: 'Conditions', key: 'conditions', width: 36 },
    { header: 'Business rules', key: 'businessRules', width: 36 },
    { header: 'Acceptance criteria', key: 'acceptanceCriteria', width: 40 },
    { header: 'Flows', key: 'flows', width: 40 },
  ]
  for (const r of rows) sheet.addRow(r)
  styleHeader(sheet)
  applyBodyFont(sheet)
}

export function suggestSpecPackExcelFilename(doc: SpecPackPreviewDocument): string {
  const safe = doc.title
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${safe || 'spec-pack'}.xlsx`
}

/** Build Spec Pack workbook from the shared preview document. */
export async function buildSpecPackExcelWorkbook(
  doc: SpecPackPreviewDocument
): Promise<ExcelJS.Workbook> {
  const flat = flattenSpecPackForExcel(doc)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scopery'
  wb.created = new Date()

  addSummarySheet(wb, doc, {
    groupCount: flat.sections.length,
    requirementCount: flat.requirementRows.length,
    functionCount: flat.functionCount,
    useCaseCount: flat.useCaseRows.length,
  })
  addGroupsSheet(wb, flat.sections)
  addRequirementsSheet(wb, flat.requirementRows)
  addFunctionsSheet(wb, flat.functionRows)
  addLinksSheet(wb, flat.linkRows)
  addUseCasesSheet(wb, flat.useCaseRows)

  return wb
}
