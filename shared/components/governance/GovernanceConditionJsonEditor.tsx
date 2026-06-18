'use client'

import { useState } from 'react'
import { Button, Typography } from '@/shared/ui'
import { SAMPLE_GOVERNANCE_CONDITION } from '@/constants/governance.constants'
import * as governanceService from '@/services/governance.service'
import type { GovernanceConditionGroup } from '@/types/governance'
import { ApiError } from '@/types/api'
import { formatConditionsJson, parseConditionsJson } from '@/utils/governanceConditions'

interface GovernanceConditionJsonEditorProps {
  orgId?: string
  value: string
  onChange: (value: string) => void
  onValidGroup?: (group: GovernanceConditionGroup) => void
  disabled?: boolean
}

export function GovernanceConditionJsonEditor({
  orgId,
  value,
  onChange,
  onValidGroup,
  disabled = false,
}: GovernanceConditionJsonEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationOk, setValidationOk] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

  const runValidate = async () => {
    const local = parseConditionsJson(value)
    if (local.errors.length > 0 || !local.group) {
      setValidationErrors(local.errors.length > 0 ? local.errors : ['Invalid JSON syntax'])
      setValidationOk(null)
      return
    }

    if (!orgId) {
      setValidationErrors([])
      setValidationOk('Conditions are valid.')
      onValidGroup?.(local.group)
      return
    }

    setValidating(true)
    try {
      const backend = await governanceService.validateGovernanceConditions(orgId, local.group)
      if (!backend.valid) {
        setValidationErrors(backend.errors.length > 0 ? backend.errors : ['Invalid conditions'])
        setValidationOk(null)
        return
      }
      setValidationErrors([])
      setValidationOk('Conditions are valid (confirmed by server).')
      onValidGroup?.(backend.normalized ?? local.group)
    } catch (err) {
      setValidationErrors([
        err instanceof ApiError ? err.message : 'Validation request failed',
      ])
      setValidationOk(null)
    } finally {
      setValidating(false)
    }
  }

  const runFormat = () => {
    const result = parseConditionsJson(value)
    if (result.group) {
      onChange(formatConditionsJson(result.group))
      setValidationErrors([])
      setValidationOk('Formatted.')
    } else {
      setValidationErrors(result.errors.length ? result.errors : ['Invalid JSON'])
      setValidationOk(null)
    }
  }

  const loadSample = () => {
    onChange(formatConditionsJson(SAMPLE_GOVERNANCE_CONDITION as unknown as GovernanceConditionGroup))
    setValidationErrors([])
    setValidationOk(null)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Conditions (JSON)</span>
        <textarea
          className="min-h-32 w-full rounded border border-border p-2 font-mono text-xs"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setValidationOk(null)
          }}
          disabled={disabled}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={disabled} onClick={runFormat}>
          Format JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          loading={validating}
          onClick={() => void runValidate()}
        >
          Validate
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={loadSample}>
          Load sample
        </Button>
      </div>
      <Typography variant="small" tone="muted">
        Allowed fields: actor_role, workflow_status, readiness_status, partner_access, export_format,
        package_format, selected_document_count, and others from governance metadata.
      </Typography>
      {validationOk ? (
        <Typography variant="small" className="text-green-700">
          {validationOk}
        </Typography>
      ) : null}
      {validationErrors.length > 0 ? (
        <ul className="list-disc pl-4 text-sm text-destructive">
          {validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
