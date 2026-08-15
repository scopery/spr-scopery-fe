'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Input, Modal, Select, Stack, Typography } from '@/shared/ui'
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
  onChanged,
}: {
  workspaceId: string
  screenId: string
  fieldId: string
  modes: ScreenMode[]
  /** @deprecated Kept so existing callers do not break. Forms now open in a modal. */
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
  const [pane, setPane] = useState<'closed' | 'view' | 'add' | 'edit'>('closed')
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
  const modalOpen = pane !== 'closed'

  useEffect(() => {
    if (selectedId && items.some((rule) => rule.id === selectedId)) return
    setSelectedId(items[0]?.id ?? null)
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

  const closeModal = () => {
    resetForm()
    setPane('closed')
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
      closeModal()
      onChanged?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    await removeValidation(id)
    closeModal()
    onChanged?.()
  }

  const form = (
    <Stack direction="vertical" spacing="md">
      <div>
        <Typography variant="caption" tone="muted" className="mb-1.5 block">
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
        <Typography variant="caption" tone="muted" className="mb-1.5 block">
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
              size="md"
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
        size="md"
        value={errorMessage}
        onChange={(e) => setErrorMessage(e.target.value)}
        placeholder="Error message shown to the user"
      />
      <Typography variant="caption" tone="muted">
        Apply when (optional)
      </Typography>
      <Input
        fullWidth
        size="md"
        value={applyField}
        onChange={(e) => setApplyField(e.target.value)}
        placeholder="Other field key"
      />
      <Input
        fullWidth
        size="md"
        value={applyOp}
        onChange={(e) => setApplyOp(e.target.value)}
        placeholder="Op e.g. EQUALS"
      />
      <Input
        fullWidth
        size="md"
        value={applyValue}
        onChange={(e) => setApplyValue(e.target.value)}
        placeholder="Value"
      />
      {formError ? (
        <Typography tone="error" variant="small">
          {formError}
        </Typography>
      ) : null}
    </Stack>
  )

  const ruleDetail = selectedRule ? (
    <div className="space-y-5">
      <div>
        <Typography variant="caption" tone="muted" className="mb-1.5 block">
          Rule
        </Typography>
        <Typography variant="small">{selectedRule.ruleTypeCode || 'Rule'}</Typography>
      </div>
      <div>
        <Typography variant="caption" tone="muted" className="mb-1.5 block">
          Mode
        </Typography>
        <Typography variant="small">{selectedRule.modeCode ?? 'All modes'}</Typography>
      </div>
      {selectedRule.errorMessage ? (
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Error message
          </Typography>
          <Typography variant="small">{selectedRule.errorMessage}</Typography>
        </div>
      ) : null}
      {selectedRule.ruleParamJson != null ? (
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Parameters
          </Typography>
          <Typography variant="caption" className="whitespace-pre-wrap break-words font-mono">
            {formatJson(selectedRule.ruleParamJson)}
          </Typography>
        </div>
      ) : null}
      {selectedRule.conditionJson != null ? (
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Apply when
          </Typography>
          <Typography variant="caption" className="whitespace-pre-wrap break-words font-mono">
            {formatJson(selectedRule.conditionJson)}
          </Typography>
        </div>
      ) : null}
    </div>
  ) : null

  return (
    <div className="min-w-0 space-y-3">
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
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
          disabled={!selectedRule}
          onClick={() => setPane('view')}
        >
          View
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!selectedRule}
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
          disabled={!selectedRule}
          onClick={() => selectedRule && void handleRemove(selectedRule.id)}
        >
          <Trash2 size={14} className="mr-1 inline" />
          Delete
        </Button>
      </div>
      {items.length === 0 ? (
        <Typography variant="small" tone="muted">
          No rules yet.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((rule, index) => {
            const active = selectedId === rule.id
            return (
              <li key={rule.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(rule.id)}
                  onDoubleClick={() => {
                    setSelectedId(rule.id)
                    setPane('view')
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 py-2.5 text-left',
                    active ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                  )}
                >
                  <span className="w-5 shrink-0 pt-0.5 text-xs tabular-nums text-neutral-400">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <Typography variant="small">{rule.ruleTypeCode || 'Rule'}</Typography>
                    <Typography variant="caption" tone="muted" className="block truncate">
                      {ruleSummary(rule)}
                    </Typography>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={
          pane === 'add' ? 'Add validation rule' : pane === 'edit' ? 'Edit validation rule' : 'Validation rule'
        }
        size="full"
        actions={
          pane === 'view'
            ? [
                { label: 'Close', onClick: closeModal, variant: 'ghost' },
                {
                  label: 'Edit',
                  onClick: () => {
                    if (!selectedRule) return
                    fillFormFromRule(selectedRule)
                    setPane('edit')
                  },
                  variant: 'primary',
                },
              ]
            : [
                { label: 'Cancel', onClick: closeModal, variant: 'ghost' },
                {
                  label: pane === 'edit' ? 'Save rule' : 'Add rule',
                  onClick: () => void handleSave(),
                  variant: 'primary',
                  disabled: !ruleTypeId || saving,
                  loading: saving,
                },
              ]
        }
      >
        <div className="mx-auto max-w-3xl">{pane === 'view' ? ruleDetail : form}</div>
      </Modal>
    </div>
  )
}
