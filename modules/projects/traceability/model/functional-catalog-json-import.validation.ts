import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalEnum,
  optionalString,
  optionalStringArray,
  rejectUnknownKeys,
  requireEnum,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import {
  BusinessRuleSeverity,
  FunctionalItemPriority,
  FunctionalItemType,
  NonFunctionalCategory,
  NonFunctionalScopeType,
  type CreateBusinessRuleBody,
} from './functional-catalog'

export type FunctionalCatalogJsonKind = 'FR' | 'NFR'

const MAX_NESTED_BUSINESS_RULES = 50

const BUSINESS_RULE_KEYS = new Set(['code', 'title', 'severity', 'description'])

export interface FunctionalCatalogJsonImportItem {
  kind: FunctionalCatalogJsonKind
  code: string
  title: string
  priority: string
  type?: string
  category?: string
  scopeType?: string
  description?: string
  acceptanceCriteria?: string[]
  businessRules?: CreateBusinessRuleBody[]
  targetMetric?: string
}

const FR_KEYS = new Set([
  'code',
  'title',
  'description',
  'priority',
  'type',
  'acceptanceCriteria',
  'businessRules',
])

const NFR_KEYS = new Set([
  'code',
  'title',
  'description',
  'priority',
  'category',
  'scopeType',
  'targetMetric',
])

function mapBusinessRules(
  raw: unknown,
  itemIndex: number,
  issues: JsonImportIssue[]
): CreateBusinessRuleBody[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({
      path: itemPath(itemIndex, 'businessRules'),
      message: 'businessRules must be an array when provided.',
    })
    return null
  }
  if (raw.length > MAX_NESTED_BUSINESS_RULES) {
    issues.push({
      path: itemPath(itemIndex, 'businessRules'),
      message: `businessRules allows at most ${MAX_NESTED_BUSINESS_RULES} rules per Functional Item.`,
    })
    return null
  }

  const out: CreateBusinessRuleBody[] = []
  const codes: string[] = []

  raw.forEach((entry, ruleIndex) => {
    const path = `items[${itemIndex}].businessRules[${ruleIndex}]`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      issues.push({ path, message: 'Each business rule must be an object.' })
      return
    }
    const row = entry as Record<string, unknown>
    for (const key of Object.keys(row)) {
      if (!BUSINESS_RULE_KEYS.has(key)) {
        issues.push({
          path: `${path}.${key}`,
          message: `Unknown business rule field "${key}". Allowed: ${[...BUSINESS_RULE_KEYS].join(', ')}.`,
        })
      }
    }

    const code = requireNonEmptyString(row, 'code', `${path}.code`, issues)
    const title = requireNonEmptyString(row, 'title', `${path}.title`, issues)
    const severity = requireEnum(
      row,
      'severity',
      Object.values(BusinessRuleSeverity),
      `${path}.severity`,
      issues
    )
    const description = optionalString(row, 'description', `${path}.description`, issues)
    if (!code || !title || !severity) return

    codes.push(code)
    out.push({
      code,
      title,
      severity,
      description: description ?? null,
    })
  })

  const seen = new Set<string>()
  codes.forEach((code, i) => {
    const key = code.toUpperCase()
    if (seen.has(key)) {
      issues.push({
        path: `items[${itemIndex}].businessRules[${i}].code`,
        message: `Duplicate business rule code "${code}" within this Functional Item.`,
      })
    }
    seen.add(key)
  })

  return out
}

export function validateFunctionalCatalogJsonImport(
  kind: FunctionalCatalogJsonKind,
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<FunctionalCatalogJsonImportItem> {
  const allowed = kind === 'FR' ? FR_KEYS : NFR_KEYS
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, allowed, index, issues)
      const code = requireNonEmptyString(row, 'code', itemPath(index, 'code'), issues)
      const title = requireNonEmptyString(row, 'title', itemPath(index, 'title'), issues)
      const priority =
        optionalEnum(
          row,
          'priority',
          Object.values(FunctionalItemPriority),
          itemPath(index, 'priority'),
          issues
        ) ?? FunctionalItemPriority.Medium
      const description = optionalString(row, 'description', itemPath(index, 'description'), issues)
      if (!code || !title) return null

      if (kind === 'FR') {
        const type =
          optionalEnum(
            row,
            'type',
            Object.values(FunctionalItemType),
            itemPath(index, 'type'),
            issues
          ) ?? FunctionalItemType.Functional
        const acceptanceCriteria = optionalStringArray(
          row,
          'acceptanceCriteria',
          itemPath(index, 'acceptanceCriteria'),
          issues
        )
        const businessRules = mapBusinessRules(row.businessRules, index, issues)
        if (businessRules == null) return null
        return {
          kind,
          code,
          title,
          priority,
          type,
          description: description ?? undefined,
          acceptanceCriteria: acceptanceCriteria ?? undefined,
          businessRules: businessRules.length ? businessRules : undefined,
        }
      }

      const category =
        optionalEnum(
          row,
          'category',
          Object.values(NonFunctionalCategory),
          itemPath(index, 'category'),
          issues
        ) ?? NonFunctionalCategory.Performance
      const scopeType =
        optionalEnum(
          row,
          'scopeType',
          Object.values(NonFunctionalScopeType),
          itemPath(index, 'scopeType'),
          issues
        ) ?? NonFunctionalScopeType.System
      const targetMetric = optionalString(
        row,
        'targetMetric',
        itemPath(index, 'targetMetric'),
        issues
      )

      return {
        kind,
        code,
        title,
        priority,
        category,
        scopeType,
        description: description ?? undefined,
        targetMetric: targetMetric ?? undefined,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped.map((item, index) => ({ index, value: item.code, field: 'code' })),
        issues
      )
    },
  })
}
