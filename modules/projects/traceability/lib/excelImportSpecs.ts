import {
  FunctionalItemPriority,
  FunctionalItemType,
  NonFunctionalCategory,
  NonFunctionalScopeType,
} from '../model/functional-catalog'
import type { ExcelListImportSpec } from './excelListImport'

export const MODULE_IMPORT_SPEC: ExcelListImportSpec = {
  instruction:
    'Create an Excel file (.xlsx) with one sheet and columns: code, name, description (optional). One module per row. Example: code=CART, name=Cart.',
  columns: [
    { key: 'code', required: true },
    { key: 'name', required: true },
    { key: 'description' },
  ],
}

export const SCREEN_IMPORT_SPEC: ExcelListImportSpec = {
  instruction:
    'Create an Excel file (.xlsx) with columns: code, name, routePath (optional). One screen per row. This creates empty screens only. For modes, fields, processes, and events, use JSON full spec import below.'
  columns: [
    { key: 'code', required: true },
    { key: 'name', required: true },
    { key: 'routePath' },
  ],
}

export const API_ENDPOINT_IMPORT_SPEC: ExcelListImportSpec = {
  instruction:
    'Create an Excel file (.xlsx) with columns: method, pathPattern, name (optional). method must be GET|POST|PUT|PATCH|DELETE. Example: method=POST, pathPattern=/carts/{id}/items.',
  columns: [
    {
      key: 'method',
      required: true,
      enumValues: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const,
      normalizeEnum: true,
    },
    { key: 'pathPattern', required: true },
    { key: 'name' },
  ],
}

export const COMPONENT_IMPORT_SPEC: ExcelListImportSpec = {
  instruction:
    'Create an Excel file (.xlsx) with columns: code, name, componentType (optional), description (optional).',
  columns: [
    { key: 'code', required: true },
    { key: 'name', required: true },
    { key: 'componentType' },
    { key: 'description' },
  ],
}

export const DATA_ENTITY_IMPORT_SPEC: ExcelListImportSpec = {
  instruction:
    'Create an Excel file (.xlsx) with columns: code, name, tableName (optional), description (optional).',
  columns: [
    { key: 'code', required: true },
    { key: 'name', required: true },
    { key: 'tableName' },
    { key: 'description' },
  ],
}

export const FUNCTIONAL_ITEM_IMPORT_SPEC: ExcelListImportSpec = {
  instruction:
    'Create an Excel file (.xlsx) with columns: code, title, priority, type, description (optional), acceptanceCriteria (optional). priority=LOW|MEDIUM|HIGH|CRITICAL. type=FUNCTIONAL|USER_STORY|USE_CASE. acceptanceCriteria: separate multiple with | or new lines in the cell.',
  columns: [
    { key: 'code', required: true },
    { key: 'title', required: true },
    {
      key: 'priority',
      required: true,
      enumValues: Object.values(FunctionalItemPriority),
      normalizeEnum: true,
    },
    {
      key: 'type',
      required: true,
      enumValues: Object.values(FunctionalItemType),
      normalizeEnum: true,
    },
    { key: 'description' },
    { key: 'acceptanceCriteria' },
  ],
}

export const NON_FUNCTIONAL_ITEM_IMPORT_SPEC: ExcelListImportSpec = {
  instruction:
    'Create an Excel file (.xlsx) with columns: code, title, category, priority, scopeType, description (optional), targetMetric (optional). category=PERFORMANCE|SECURITY|USABILITY|RELIABILITY|MAINTAINABILITY|SCALABILITY|COMPATIBILITY|OTHER. priority=LOW|MEDIUM|HIGH|CRITICAL. scopeType=SYSTEM|MODULE|FEATURE.',
  columns: [
    { key: 'code', required: true },
    { key: 'title', required: true },
    {
      key: 'category',
      required: true,
      enumValues: Object.values(NonFunctionalCategory),
      normalizeEnum: true,
    },
    {
      key: 'priority',
      required: true,
      enumValues: Object.values(FunctionalItemPriority),
      normalizeEnum: true,
    },
    {
      key: 'scopeType',
      required: true,
      enumValues: Object.values(NonFunctionalScopeType),
      normalizeEnum: true,
    },
    { key: 'description' },
    { key: 'targetMetric' },
  ],
}

export function splitAcceptanceCriteria(raw: string | undefined): string[] | null {
  if (!raw?.trim()) return null
  const parts = raw
    .split(/\r?\n|\|/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length ? parts : null
}
