'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Modal, Select, Stack, Typography } from '@/shared/ui'
import { useDataEntityFields } from '../hooks/useDataEntityFields'
import { useScreenFieldSpec } from '../hooks/useScreenFieldSpec'
import { FieldValidationsEditor } from './FieldValidationsEditor'
import type { ScreenMode } from '../../domain/model/screen-spec'
import type { SpecCatalogEntity } from './ComponentSpecPanel'

export interface SpecCatalogComponent {
  id: string
  code: string
  name: string
}

export function FieldSpecDrawer({
  open,
  onClose,
  workspaceId,
  screenId,
  fieldId,
  modes,
  components,
  entities,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  workspaceId: string
  screenId: string
  fieldId: string | null
  modes: ScreenMode[]
  components: SpecCatalogComponent[]
  entities: SpecCatalogEntity[]
  onSaved?: () => void
}) {
  const { field, loading, error, saveField } = useScreenFieldSpec(
    open ? workspaceId : null,
    open ? screenId : null,
    open ? fieldId : null
  )
  const [componentId, setComponentId] = useState('none')
  const [entityId, setEntityId] = useState('none')
  const [dataEntityFieldId, setDataEntityFieldId] = useState('none')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { items: entityFields } = useDataEntityFields(
    workspaceId,
    entityId && entityId !== 'none' ? entityId : null
  )

  useEffect(() => {
    if (!field) return
    setComponentId(field.componentId ?? 'none')
    setDataEntityFieldId(field.dataEntityFieldId ?? 'none')
  }, [field])

  const fieldOptions = useMemo(
    () =>
      entityFields.map((f) => ({
        value: f.id,
        label: f.columnName,
      })),
    [entityFields]
  )

  const handleSave = async () => {
    if (!field) return
    setSaving(true)
    setFormError(null)
    try {
      await saveField({
        label: field.label,
        fieldType: field.fieldType,
        description: field.description,
        required: field.required,
        displayOrder: field.displayOrder,
        sectionId: field.sectionId,
        maxLength: field.maxLength,
        remark: field.remark,
        componentId: componentId === 'none' || !componentId ? null : componentId,
        dataEntityFieldId:
          dataEntityFieldId === 'none' || !dataEntityFieldId ? null : dataEntityFieldId,
      })
      onSaved?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={field ? `Field · ${field.fieldKey}` : 'Field'}
      size="lg"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        { label: 'Save binding', onClick: () => void handleSave(), variant: 'primary', disabled: saving || !field },
      ]}
    >
      {loading && !field ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : null}
      {error ? <Typography tone="error">{error}</Typography> : null}
      {field ? (
        <Stack direction="vertical" spacing="md">
          <Select
            value={componentId}
            onValueChange={setComponentId}
            options={[
              { value: 'none', label: 'No component' },
              ...components.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
            ]}
            placeholder="Component"
          />
          <Select
            value={entityId}
            onValueChange={(id: string) => {
              setEntityId(id)
              setDataEntityFieldId('none')
            }}
            options={[
              { value: 'none', label: 'No data entity' },
              ...entities.map((e) => ({ value: e.id, label: `${e.code} · ${e.name}` })),
            ]}
            placeholder="Data entity"
          />
          <Select
            value={dataEntityFieldId}
            onValueChange={setDataEntityFieldId}
            options={[{ value: 'none', label: 'No column' }, ...fieldOptions]}
            placeholder="Data column"
            disabled={!entityId || entityId === 'none'}
          />
          {formError ? <Typography tone="error" variant="small">{formError}</Typography> : null}
          <FieldValidationsEditor
            workspaceId={workspaceId}
            screenId={screenId}
            fieldId={field.id}
            modes={modes}
          />
        </Stack>
      ) : null}
    </Modal>
  )
}
