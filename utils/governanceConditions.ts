import {
  GOVERNANCE_CONDITION_FIELDS,
  GOVERNANCE_CONDITION_OPERATORS,
} from '@/constants/governance.constants'
import type { GovernanceConditionClause, GovernanceConditionGroup } from '@/types/governance'

const ALLOWED_FIELDS = new Set<string>(GOVERNANCE_CONDITION_FIELDS)
const ALLOWED_OPERATORS = new Set<string>(GOVERNANCE_CONDITION_OPERATORS)
const VALUELESS_OPERATORS = new Set(['exists', 'not_exists'])

export function operatorNeedsValue(operator: string): boolean {
  return !VALUELESS_OPERATORS.has(operator)
}

export function validateConditionClause(clause: GovernanceConditionClause): string[] {
  const errors: string[] = []
  if (!ALLOWED_FIELDS.has(clause.field)) {
    errors.push(`Unknown field: ${clause.field}`)
  }
  if (!ALLOWED_OPERATORS.has(clause.operator)) {
    errors.push(`Unknown operator: ${clause.operator}`)
  }
  if (operatorNeedsValue(clause.operator) && clause.value === undefined) {
    errors.push(`Value is required for operator ${clause.operator}`)
  }
  return errors
}

export function validateConditionGroup(group: GovernanceConditionGroup): string[] {
  const hasAll = Array.isArray(group.all) && group.all.length > 0
  const hasAny = Array.isArray(group.any) && group.any.length > 0
  const errors: string[] = []

  if (!hasAll && !hasAny) {
    errors.push('Condition group must include at least one clause in all or any')
  }
  if (hasAll && hasAny) {
    errors.push('Use either all or any, not both')
  }

  const clauses = hasAll ? group.all ?? [] : group.any ?? []
  for (const clause of clauses) {
    errors.push(...validateConditionClause(clause))
  }

  return errors
}

export function parseConditionsJson(json: string): {
  group?: GovernanceConditionGroup
  errors: string[]
} {
  try {
    const parsed = JSON.parse(json) as GovernanceConditionGroup
    const errors = validateConditionGroup(parsed)
    if (errors.length > 0) return { errors }
    return { group: parsed, errors: [] }
  } catch {
    return { errors: ['Invalid JSON syntax'] }
  }
}

export function formatConditionsJson(group: GovernanceConditionGroup): string {
  return JSON.stringify(group, null, 2)
}

export function summarizeConditionGroup(group: GovernanceConditionGroup): string {
  const mode = group.all?.length ? 'all' : 'any'
  const clauses = group.all ?? group.any ?? []
  if (clauses.length === 0) return 'No conditions'
  const parts = clauses.map((c) => {
    if (!operatorNeedsValue(c.operator)) {
      return `${c.field} ${c.operator}`
    }
    return `${c.field} ${c.operator} ${JSON.stringify(c.value)}`
  })
  return `${mode.toUpperCase()}(${parts.join(', ')})`
}

export function createEmptyConditionGroup(mode: 'all' | 'any' = 'all'): GovernanceConditionGroup {
  return mode === 'all'
    ? { all: [{ field: 'workflow_status', operator: 'equals', value: 'draft' }] }
    : { any: [{ field: 'workflow_status', operator: 'equals', value: 'draft' }] }
}
