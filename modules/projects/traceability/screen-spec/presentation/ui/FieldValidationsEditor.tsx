'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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

function readCondition(json: unknown): { field: string; op: string; value: string } {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { field: '', op: '', value: '' }
  }
  const o = json as Record<string, unknown>
  return {
    field: typeof o.fieldKey === 'string' ? o.fieldKey : '',
    op: typeof o.op === 'string' ? o.op : '',
    value: o.value == null ? '' : String(o.value),
  }
}

function formatJson(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export function FieldValidationsEditor({
  workspaceId,
  screenId,
  fieldId,
  modes,
  layout = 'split',
  onChanged,
}: {
  workspaceId: string
  screenId: string
  fieldId: string
  modes: ScreenMode[]
  /** `stack` for the screen inspector; `split` for the field drawer. */
  layout?: 'split' | 'stack'
  onChanged?: () => void
}) {
  const { items: ruleTypes, loading: typesLoading } = useValidationRuleTypes(workspaceId)
  const { items, error, createValidation, updateValidation, removeValidation } = useFieldValidations(
    workspaceId,
    screenId,
    fieldId
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pane, setPane] = useState<'view' | 'add' | 'edit'>('view')
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

  useEffect(() => {
    if (selectedId && items.some((rule) => rule.id === selectedId)) return
    setSelectedId(items[0]?.id ?? null)
    setPane('view')
  }, [items, selectedId])

  const onRuleTypeChange = (id: string) => {
    setRuleTypeId(id)
    const next = ruleTypes.find((t) => t.id === id)
    setParamValues(paramsToFormValues(parseParamSchema(next?.paramSchemaJson), null))
    if (next?.defaultMessage && !errorMessage) setErrorMessage(next.defaultMessage)
  }

  const resetForm = () => {
    setRuleTypeId('')
    setModeId('all')
    setErrorMessage('')
    setApplyField('')
    setApplyOp('')
    setApplyValue('')
    setParamValues({})
    setFormError(null)
  }

  const fillFormFromRule = (rule: ScreenFieldValidation) => {
    const typeId = rule.ruleTypeId ?? ruleTypes.find((t) => t.code === rule.ruleTypeCode)?.id ?? ''
    const next = ruleTypes.find((t) => t.id === typeId)
    setRuleTypeId(typeId)
    setParamValues(paramsToFormValues(parseParamSchema(next?.paramSchemaJson), rule.ruleParamJson))
    setModeId(rule.modeId ?? 'all')
    setErrorMessage(rule.errorMessage ?? '')
    const cond = readCondition(rule.conditionJson)
    setApplyField(cond.field)
    setApplyOp(cond.op)
    setApplyValue(cond.value)
    setFormError(null)
  }

  const buildBody = () => ({
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

  const handleSave = async () => {
    if (!ruleTypeId) return
    setSaving(true)
    setFormError(null)
    try {
      if (pane === 'edit' && selectedRule) {
        await updateValidation(selectedRule.id, buildBody())
      } else {
        await createValidation(buildBody())
      }
      resetForm()
      setPane('view')
      onChanged?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    await removeValidation(id)
    setPane('view')
    onChanged?.()
  }

  const form = (
    <Stack direction="vertical" spacing="sm">
      <Typography weight="medium" variant="small">
        {pane === 'edit' ? 'Edit validation rule' : 'New validation rule'}
      </Typography>
      <div>
        <Typography variant="caption" tone="muted" className="mb-1 block">
          Rule type
        </Typography>
        <Select
          value={ruleTypeId || undefined}
          onValueChange={onRuleTypeChange}
          options={ruleTypes.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }))}
          placeholder={typesLoading ? 'Loading rules…' : 'Choose a rule'}
          disabled={typesLoading || ruleTypes.length === 0}
        />
        {!typesLoading && ruleTypes.length === 0 ? (
          <Typography variant="caption" tone="muted" className="mt-1 block">
            No validation rule types in this workspace.
          </Typography>
        ) : null}
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
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!ruleTypeId || saving} loading={saving} onClick={() => void handleSave()}>
          {pane === 'edit' ? 'Save rule' : 'Add rule'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={saving}
          onClick={() => {
            resetForm()
            setPane('view')
          }}
        >
          Cancel
        </Button>
      </div>
    </Stack>
  )

  const ruleDetail = selectedRule ? (
    <Stack direction="vertical" spacing="sm">
      <Typography weight="medium">{selectedRule.ruleTypeCode || 'Rule'}</Typography>
      <div>
        <Typography variant="caption" tone="muted" className="mb-1 block">
          Mode
        </Typography>
        <Typography variant="small">{selectedRule.modeCode ?? 'All modes'}</Typography>
      </div>
      {selectedRule.errorMessage ? (
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Error message
          </Typography>
          <Typography variant="small">{selectedRule.errorMessage}</Typography>
        </div>
      ) : null}
      {selectedRule.ruleParamJson != null ? (
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Parameters
          </Typography>
          <Typography variant="caption" className="whitespace-pre-wrap break-words font-mono">
            {formatJson(selectedRule.ruleParamJson)}
          </Typography>
        </div>
      ) : null}
      {selectedRule.conditionJson != null ? (
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Apply when
          </Typography>
          <Typography variant="caption" className="whitespace-pre-wrap break-words font-mono">
            {formatJson(selectedRule.conditionJson)}
          </Typography>
        </div>
      ) : null}
    </Stack>
  ) : (
    <Typography variant="small" tone="muted">
      {items.length === 0 ? 'No rules yet. Use Add to create one.' : 'Select a rule to review.'}
    </Typography>
  )

  const ruleList = (
    <ul className="divide-y divide-neutral-100">
      {items.map((rule) => {
        const active = selectedId === rule.id && pane === 'view'
        return (
          <li key={rule.id}>
            <button
              type="button"
              onClick={() => {
                setSelectedId(rule.id)
                setPane('view')
              }}
              className={cn(
                'w-full px-3 py-2 text-left',
                active ? 'bg-white' : 'hover:bg-white'
              )}
            >
              <Typography variant="small">{rule.ruleTypeCode || 'Rule'}</Typography>
              <Typography variant="caption" tone="muted" className="block">
                {ruleSummary(rule)}
              </Typography>
            </button>
          </li>
        )
      })}
    </ul>
  )

  const toolbar = (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          resetForm()
          setPane('add')
        }}
      >
        <Plus size={14} className="mr-1 inline" />
        Add
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!selectedRule || pane !== 'view'}
        onClick={() => {
          if (!selectedRule) return
          fillFormFromRule(selectedRule)
          setPane('edit')
        }}
      >
        <Pencil size={14} className="mr-1 inline" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!selectedRule || pane === 'add'}
        onClick={() => selectedRule && void handleRemove(selectedRule.id)}
      >
        <Trash2 size={14} className="mr-1 inline" />
        Delete
      </Button>
    </div>
  )

  const detail = pane === 'view' ? ruleDetail : form

  return (
    <div className="min-w-0 space-y-3">
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      {toolbar}
      <div
        className={cn(
          'flex min-w-0 border border-neutral-200',
          layout === 'split' ? 'min-h-[280px]' : 'min-h-[240px]'
        )}
      >
        <aside className="flex w-40 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
          <Typography variant="caption" tone="muted" className="border-b border-neutral-200 px-3 py-2">
            Rules
          </Typography>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <Typography variant="caption" tone="muted" className="px-3 py-2">
                No rules yet.
              </Typography>
            ) : (
              ruleList
            )}
          </div>
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto p-md">{detail}</div>
      </div>
    </div>
  )
}
