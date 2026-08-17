'use client'

import { PageSkeleton, Typography } from '@/shared/ui'
import { DATA_ENTITY_DATA_TYPE_OPTIONS } from '../../domain/enums/screen-spec.enum'
import { useDataEntityFields } from '../hooks/useDataEntityFields'
import { ScreenStructureEditor } from '../../../ui/ScreenStructureEditor'

const COLS = [
  {
    key: 'columnName',
    label: 'Column',
    required: true,
    placeholder: 'email',
    lockedOnExisting: true,
  },
  {
    key: 'dataType',
    label: 'Type',
    required: true,
    options: DATA_ENTITY_DATA_TYPE_OPTIONS,
  },
  { key: 'maxLength', label: 'Max length', placeholder: '255' },
  { key: 'isNullable', label: 'Nullable', options: ['true', 'false'] as const },
  { key: 'isUnique', label: 'Unique', options: ['true', 'false'] as const },
  { key: 'remark', label: 'Remark', placeholder: 'Optional', multiline: true },
]

function parseBool(value: string, fallback: boolean): boolean {
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function toDataEntityFieldBody(values: Record<string, string>) {
  const max = values.maxLength.trim()
  return {
    columnName: values.columnName.trim(),
    dataType: values.dataType.trim() || 'VARCHAR',
    maxLength: max ? Number(max) : null,
    isNullable: parseBool(values.isNullable, true),
    isUnique: parseBool(values.isUnique, false),
    remark: values.remark.trim() || null,
  }
}

export function DataEntityFieldsPanel({
  workspaceId,
  entityId,
}: {
  workspaceId: string
  entityId: string
}) {
  const { items, loading, error, createField, createFieldsBulk, updateField, removeField } =
    useDataEntityFields(workspaceId, entityId)

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <Typography weight="medium" variant="small">
        Columns
      </Typography>
      <Typography variant="caption" tone="muted">
        Physical columns for this table. Link them on a screen field (Configure) so Defines can show Table and type.
      </Typography>
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? <Typography tone="error" variant="small">{error}</Typography> : null}
      <ScreenStructureEditor
        columns={COLS}
        items={items.map((f) => ({
          id: f.id,
          values: {
            columnName: f.columnName,
            dataType: f.dataType,
            maxLength: f.maxLength != null ? String(f.maxLength) : '',
            isNullable: f.isNullable ? 'true' : 'false',
            isUnique: f.isUnique ? 'true' : 'false',
            remark: f.remark ?? '',
          },
        }))}
        emptyLabel="No columns yet."
        addTitle="Add columns"
        editTitle="Edit columns"
        itemLabel="column"
        onCreate={async (values) => {
          await createField(toDataEntityFieldBody(values))
        }}
        onCreateMany={async (rows) => createFieldsBulk(rows.map(toDataEntityFieldBody))}
        onUpdate={async (id, values) => {
          const max = values.maxLength.trim()
          await updateField(id, {
            dataType: values.dataType.trim() || 'VARCHAR',
            maxLength: max ? Number(max) : null,
            isNullable: parseBool(values.isNullable, true),
            isUnique: parseBool(values.isUnique, false),
            remark: values.remark.trim() || null,
          })
        }}
        onDelete={removeField}
      />
    </div>
  )
}
