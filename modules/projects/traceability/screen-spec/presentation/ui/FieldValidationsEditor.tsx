'use client'

import { useMemo, useState } from 'react'
import { Button, Input, Select, Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  coerceRuleParamJson,
  paramsToFormValues,
  parseParamSchema,
} from '../../domain/rules/validation-params.rules'
import { useFieldValidations, useValidationRuleTypes } from '../hooks/useFieldValidations'
import type { ScreenFieldValidation, ScreenMode } from '../../domain/model/screen-spec'

function ruleSummary(rule: ScreenFieldValidation): string {
  const mode = rule.modeCode ?? 'All modes'
  return rule.errorMessage ? `${mode} · ${rule.errorMessage}` : mode
}

export function FieldValidationsEditor({
  workspaceId,
  screenId,
  fieldId,
  modes,
  onChanged,
}: {
  workspaceId: string
  screenId: string
  fieldId: string
  modes: ScreenMode[]
  onChanged?: () => void
}) {
  const { items: ruleTypes } = useValidationRuleTypes(workspaceId)
  const { items, error, createValidation, removeValidation } = useFieldValidations(
    workspaceId,
    screenId,
    fieldId
  )
  const [selectedId, setSelectedId] = useState<string | 'add'>('add')
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
  const selectedRule = items.find((rule) => rule.id === selectedId) ?? null

  const onRuleTypeChange = (id: string) => {
    setRuleTypeId(id)
    const next = ruleTypes.find((t) => t.id === id)
    setParamValues(paramsToFormValues(parseParamSchema(next?.paramSchemaJson), null))
    if (next?.defaultMessage && !errorMessage) setErrorMessage(next.defaultMessage)
  }

  const resetAddForm = () => {
    setRuleTypeId('')
    setModeId('all')
    setErrorMessage('')
    setApplyField('')
    setApplyOp('')
    setApplyValue('')
    setParamValues({})
    setFormError(null)
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
      resetAddForm()
      onChanged?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add rule')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    await removeValidation(id)
    setSelectedId('add')
    onChanged?.()
  }

  return (
    <div className="flex min-h-[280px] border border-neutral-200">
      <aside className="flex w-52 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
        <button
          type="button"
          onClick={() => {
            setSelectedId('add')
            resetAddForm()
          }}
          className={cn(
            'border-b border-neutral-200 px-3 py-2 text-left text-sm',
            selectedId === 'add' ? 'bg-white text-primary' : 'text-neutral-700 hover:bg-white'
          )}
        >
          Add rule
        </button>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {items.map((rule) => {
            const active = selectedId === rule.id
            return (
              <li key={rule.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(rule.id)}
                  className={cn(
                    'w-full border-b border-neutral-100 px-3 py-2 text-left',
                    active ? 'bg-white' : 'hover:bg-white'
                  )}
                >
                  <Typography variant="small">{rule.ruleTypeCode}</Typography>
                  <Typography variant="caption" tone="muted" className="block">
                    {ruleSummary(rule)}
                  </Typography>
                </button>
              </li>
            )
          })}
        </ul>
        {items.length === 0 ? (
          <Typography variant="caption" tone="muted" className="px-3 py-2">
            No rules yet.
          </Typography>
        ) : null}
      </aside>

      <div className="min-w-0 flex-1 p-md">
        {error ? (
          <Typography tone="error" variant="small">
            {error}
          </Typography>
        ) : null}

        {selectedRule ? (
          <Stack direction="vertical" spacing="sm">
            <Typography weight="medium">{selectedRule.ruleTypeCode}</Typography>
            <Typography variant="small" tone="muted">
              {ruleSummary(selectedRule)}
            </Typography>
            {selectedRule.ruleParamJson != null ? (
              <Typography variant="caption" className="whitespace-pre-wrap break-words font-mono">
                {typeof selectedRule.ruleParamJson === 'string'
                  ? selectedRule.ruleParamJson
                  : JSON.stringify(selectedRule.ruleParamJson, null, 2)}
              </Typography>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => void handleRemove(selectedRule.id)}>
              Remove rule
            </Button>
          </Stack>
        ) : (
          <Stack direction="vertical" spacing="sm">
            <Typography weight="medium" variant="small">
              New validation rule
            </Typography>
            <div>
              <Typography variant="caption" tone="muted" className="mb-1 block">
                Rule type
              </Typography>
              <Select
                value={ruleTypeId}
                onValueChange={onRuleTypeChange}
                options={ruleTypes.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }))}
                placeholder="Choose a rule"
              />
            </div>
            <div>
              <Typography variant="caption" tone="muted" className="mb-1 block">
                Screen mode
              </Typography>
              <Select
                value={modeId}
                onValueChange={setModeId}
                options={[
                  { value: 'all', label: 'All modes' },
                  ...modes.map((m) => ({ value: m.id, label: m.name })),
                ]}
                placeholder="All modes"
              />
            </div>
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
              placeholder="Error message shown to the user"
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
            {formError ? (
              <Typography tone="error" variant="small">
                {formError}
              </Typography>
            ) : null}
            <Button size="sm" disabled={!ruleTypeId || saving} loading={saving} onClick={() => void handleAdd()}>
              Add rule
            </Button>
          </Stack>
        )}
      </div>
    </div>
  )
}
