'use client'

import { useMemo, useState } from 'react'
import { Button, Input, Select, Stack, Typography } from '@/shared/ui'
import {
  coerceRuleParamJson,
  paramsToFormValues,
  parseParamSchema,
} from '../../domain/rules/validation-params.rules'
import { useFieldValidations, useValidationRuleTypes } from '../hooks/useFieldValidations'
import type { ScreenMode } from '../../domain/model/screen-spec'

export function FieldValidationsEditor({
  workspaceId,
  screenId,
  fieldId,
  modes,
}: {
  workspaceId: string
  screenId: string
  fieldId: string
  modes: ScreenMode[]
}) {
  const { items: ruleTypes } = useValidationRuleTypes(workspaceId)
  const { items, error, createValidation, removeValidation } = useFieldValidations(
    workspaceId,
    screenId,
    fieldId
  )
  const [ruleTypeId, setRuleTypeId] = useState('')
  const [modeId, setModeId] = useState('all')
  const [errorMessage, setErrorMessage] = useState('')
  const [applyField, setApplyField] = useState('')
  const [applyOp, setApplyOp] = useState('')
  const [applyValue, setApplyValue] = useState('')
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedType = ruleTypes.find((t) => t.id === ruleTypeId)
  const schema = useMemo(() => parseParamSchema(selectedType?.paramSchemaJson), [selectedType])

  const onRuleTypeChange = (id: string) => {
    setRuleTypeId(id)
    const next = ruleTypes.find((t) => t.id === id)
    setParamValues(paramsToFormValues(parseParamSchema(next?.paramSchemaJson), null))
    if (next?.defaultMessage && !errorMessage) setErrorMessage(next.defaultMessage)
  }

  const handleAdd = async () => {
    if (!ruleTypeId) return
    setSaving(true)
    setFormError(null)
    try {
      await createValidation({
        ruleTypeId,
        modeId: modeId === 'all' || !modeId ? null : modeId,
        ruleParamJson: coerceRuleParamJson(schema, paramValues),
        conditionJson: applyField.trim()
          ? {
              fieldKey: applyField.trim(),
              op: applyOp.trim() || 'IS_NOT_EMPTY',
              ...(applyValue.trim() ? { value: applyValue.trim() } : {}),
            }
          : null,
        errorMessage: errorMessage.trim() || null,
      })
      setRuleTypeId('')
      setModeId('all')
      setErrorMessage('')
      setApplyField('')
      setApplyOp('')
      setApplyValue('')
      setParamValues({})
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add rule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack direction="vertical" spacing="sm">
      <Typography weight="medium" variant="small">
        Validations
      </Typography>
      {error ? <Typography tone="error" variant="small">{error}</Typography> : null}
      {items.length === 0 ? (
        <Typography variant="small" tone="muted">
          No validation rules yet.
        </Typography>
      ) : (
        <ul className="space-y-2">
          {items.map((rule) => (
            <li key={rule.id} className="flex items-start justify-between gap-2 border border-neutral-200 px-3 py-2">
              <div className="min-w-0">
                <Typography variant="small">{rule.ruleTypeCode}</Typography>
                <Typography variant="caption" tone="muted">
                  {rule.modeCode ?? 'All modes'}
                  {rule.errorMessage ? ` · ${rule.errorMessage}` : ''}
                </Typography>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void removeValidation(rule.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Select
        value={ruleTypeId}
        onValueChange={onRuleTypeChange}
        options={ruleTypes.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }))}
        placeholder="Rule type"
      />
      <Select
        value={modeId}
        onValueChange={setModeId}
        options={[
          { value: 'all', label: 'All modes' },
          ...modes.map((m) => ({ value: m.id, label: m.name })),
        ]}
        placeholder="All modes"
      />
      {schema
        ? Object.entries(schema).map(([key, type]) => (
            <Input
              key={key}
              fullWidth
              size="sm"
              value={paramValues[key] ?? ''}
              onChange={(e) => setParamValues((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={
                key === 'values' || key === 'mimeTypes'
                  ? `${key} (comma-separated)`
                  : `${key}${type === 'integer' ? ' (number)' : ''}`
              }
            />
          ))
        : null}
      <Input
        fullWidth
        size="sm"
        value={errorMessage}
        onChange={(e) => setErrorMessage(e.target.value)}
        placeholder="Error message"
      />
      <Typography variant="caption" tone="muted">
        Apply when (optional)
      </Typography>
      <Input
        fullWidth
        size="sm"
        value={applyField}
        onChange={(e) => setApplyField(e.target.value)}
        placeholder="Other field key"
      />
      <Input
        fullWidth
        size="sm"
        value={applyOp}
        onChange={(e) => setApplyOp(e.target.value)}
        placeholder="Op e.g. EQUALS"
      />
      <Input
        fullWidth
        size="sm"
        value={applyValue}
        onChange={(e) => setApplyValue(e.target.value)}
        placeholder="Value"
      />
      {formError ? <Typography tone="error" variant="small">{formError}</Typography> : null}
      <Button size="sm" disabled={!ruleTypeId || saving} loading={saving} onClick={() => void handleAdd()}>
        Add rule
      </Button>
    </Stack>
  )
}
