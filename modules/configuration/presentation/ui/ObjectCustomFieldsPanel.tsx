'use client'

import { Save } from 'lucide-react'
import { Button, Skeleton, Typography } from '@/shared/ui'
import { FormFieldSource } from '../../domain/enums/configuration.enum'
import type { CustomFormField } from '../../domain/model/form-field'
import { useObjectFieldValues } from '../hooks/useObjectFieldValues'
import { DynamicFieldRenderer } from './DynamicFieldRenderer'

interface ObjectCustomFieldsPanelProps {
  workspaceId: string
  objectType: string
  targetId: string
  readOnly?: boolean
}

function syntheticFormField(definitionId: string, required: boolean): CustomFormField {
  return {
    id: definitionId,
    formVersionId: '',
    sectionId: null,
    fieldSource: FormFieldSource.CustomField,
    customFieldDefinitionId: definitionId,
    requiredOnForm: required,
    sortOrder: 0,
  }
}

/** Edit custom field values attached to a business object (e.g. PROJECT). */
export function ObjectCustomFieldsPanel({
  workspaceId,
  objectType,
  targetId,
  readOnly = false,
}: ObjectCustomFieldsPanelProps) {
  const {
    definitions,
    draftValues,
    optionsByFieldId,
    loading,
    saving,
    error,
    setFieldValue,
    save,
  } = useObjectFieldValues(workspaceId, objectType, targetId)

  if (loading) {
    return <Skeleton variant="rectangular" width="100%" height={120} />
  }

  if (error) {
    return (
      <Typography tone="error" variant="small">
        {error}
      </Typography>
    )
  }

  if (definitions.length === 0) {
    return (
      <Typography variant="small" tone="muted">
        No active custom fields for {objectType}.
      </Typography>
    )
  }

  return (
    <div className="border border-neutral-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Typography weight="semibold" variant="small">
            Custom fields
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Values stored on this {objectType.toLowerCase()}.
          </Typography>
        </div>
        {!readOnly ? (
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => void save()}
            icon={<Save size={16} />}
          >
            {saving ? 'Saving…' : 'Save fields'}
          </Button>
        ) : null}
      </div>
      <div className="space-y-4">
        {definitions.map((def) => (
          <DynamicFieldRenderer
            key={def.id}
            formField={syntheticFormField(def.id, def.required)}
            fieldDefinition={def}
            options={optionsByFieldId[def.id] ?? []}
            value={draftValues[def.id]}
            onChange={(v) => setFieldValue(def.id, v)}
            disabled={readOnly}
          />
        ))}
      </div>
    </div>
  )
}
