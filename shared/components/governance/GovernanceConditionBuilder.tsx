'use client'

import { Button, Select } from '@/shared/ui'
import {
  GOVERNANCE_CONDITION_FIELDS,
  GOVERNANCE_CONDITION_OPERATORS,
} from '@/constants/governance.constants'
import type { GovernanceConditionClause, GovernanceConditionGroup } from '@/types/governance'
import { operatorNeedsValue } from '@/utils/governanceConditions'

interface GovernanceConditionBuilderProps {
  value: GovernanceConditionGroup
  onChange: (value: GovernanceConditionGroup) => void
  disabled?: boolean
}

export function GovernanceConditionBuilder({
  value,
  onChange,
  disabled = false,
}: GovernanceConditionBuilderProps) {
  const mode: 'all' | 'any' = value.all?.length ? 'all' : 'any'
  const clauses = value.all ?? value.any ?? []

  const updateClauses = (next: GovernanceConditionClause[]) => {
    onChange(mode === 'all' ? { all: next } : { any: next })
  }

  const updateClause = (index: number, patch: Partial<GovernanceConditionClause>) => {
    const next = clauses.map((clause, i) => (i === index ? { ...clause, ...patch } : clause))
    updateClauses(next)
  }

  const addClause = () => {
    updateClauses([
      ...clauses,
      { field: 'workflow_status', operator: 'equals', value: 'draft' },
    ])
  }

  const removeClause = (index: number) => {
    if (clauses.length <= 1) return
    updateClauses(clauses.filter((_, i) => i !== index))
  }

  const switchMode = (nextMode: 'all' | 'any') => {
    onChange(nextMode === 'all' ? { all: [...clauses] } : { any: [...clauses] })
  }

  return (
    <div className="space-y-3">
      <Select
        label="Match mode"
        value={mode}
        onValueChange={(v: string) => switchMode(v as 'all' | 'any')}
        disabled={disabled}
        options={[
          { value: 'all', label: 'ALL (every condition must match)' },
          { value: 'any', label: 'ANY (at least one condition must match)' },
        ]}
      />

      {clauses.map((clause, index) => (
        <div key={`clause-${index}`} className="grid gap-2 rounded border border-border p-3 md:grid-cols-4">
          <Select
            label="Field"
            value={clause.field}
            onValueChange={(v: string) => updateClause(index, { field: v })}
            disabled={disabled}
            options={GOVERNANCE_CONDITION_FIELDS.map((field) => ({ value: field, label: field }))}
          />
          <Select
            label="Operator"
            value={clause.operator}
            onValueChange={(v: string) => updateClause(index, { operator: v })}
            disabled={disabled}
            options={GOVERNANCE_CONDITION_OPERATORS.map((op) => ({ value: op, label: op }))}
          />
          {operatorNeedsValue(clause.operator) ? (
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Value (JSON)</span>
              <input
                className="w-full rounded border border-border p-2 font-mono text-xs"
                disabled={disabled}
                value={
                  typeof clause.value === 'string'
                    ? clause.value
                    : JSON.stringify(clause.value ?? '')
                }
                onChange={(e) => {
                  const raw = e.target.value
                  try {
                    updateClause(index, { value: JSON.parse(raw) as unknown })
                  } catch {
                    updateClause(index, { value: raw })
                  }
                }}
              />
            </label>
          ) : (
            <div className="text-sm text-muted-foreground md:col-span-2 self-end pb-2">
              No value required
            </div>
          )}
          <div className="md:col-span-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled || clauses.length <= 1}
              onClick={() => removeClause(index)}
            >
              Remove condition
            </Button>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" disabled={disabled} onClick={addClause}>
        Add condition
      </Button>
    </div>
  )
}
