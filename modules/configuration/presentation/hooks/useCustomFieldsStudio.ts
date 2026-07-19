'use client'

import { useCallback, useEffect, useState } from 'react'
import * as objectTypesApi from '../../infrastructure/api/object-types.api'
import * as customFieldsApi from '../../infrastructure/api/custom-fields.api'
import * as fieldOptionsApi from '../../infrastructure/api/field-options.api'
import * as fieldVisibilityApi from '../../infrastructure/api/field-visibility.api'
import * as validationRulesApi from '../../infrastructure/api/validation-rules.api'
import type { ObjectType } from '../../domain/model/object-type'
import type { CreateCustomFieldPayload, CustomFieldDefinition } from '../../domain/model/custom-field'
import type { CreateFieldOptionPayload, CustomFieldOption } from '../../domain/model/field-option'
import type { SetFieldVisibilityPayload, FieldVisibilityPolicy } from '../../domain/model/field-visibility'
import type {
  CreateValidationRulePayload,
  CustomFieldValidationRule,
} from '../../domain/model/validation-rule'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useCustomFieldsStudio(workspaceId: string | null) {
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const [fields, setFields] = useState<CustomFieldDefinition[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [options, setOptions] = useState<CustomFieldOption[]>([])
  const [visibilityPolicies, setVisibilityPolicies] = useState<FieldVisibilityPolicy[]>([])
  const [validationRules, setValidationRules] = useState<CustomFieldValidationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingField, setCreatingField] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [types, fieldList] = await Promise.all([
        objectTypesApi.listObjectTypes(),
        customFieldsApi.listCustomFields(workspaceId),
      ])
      setObjectTypes(types)
      setFields(fieldList)
      setSelectedFieldId((prev) => {
        if (prev && fieldList.some((f) => f.id === prev)) return prev
        return fieldList[0]?.id ?? null
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load custom fields'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const loadFieldDetail = useCallback(
    async (fieldId: string) => {
      if (!workspaceId) return
      setDetailLoading(true)
      try {
        const [opts, policies, rules] = await Promise.all([
          fieldOptionsApi.listFieldOptions(workspaceId, fieldId),
          fieldVisibilityApi.listFieldVisibilityPolicies(workspaceId, fieldId),
          validationRulesApi.listValidationRules(workspaceId, fieldId),
        ])
        setOptions(opts)
        setVisibilityPolicies(policies)
        setValidationRules(rules)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setDetailLoading(false)
      }
    },
    [workspaceId]
  )

  useEffect(() => {
    if (selectedFieldId) {
      void loadFieldDetail(selectedFieldId)
    } else {
      setOptions([])
      setVisibilityPolicies([])
      setValidationRules([])
    }
  }, [selectedFieldId, loadFieldDetail])

  const createField = useCallback(
    async (payload: CreateCustomFieldPayload) => {
      if (!workspaceId) return
      setCreatingField(true)
      try {
        const created = await customFieldsApi.createCustomField(workspaceId, payload)
        toast.success('Custom field created')
        await load()
        setSelectedFieldId(created.id)
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreatingField(false)
      }
    },
    [workspaceId, load]
  )

  const createOption = useCallback(
    async (fieldId: string, payload: CreateFieldOptionPayload) => {
      if (!workspaceId) return
      try {
        await fieldOptionsApi.createFieldOption(workspaceId, fieldId, payload)
        toast.success('Option added')
        await loadFieldDetail(fieldId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, loadFieldDetail]
  )

  const archiveOption = useCallback(
    async (fieldId: string, optionId: string) => {
      if (!workspaceId) return
      try {
        await fieldOptionsApi.archiveFieldOption(workspaceId, fieldId, optionId)
        toast.success('Option archived')
        await loadFieldDetail(fieldId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, loadFieldDetail]
  )

  const setVisibility = useCallback(
    async (fieldId: string, payload: SetFieldVisibilityPayload) => {
      if (!workspaceId) return
      try {
        await fieldVisibilityApi.setFieldVisibilityPolicy(workspaceId, fieldId, payload)
        toast.success('Visibility updated')
        await loadFieldDetail(fieldId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, loadFieldDetail]
  )

  const createValidationRule = useCallback(
    async (fieldId: string, payload: CreateValidationRulePayload) => {
      if (!workspaceId) return
      try {
        await validationRulesApi.createValidationRule(workspaceId, fieldId, payload)
        toast.success('Validation rule added')
        await loadFieldDetail(fieldId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, loadFieldDetail]
  )

  const deleteValidationRule = useCallback(
    async (fieldId: string, ruleId: string) => {
      if (!workspaceId) return
      try {
        await validationRulesApi.deleteValidationRule(workspaceId, ruleId)
        toast.success('Validation rule removed')
        await loadFieldDetail(fieldId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, loadFieldDetail]
  )

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  return {
    objectTypes,
    fields,
    selectedField,
    selectedFieldId,
    setSelectedFieldId,
    options,
    visibilityPolicies,
    validationRules,
    loading,
    detailLoading,
    error,
    creatingField,
    createField,
    createOption,
    archiveOption,
    setVisibility,
    createValidationRule,
    deleteValidationRule,
    refetch: load,
  }
}
