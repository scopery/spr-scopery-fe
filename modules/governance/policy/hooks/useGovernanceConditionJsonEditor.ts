'use client'

import { useState } from 'react'
import { SAMPLE_GOVERNANCE_CONDITION } from '@/constants/governance.constants'
import type { GovernanceConditionGroup } from '@/modules/governance/policy'
import { ApiError } from '@/shared/lib/api-types'
import * as governanceApi from '../api/governance.api'
import { formatConditionsJson, parseConditionsJson } from '../model/governance-conditions'

interface UseGovernanceConditionJsonEditorParams {
  orgId?: string
  value: string
  onChange: (value: string) => void
  onValidGroup?: (group: GovernanceConditionGroup) => void
}

export function useGovernanceConditionJsonEditor({
  orgId,
  value,
  onChange,
  onValidGroup,
}: UseGovernanceConditionJsonEditorParams) {
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
      const backend = await governanceApi.validateGovernanceConditions(orgId, local.group)
      if (!backend.valid) {
        setValidationErrors(backend.errors.length > 0 ? backend.errors : ['Invalid conditions'])
        setValidationOk(null)
        return
      }
      setValidationErrors([])
      setValidationOk('Conditions are valid (confirmed by server).')
      onValidGroup?.(backend.normalized ?? local.group)
    } catch (err) {
      setValidationErrors([err instanceof ApiError ? err.message : 'Validation request failed'])
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
    onChange(
      formatConditionsJson(SAMPLE_GOVERNANCE_CONDITION as unknown as GovernanceConditionGroup)
    )
    setValidationErrors([])
    setValidationOk(null)
  }

  const handleChange = (nextValue: string) => {
    onChange(nextValue)
    setValidationOk(null)
  }

  return {
    validationErrors,
    validationOk,
    validating,
    runValidate,
    runFormat,
    loadSample,
    handleChange,
  }
}
