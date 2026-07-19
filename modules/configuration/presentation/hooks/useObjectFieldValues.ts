'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as customFieldsApi from '../../infrastructure/api/custom-fields.api'
import * as fieldOptionsApi from '../../infrastructure/api/field-options.api'
import * as fieldValuesApi from '../../infrastructure/api/field-values.api'
import {
  getValueKeyForFieldType,
  isCustomFieldActive,
  isSelectFieldType,
} from '../../domain/rules/configuration.rules'
import type { CustomFieldDefinition } from '../../domain/model/custom-field'
import type { CustomFieldOption } from '../../domain/model/field-option'
import type { CustomFieldValue, CustomFieldValueInput } from '../../domain/model/field-value'

function extractUiValue(
  definition: CustomFieldDefinition,
  stored: CustomFieldValue | undefined
): unknown {
  if (!stored) return null
  const key = getValueKeyForFieldType(definition.fieldType)
  return stored[key as keyof CustomFieldValue] ?? null
}

function toValueInput(
  definition: CustomFieldDefinition,
  uiValue: unknown
): CustomFieldValueInput {
  const key = getValueKeyForFieldType(definition.fieldType)
  return {
    fieldId: definition.id,
    [key]: uiValue ?? null,
  }
}

/** Load/save custom field values for a business object (project, task, …). */
export function useObjectFieldValues(
  workspaceId: string | null,
  objectType: string | null,
  targetId: string | null
) {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([])
  const [storedValues, setStoredValues] = useState<CustomFieldValue[]>([])
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({})
  const [optionsByFieldId, setOptionsByFieldId] = useState<Record<string, CustomFieldOption[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !objectType || !targetId) return
    setLoading(true)
    setError(null)
    try {
      const [allFields, values] = await Promise.all([
        customFieldsApi.listCustomFields(workspaceId),
        fieldValuesApi.getFieldValues(workspaceId, objectType, targetId),
      ])
      const defs = allFields.filter(
        (f) => f.objectTypeCode === objectType && isCustomFieldActive(f)
      )
      setDefinitions(defs)
      setStoredValues(values)

      const draft: Record<string, unknown> = {}
      for (const def of defs) {
        const stored = values.find((v) => v.customFieldDefinitionId === def.id)
        draft[def.id] = extractUiValue(def, stored)
      }
      setDraftValues(draft)

      const selectDefs = defs.filter((d) => isSelectFieldType(d.fieldType))
      const optionEntries = await Promise.all(
        selectDefs.map(async (def) => {
          try {
            const options = await fieldOptionsApi.listFieldOptions(workspaceId, def.id)
            return [def.id, options] as const
          } catch {
            return [def.id, [] as CustomFieldOption[]] as const
          }
        })
      )
      setOptionsByFieldId(Object.fromEntries(optionEntries))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom fields')
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, objectType, targetId])

  useEffect(() => {
    void load()
  }, [load])

  const setFieldValue = useCallback((fieldId: string, value: unknown) => {
    setDraftValues((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  const save = useCallback(async () => {
    if (!workspaceId || !objectType || !targetId) return
    setSaving(true)
    try {
      const values = definitions.map((def) => toValueInput(def, draftValues[def.id]))
      const saved = await fieldValuesApi.upsertFieldValues(workspaceId, {
        objectType,
        targetId,
        values,
      })
      setStoredValues(saved)
      toast.success('Custom fields saved')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    } finally {
      setSaving(false)
    }
  }, [workspaceId, objectType, targetId, definitions, draftValues, load])

  return {
    definitions,
    storedValues,
    draftValues,
    optionsByFieldId,
    loading,
    saving,
    error,
    setFieldValue,
    save,
    refetch: load,
  }
}
