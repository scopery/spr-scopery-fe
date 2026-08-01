import {
  asRecord,
  failIssues,
  okItems,
  optionalNumberField,
  optionalString,
  parseJsonImportText,
  requireEnum,
  requireNonEmptyString,
  requireUuid,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import {
  UseCaseConditionType,
  UseCaseFlowStepType,
  UseCaseFlowType,
} from './use-case'
import type {
  UseCaseNestedCriterionImport,
  UseCaseNestedConditionImport,
  UseCaseNestedFlowImport,
  UseCaseNestedImportPayload,
  UseCaseNestedRuleImport,
  UseCaseNestedStepImport,
  UseCaseNestedSupportingFunctionImport,
} from './use-case-nested-import'

const ROOT_KEYS = new Set([
  'flows',
  'conditions',
  'businessRules',
  'acceptanceCriteria',
  'supportingFunctions',
])

const FLOW_KEYS = new Set(['flowType', 'name', 'conditionText', 'steps'])
const STEP_KEYS = new Set(['stepType', 'content', 'contentJson', 'displayOrder'])
const CONDITION_KEYS = new Set(['conditionType', 'content', 'displayOrder'])
const RULE_KEYS = new Set(['ruleCode', 'description', 'displayOrder'])
const CRITERION_KEYS = new Set([
  'title',
  'givenText',
  'whenText',
  'thenText',
  'displayOrder',
])
const SUPPORTING_KEYS = new Set(['functionId'])


function withPrefix(prefix: string, path: string): string {
  if (!prefix) return path
  if (!path) return prefix
  return `${prefix}.${path}`
}

function rejectKeys(
  row: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  basePath: string,
  issues: JsonImportIssue[]
): void {
  for (const key of Object.keys(row)) {
    if (!allowed.has(key)) {
      issues.push({
        path: basePath ? `${basePath}.${key}` : key,
        message: `Unknown field "${key}". Allowed: ${[...allowed].join(', ')}.`,
      })
    }
  }
}

/**
 * Validate nested Use Case JSON (detail Import tab).
 * Accepts `{ items: [ payload ] }`, bare payload object, or `{ flows, ... }`.
 */
export function validateUseCaseNestedImportText(
  text: string
): JsonImportValidationResult<UseCaseNestedImportPayload> {
  const trimmed = text.trim()
  if (!trimmed) {
    return failIssues([{ path: '', message: 'JSON payload is empty.' }])
  }

  let payloadRaw: Record<string, unknown> | null = null
  const issues: JsonImportIssue[] = []

  if (trimmed.startsWith('[')) {
    const parsed = parseJsonImportText(trimmed)
    if (!parsed.ok) return failIssues(parsed.issues)
    if (parsed.items.length !== 1) {
      return failIssues([
        {
          path: 'items',
          message:
            'Nested import applies to the open Use Case only — provide exactly one payload object.',
        },
      ])
    }
    payloadRaw = parsed.items[0]
  } else {
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch (err) {
      return failIssues([
        {
          path: '',
          message: `Invalid JSON: ${err instanceof Error ? err.message : 'parse error'}`,
        },
      ])
    }
    const root = asRecord(parsed)
    if (!root) {
      return failIssues([{ path: '', message: 'Root must be a JSON object.' }])
    }
    if (Array.isArray(root.items)) {
      const wrapped = parseJsonImportText(trimmed)
      if (!wrapped.ok) return failIssues(wrapped.issues)
      if (wrapped.items.length !== 1) {
        return failIssues([
          {
            path: 'items',
            message:
              'Nested import applies to the open Use Case only — provide exactly one object in items.',
          },
        ])
      }
      payloadRaw = wrapped.items[0]
    } else {
      payloadRaw = root
    }
  }

  if (!payloadRaw) {
    return failIssues([{ path: '', message: 'Could not read nested import payload.' }])
  }

  rejectKeys(payloadRaw, ROOT_KEYS, '', issues)

  const flows = mapFlows(payloadRaw.flows, issues)
  const conditions = mapConditions(payloadRaw.conditions, issues)
  const businessRules = mapRules(payloadRaw.businessRules, issues)
  const acceptanceCriteria = mapCriteria(payloadRaw.acceptanceCriteria, issues)
  const supportingFunctions = mapSupporting(payloadRaw.supportingFunctions, issues)

  const payload: UseCaseNestedImportPayload = {
    flows: flows ?? undefined,
    conditions: conditions ?? undefined,
    businessRules: businessRules ?? undefined,
    acceptanceCriteria: acceptanceCriteria ?? undefined,
    supportingFunctions: supportingFunctions ?? undefined,
  }

  const partCount =
    (payload.flows?.length ?? 0) +
    (payload.flows?.reduce((n, f) => n + (f.steps?.length ?? 0), 0) ?? 0) +
    (payload.conditions?.length ?? 0) +
    (payload.businessRules?.length ?? 0) +
    (payload.acceptanceCriteria?.length ?? 0) +
    (payload.supportingFunctions?.length ?? 0)

  if (partCount === 0 && issues.length === 0) {
    issues.push({
      path: '',
      message:
        'No nested parts found. Include at least one flow, condition, rule, criterion, or supporting function.',
    })
  }

  if (issues.length > 0) return failIssues(issues)
  return okItems([payload])
}


/** Map optional nested parts from a full Use Case JSON import item (shell + nested). */
export function mapOptionalNestedPartsFromItem(
  row: Record<string, unknown>,
  itemIndex: number,
  issues: JsonImportIssue[]
): UseCaseNestedImportPayload | undefined {
  const nestedKeys = ['flows', 'conditions', 'businessRules', 'acceptanceCriteria'] as const
  const hasAny = nestedKeys.some((key) => key in row && row[key] != null)
  if (!hasAny) return undefined

  const prefix = `items[${itemIndex}]`
  const flows = mapFlows(row.flows, issues, prefix)
  const conditions = mapConditions(row.conditions, issues, prefix)
  const businessRules = mapRules(row.businessRules, issues, prefix)
  const acceptanceCriteria = mapCriteria(row.acceptanceCriteria, issues, prefix)
  if (flows == null || conditions == null || businessRules == null || acceptanceCriteria == null) {
    return undefined
  }

  const nested: UseCaseNestedImportPayload = {
    flows: flows.length ? flows : undefined,
    conditions: conditions.length ? conditions : undefined,
    businessRules: businessRules.length ? businessRules : undefined,
    acceptanceCriteria: acceptanceCriteria.length ? acceptanceCriteria : undefined,
  }
  if (
    !nested.flows &&
    !nested.conditions &&
    !nested.businessRules &&
    !nested.acceptanceCriteria
  ) {
    return undefined
  }
  return nested
}

function mapFlows(
  raw: unknown,
  issues: JsonImportIssue[],
  pathPrefix = ''
): UseCaseNestedFlowImport[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({ path: withPrefix(pathPrefix, 'flows'), message: 'flows must be an array.' })
    return null
  }
  const out: UseCaseNestedFlowImport[] = []
  let mainCount = 0
  raw.forEach((entry, index) => {
    const path = withPrefix(pathPrefix, `flows[${index}]`)
    const row = asRecord(entry)
    if (!row) {
      issues.push({ path, message: 'Each flow must be an object.' })
      return
    }
    rejectKeys(row, FLOW_KEYS, path, issues)
    const flowType = requireEnum(
      row,
      'flowType',
      Object.values(UseCaseFlowType),
      `${path}.flowType`,
      issues
    )
    if (flowType === UseCaseFlowType.Main) mainCount += 1
    const steps = mapFlowSteps(row.steps, path, issues)
    if (!flowType || steps == null) return
    out.push({
      flowType,
      name: optionalString(row, 'name', `${path}.name`, issues),
      conditionText: optionalString(row, 'conditionText', `${path}.conditionText`, issues),
      steps,
    })
  })
  if (mainCount > 1) {
    issues.push({
      path: withPrefix(pathPrefix, 'flows'),
      message: 'At most one MAIN flow is allowed in a single import.',
    })
  }
  return out
}

