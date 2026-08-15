'use client'

import { useMemo } from 'react'
import { PageSkeleton, Typography } from '@/shared/ui'
import { coerceRuleParamJson, parseParamSchema } from '../../domain/rules/validation-params.rules'
import { useScreenValidations, useValidationRuleTypes } from '../hooks/useFieldValidations'
import { ScreenStructureEditor, type StructureOption } from '../../../ui/ScreenStructureEditor'
import type { ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreenField } from '../../../model/application-registry'

const NONE = 'none'

function optionalId(value: string): string | null {
  const next = value.trim()
  return !next || next === NONE ? null : next
}

function stringifyParam(json: unknown): string {
  if (json == null || json === '') return ''
  if (typeof json === 'string') return json
  try {
    return JSON.stringify(json)
  } catch {
    return ''
  }
}

function conditionParts(json: unknown): { field: string; op: string; value: string } {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { field: '', op: '', value: '' }
  }
  const row = json as Record<string, unknown>
  return {
    field: typeof row.fieldKey === 'string' ? row.fieldKey : '',
    op: typeof row.op === 'string' ? row.op : '',
    value: row.value == null ? '' : String(row.value),
  }
}

export function ScreenValidationsPanel({
  workspaceId,
  screenId,
  modes,
  fields,
}: {
  workspaceId: string
  screenId: string
  modes: ScreenMode[]
  fields: RegistryScreenField[]
}) {
  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields])
  const { items: ruleTypes } = useValidationRuleTypes(workspaceId)
  const { items, loading, error, createValidation, updateValidation, removeValidation } =
    useScreenValidations(workspaceId, screenId, fieldIds)

  const fieldOptions: StructureOption[] = useMemo(
    () => fields.map((f) => ({ value: f.id, label: `${f.fieldKey} · ${f.label}` })),
    [fields]
  )
  const ruleOptions: StructureOption[] = useMemo(
    () => ruleTypes.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` })),
    [ruleTypes]
  )
  const modeOptions: StructureOption[] = useMemo(
    () => [
      { value: NONE, label: 'All modes' },
      ...modes.map((m) => ({ value: m.id, label: `${m.modeCode} · ${m.name}` })),
    ],
    [modes]
  )

  const columns = useMemo(
    () => [
      {
        key: 'fieldId',
        label: 'Field',
        required: true,
        options: fieldOptions,
        lockedOnExisting: true,
      },
      {
        key: 'ruleTypeId',
        label: 'Rule',
        required: true,
        options: ruleOptions,
        lockedOnExisting: true,
      },
      { key: 'modeId', label: 'Mode', options: modeOptions },
      { key: 'errorMessage', label: 'Error message', placeholder: 'Cannot be empty' },
      { key: 'params', label: 'Params JSON', placeholder: '{"maxLength":255}' },
      { key: 'applyField', label: 'Apply when field', placeholder: 'status' },
      { key: 'applyOp', label: 'Apply op', placeholder: 'EQUALS' },
      { key: 'applyValue', label: 'Apply value', placeholder: 'ACTIVE' },
    ],
    [fieldOptions, ruleOptions, modeOptions]
  )

  const toBody = (values: Record<string, string>) => {
    const ruleType = ruleTypes.find((t) => t.id === values.ruleTypeId)
    const schema = parseParamSchema(ruleType?.paramSchemaJson)
    const paramsRaw = values.params.trim()
    let ruleParamJson: unknown = null
    if (schema) {
      if (paramsRaw.startsWith('{')) {
        try {
          ruleParamJson = JSON.parse(paramsRaw) as unknown
        } catch {
          ruleParamJson = coerceRuleParamJson(schema, {})
        }
      } else {
        ruleParamJson = coerceRuleParamJson(schema, {})
      }
    }
    const applyField = values.applyField.trim()
    return {
      ruleTypeId: values.ruleTypeId,
      modeId: optionalId(values.modeId),
      ruleParamJson,
      conditionJson: applyField
        ? {
            fieldKey: applyField,
            op: values.applyOp.trim() || 'IS_NOT_EMPTY',
            ...(values.applyValue.trim() ? { value: values.applyValue.trim() } : {}),
          }
        : null,
      errorMessage: values.errorMessage.trim() || null,
    }
  }

  return (
    <div className="space-y-2">
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      {fields.length === 0 ? (
        <Typography variant="small" tone="muted">
          Add fields first, then add validation rules here.
        </Typography>
      ) : null}
      <ScreenStructureEditor
        columns={columns}
        items={items.map((item) => {
          const when = conditionParts(item.conditionJson)
          const ruleTypeId =
            item.ruleTypeId ||
            ruleTypes.find((t) => t.code === item.ruleTypeCode)?.id ||
            item.ruleTypeCode
          return {
            id: item.id,
            values: {
              fieldId: item.fieldId,
              ruleTypeId,
              modeId: item.modeId ?? NONE,
              errorMessage: item.errorMessage ?? '',
              params: stringifyParam(item.ruleParamJson),
              applyField: when.field,
              applyOp: when.op,
              applyValue: when.value,
            },
          }
        })}
        emptyLabel="No validation rules yet."
        addTitle="Add validations"
        editTitle="Edit validations"
        itemLabel="validation"
        onCreate={async (values) => {
          await createValidation(values.fieldId, toBody(values))
        }}
        onUpdate={async (id, values) => {
          await updateValidation(values.fieldId, id, toBody(values))
        }}
        onDelete={async (id) => {
          const row = items.find((item) => item.id === id)
          if (!row) return
          await removeValidation(row.fieldId, id)
        }}
      />
    </div>
  )
}
