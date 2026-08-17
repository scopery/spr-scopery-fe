import type { RegistryApiEndpoint } from './application-registry'

export const API_SPEC_EXCEL_SHEET = 'APIs'

export const API_SPEC_EXCEL_HEADERS = [
  'Method',
  'Path',
  'Name',
  'Description',
  'Param name',
  'In',
  'Type',
  'Required',
  'Param description',
  'Example',
  'Response schema',
] as const

/** Columns that stay the same for every param row of one API (1-based). */
export const API_SPEC_EXCEL_MERGED_COLS = [1, 2, 3, 4, 11] as const

export interface ApiSpecExcelRow {
  method: string
  path: string
  name: string
  description: string
  paramName: string
  paramIn: string
  paramType: string
  paramRequired: string
  paramDescription: string
  paramExample: string
  responseSchema: string
}

export interface ApiSpecExcelMerge {
  start: number
  end: number
}

export interface ApiSpecExcelModel {
  rows: ApiSpecExcelRow[]
  merges: ApiSpecExcelMerge[]
}

export function tryFormatJson(
  value: string
): { ok: true; value: string } | { ok: false; message: string } {
  const raw = value.trim()
  if (!raw) return { ok: true, value: '' }
  try {
    return { ok: true, value: JSON.stringify(JSON.parse(raw), null, 2) }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Invalid JSON' }
  }
}

export function prettyJson(value: string | null | undefined): string {
  const formatted = tryFormatJson(value ?? '')
  return formatted.ok ? formatted.value : (value ?? '').trim()
}

export function buildApiSpecExcelModel(endpoints: RegistryApiEndpoint[]): ApiSpecExcelModel {
  const rows: ApiSpecExcelRow[] = []
  const merges: ApiSpecExcelMerge[] = []

  for (const endpoint of endpoints) {
    const params = endpoint.requestParams ?? []
    const start = rows.length
    const shared = {
      method: endpoint.method,
      path: endpoint.pathPattern,
      name: endpoint.name ?? '',
      description: endpoint.description ?? '',
      responseSchema: prettyJson(endpoint.responseSchemaJson),
    }
    if (params.length === 0) {
      rows.push({
        ...shared,
        paramName: '',
        paramIn: '',
        paramType: '',
        paramRequired: '',
        paramDescription: '',
        paramExample: '',
      })
      continue
    }
    for (const param of params) {
      rows.push({
        ...shared,
        paramName: param.name,
        paramIn: param.in,
        paramType: param.type,
        paramRequired: param.required ? 'Yes' : 'No',
        paramDescription: param.description ?? '',
        paramExample: param.example ?? '',
      })
    }
    if (params.length > 1) {
      merges.push({ start, end: start + params.length - 1 })
    }
  }

  return { rows, merges }
}

export function suggestApiSpecExcelFilename(applicationName?: string | null): string {
  const app = (applicationName || 'APIs').replace(/[/\\?*[\]]/g, '-')
  return `【${app}】APIs.xlsx`.slice(0, 120)
}