function mapFlowSteps(
  raw: unknown,
  flowPath: string,
  issues: JsonImportIssue[]
): UseCaseNestedStepImport[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({ path: `${flowPath}.steps`, message: 'steps must be an array.' })
    return null
  }
  const out: UseCaseNestedStepImport[] = []
  raw.forEach((entry, index) => {
    const path = `${flowPath}.steps[${index}]`
    const row = asRecord(entry)
    if (!row) {
      issues.push({ path, message: 'Each step must be an object.' })
      return
    }
    rejectKeys(row, STEP_KEYS, path, issues)
    const stepType = requireEnum(
      row,
      'stepType',
      Object.values(UseCaseFlowStepType),
      `${path}.stepType`,
      issues
    )
    if (!stepType) return
    out.push({
      stepType,
      content: optionalString(row, 'content', `${path}.content`, issues),
      contentJson: optionalString(row, 'contentJson', `${path}.contentJson`, issues),
      displayOrder:
        optionalNumberField(row, 'displayOrder', `${path}.displayOrder`, issues, {
          integer: true,
          min: 0,
        }) ?? undefined,
    })
  })
  return out
}

function mapConditions(
  raw: unknown,
  issues: JsonImportIssue[],
  pathPrefix = ''
): UseCaseNestedConditionImport[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({ path: withPrefix(pathPrefix, 'conditions'), message: 'conditions must be an array.' })
    return null
  }
  const out: UseCaseNestedConditionImport[] = []
  raw.forEach((entry, index) => {
    const path = withPrefix(pathPrefix, `conditions[${index}]`)
    const row = asRecord(entry)
    if (!row) {
      issues.push({ path, message: 'Each condition must be an object.' })
      return
    }
    rejectKeys(row, CONDITION_KEYS, path, issues)
    const conditionType = requireEnum(
      row,
      'conditionType',
      Object.values(UseCaseConditionType),
      `${path}.conditionType`,
      issues
    )
    const content = requireNonEmptyString(row, 'content', `${path}.content`, issues)
    if (!conditionType || !content) return
    out.push({
      conditionType,
      content,
      displayOrder:
        optionalNumberField(row, 'displayOrder', `${path}.displayOrder`, issues, {
          integer: true,
          min: 0,
        }) ?? undefined,
    })
  })
  return out
}

