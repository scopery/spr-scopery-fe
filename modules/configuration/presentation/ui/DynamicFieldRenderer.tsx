'use client'

import { Checkbox, Input, Select, Textarea, Typography } from '@/shared/ui'
import { CustomFieldType, FormFieldSource } from '../../domain/enums/configuration.enum'
import { isMultiSelectFieldType, isSelectFieldType } from '../../domain/rules/configuration.rules'
import type { CustomFieldDefinition } from '../../domain/model/custom-field'
import type { CustomFieldOption } from '../../domain/model/field-option'
import type { CustomFormField } from '../../domain/model/form-field'

export interface DynamicFieldRendererProps {
  formField: CustomFormField
  fieldDefinition?: CustomFieldDefinition | null
  options?: CustomFieldOption[]
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
}

/** Renders the correct input control for a form field based on its custom field type. */
export function DynamicFieldRenderer({
  formField,
  fieldDefinition,
  options = [],
  value,
  onChange,
  disabled = false,
}: DynamicFieldRendererProps) {
  if (formField.fieldSource === FormFieldSource.InstructionText) {
    return (
      <Typography as="p" variant="small" tone="muted">
        {fieldDefinition?.label ?? 'Instruction'}
      </Typography>
    )
  }

  if (formField.fieldSource === FormFieldSource.Separator) {
    return <div className="my-2 border-t border-neutral-200" />
  }

  if (formField.fieldSource === FormFieldSource.ReadonlyDisplay) {
    return (
      <div>
        <Typography variant="small" tone="muted" className="mb-1">
          {fieldDefinition?.label ?? 'Field'}
        </Typography>
        <Typography variant="small">{value != null ? String(value) : '—'}</Typography>
      </div>
    )
  }

  const label =
    fieldDefinition?.label ??
    (formField.fieldSource === FormFieldSource.CoreField ? 'Core field' : 'Field')
  const required = formField.requiredOnForm
  const fieldType = fieldDefinition?.fieldType ?? CustomFieldType.Text

  if (isSelectFieldType(fieldType) && options.length > 0) {
    if (isMultiSelectFieldType(fieldType)) {
      const selectedIds = typeof value === 'string' ? value.split(',').filter(Boolean) : []
      return (
        <div>
          <Typography variant="small" className="mb-1.5">
            {label}
            {required ? <span className="ml-1 text-error">*</span> : null}
          </Typography>
          <div className="flex flex-col gap-1.5">
            {options.map((opt) => (
              <Checkbox
                key={opt.id}
                label={opt.label}
                checked={selectedIds.includes(opt.id)}
                disabled={disabled}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedIds, opt.id]
                    : selectedIds.filter((id) => id !== opt.id)
                  onChange(next.join(','))
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    return (
      <div>
        <Typography variant="small" className="mb-1.5">
          {label}
          {required ? <span className="ml-1 text-error">*</span> : null}
        </Typography>
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={(v: string) => onChange(v)}
          disabled={disabled}
          options={options.map((opt) => ({ value: opt.id, label: opt.label }))}
        />
      </div>
    )
  }

  if (fieldType === CustomFieldType.Boolean) {
    return (
      <Checkbox
        label={label}
        checked={value === true}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    )
  }

  if (fieldType === CustomFieldType.LongText) {
    return (
      <Textarea
        label={label}
        required={required}
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  const inputType =
    fieldType === CustomFieldType.Date
      ? 'date'
      : fieldType === CustomFieldType.DateTime
        ? 'datetime-local'
        : fieldType === CustomFieldType.Number ||
            fieldType === CustomFieldType.Decimal ||
            fieldType === CustomFieldType.Currency ||
            fieldType === CustomFieldType.Percentage
          ? 'number'
          : fieldType === CustomFieldType.Email
            ? 'email'
            : fieldType === CustomFieldType.Url
              ? 'url'
              : 'text'

  return (
    <Input
      label={label}
      required={required}
      disabled={disabled}
      type={inputType}
      value={value == null ? '' : String(value)}
      onChange={(e) =>
        onChange(inputType === 'number' ? Number(e.target.value) : e.target.value)
      }
    />
  )
}
