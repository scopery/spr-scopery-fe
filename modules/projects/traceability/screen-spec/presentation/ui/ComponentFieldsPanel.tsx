'use client'

import { PageSkeleton, Typography } from '@/shared/ui'
import { SCREEN_FIELD_TYPE_OPTIONS } from '../../domain/enums/screen-spec.enum'
import { useComponentFields } from '../hooks/useComponentFields'
import { ScreenStructureEditor } from '../../../ui/ScreenStructureEditor'

const COLS = [
  {
    key: 'fieldKey',
    label: 'Field key',
    required: true,
    placeholder: 'username',
    lockedOnExisting: true,
  },
  { key: 'label', label: 'Label', required: true, placeholder: 'Username' },
  {
    key: 'fieldType',
    label: 'Type',
    required: true,
    options: SCREEN_FIELD_TYPE_OPTIONS,
  },
  { key: 'required', label: 'Required', options: ['false', 'true'] as const },
  { key: 'maxLength', label: 'Max length', placeholder: '100' },
  { key: 'remark', label: 'Remark', placeholder: 'Optional' },
]

export function ComponentFieldsPanel({
  workspaceId,
  componentId,
}: {
  workspaceId: string
  componentId: string
}) {
  const { items, loading, error, createField, updateField, removeField } = useComponentFields(
    workspaceId,
    componentId
  )

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <Typography weight="medium" variant="small">
        Component fields
      </Typography>
      <Typography variant="caption" tone="muted">
        Template controls for this component. Bind the component onto a screen section to copy
        these fields onto the screen.
      </Typography>
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      <ScreenStructureEditor
        columns={COLS}
        items={items.map((f) => ({
          id: f.id,
          values: {
            fieldKey: f.fieldKey,
            label: f.label,
            fieldType: f.fieldType,
            required: f.required ? 'true' : 'false',
            maxLength: f.maxLength != null ? String(f.maxLength) : '',
            remark: f.remark ?? '',
          },
        }))}
        emptyLabel="No fields yet."
        addTitle="Add component fields"
        editTitle="Edit component fields"
        itemLabel="field"
        onCreate={async (values) => {
          const max = values.maxLength.trim()
          await createField({
            fieldKey: values.fieldKey.trim(),
            label: values.label.trim(),
            fieldType: values.fieldType.trim() || 'TEXT',
            required: values.required === 'true',
            maxLength: max ? Number(max) : null,
            remark: values.remark.trim() || null,
          })
        }}
        onUpdate={async (id, values) => {
          const max = values.maxLength.trim()
          await updateField(id, {
            label: values.label.trim(),
            fieldType: values.fieldType.trim() || 'TEXT',
            required: values.required === 'true',
            maxLength: max ? Number(max) : null,
            remark: values.remark.trim() || null,
          })
        }}
        onDelete={removeField}
      />
    </div>
  )
}