function mapRules(
  raw: unknown,
  issues: JsonImportIssue[],
  pathPrefix = ''
): UseCaseNestedRuleImport[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({
      path: withPrefix(pathPrefix, 'businessRules'),
      message: 'businessRules must be an array.',
    })
    return null
  }
  const out: UseCaseNestedRuleImport[] = []
  raw.forEach((entry, index) => {
    const path = withPrefix(pathPrefix, `businessRules[${index}]`)
    const row = asRecord(entry)
    if (!row) {
      issues.push({ path, message: 'Each business rule must be an object.' })
      return
    }
    rejectKeys(row, RULE_KEYS, path, issues)
    const ruleCode = requireNonEmptyString(row, 'ruleCode', `${path}.ruleCode`, issues)
    const description = requireNonEmptyString(row, 'description', `${path}.description`, issues)
    if (!ruleCode || !description) return
    out.push({
      ruleCode,
      description,
      displayOrder:
        optionalNumberField(row, 'displayOrder', `${path}.displayOrder`, issues, {
          integer: true,
          min: 0,
        }) ?? undefined,
    })
  })
  return out
}

function mapCriteria(
  raw: unknown,
  issues: JsonImportIssue[],
  pathPrefix = ''
): UseCaseNestedCriterionImport[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({
      path: withPrefix(pathPrefix, 'acceptanceCriteria'),
      message: 'acceptanceCriteria must be an array.',
    })
    return null
  }
  const out: UseCaseNestedCriterionImport[] = []
  raw.forEach((entry, index) => {
    const path = withPrefix(pathPrefix, `acceptanceCriteria[${index}]`)
    const row = asRecord(entry)
    if (!row) {
      issues.push({ path, message: 'Each acceptance criterion must be an object.' })
      return
    }
    rejectKeys(row, CRITERION_KEYS, path, issues)
    const title = requireNonEmptyString(row, 'title', `${path}.title`, issues)
    if (!title) return
    out.push({
      title,
      givenText: optionalString(row, 'givenText', `${path}.givenText`, issues),
      whenText: optionalString(row, 'whenText', `${path}.whenText`, issues),
      thenText: optionalString(row, 'thenText', `${path}.thenText`, issues),
      displayOrder:
        optionalNumberField(row, 'displayOrder', `${path}.displayOrder`, issues, {
          integer: true,
          min: 0,
        }) ?? undefined,
    })
  })
  return out
}

function mapSupporting(
  raw: unknown,
  issues: JsonImportIssue[]
): UseCaseNestedSupportingFunctionImport[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({
      path: 'supportingFunctions',
      message: 'supportingFunctions must be an array.',
    })
    return null
  }
  const out: UseCaseNestedSupportingFunctionImport[] = []
  raw.forEach((entry, index) => {
    const path = `supportingFunctions[${index}]`
    const row = asRecord(entry)
    if (!row) {
      issues.push({ path, message: 'Each supportingFunctions entry must be an object.' })
      return
    }
    rejectKeys(row, SUPPORTING_KEYS, path, issues)
    const functionId = requireUuid(row, 'functionId', `${path}.functionId`, issues)
    if (!functionId) return
    out.push({ functionId })
  })
  return out
}
