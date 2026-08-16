'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { useDataEntityFields } from '../hooks/useDataEntityFields'
import { useScreenFieldSpec } from '../hooks/useScreenFieldSpec'
import { applyDefaultValueToDrafts, draftFromModeConfig, fieldLevelDefaultValue, findModeConfig } from '../../domain/rules/mode-config.rules'
import { FieldValidationsEditor } from './FieldValidationsEditor'
import { SpecTabBar } from './SpecTabBar'
import type { ScreenMode } from '../../domain/model/screen-spec'
import type { SpecCatalogEntity } from './ComponentSpecPanel'

export interface SpecCatalogComponent {
  id: string
  code: string
  name: string
}

export type FieldSpecDrawerTab = 'links' | 'validations'

export function FieldSpecDrawer({
  open,
  onClose,
  workspaceId,
  screenId,
  fieldId,
  modes,
  components,
  entities,
  initialTab = 'links',
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
  initialTab?: FieldSpecDrawerTab
  onSaved?: () => void
}) {
  const { field, loading, error, saveField, saveModeConfigs } = useScreenFieldSpec(
    open ? workspaceId : null,
    open ? screenId : null,
    open ? fieldId : null
  )
  const [tab, setTab] = useState<FieldSpecDrawerTab>(initialTab)
  const [componentId, setComponentId] = useState('none')
  const [entityId, setEntityId] = useState('none')
  const [dataEntityFieldId, setDataEntityFieldId] = useState('none')
  const [defaultValue, setDefaultValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { items: entityFields } = useDataEntityFields(
    workspaceId,
    entityId && entityId !== 'none' ? entityId : null
  )

  useEffect(() => {
    if (!open) return
    setTab(initialTab)
  }, [open, initialTab, fieldId])

  useEffect(() => {
    if (!field) return
    setComponentId(field.componentId ?? 'none')
    setDataEntityFieldId(field.dataEntityFieldId ?? 'none')
    setDefaultValue(fieldLevelDefaultValue(field.modeConfigs, modes))
    setEntityId('none')
  }, [field, modes])

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
      if (modes.length > 0) {
        const drafts = modes.map((mode) =>
          draftFromModeConfig(mode.id, findModeConfig(field.modeConfigs, mode))
        )
        await saveModeConfigs(
          applyDefaultValueToDrafts(drafts, modes, defaultValue.trim() || null),
          field.required
        )
      }
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
      size="xl"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        ...(tab === 'links'
          ? [
              {
                label: 'Save links',
                onClick: () => void handleSave(),
                variant: 'primary' as const,
                disabled: saving || !field,
              },
            ]
          : []),
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
          <SpecTabBar
            label="Field setup"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'links', label: 'Links' },
              { id: 'validations', label: 'Validations' },
            ]}
          />

          {tab === 'links' ? (
            <Stack direction="vertical" spacing="sm">
              <Typography variant="small" tone="muted">
                Bind this screen field to a catalog component and a database column.
              </Typography>
              {field.componentFieldId ? (
                <Typography variant="caption" tone="muted">
                  Copied from a component field. Unlink that component on the screen’s Components
                  tab to remove this field and its rules.
                </Typography>
              ) : (
                <Typography variant="caption" tone="muted">
                  Added on this screen. Linking a component here is metadata only — it does not
                  copy fields.
                </Typography>
              )}
              <div>
                <Typography variant="caption" tone="muted" className="mb-1 block">
                  Component
                </Typography>
                <Select
                  value={componentId}
                  onValueChange={setComponentId}
                  options={[
                    { value: 'none', label: 'Not linked' },
                    ...components.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
                  ]}
                  placeholder="Component"
                />
              </div>
              <div>
                <Typography variant="caption" tone="muted" className="mb-1 block">
                  Data entity
                </Typography>
                <Select
                  value={entityId}
                  onValueChange={(id: string) => {
                    setEntityId(id)
                    setDataEntityFieldId('none')
                  }}
                  options={[
                    { value: 'none', label: 'Pick an entity to choose a column' },
                    ...entities.map((e) => ({ value: e.id, label: `${e.code} · ${e.name}` })),
                  ]}
                  placeholder="Data entity"
                />
              </div>
              <div>
                <Typography variant="caption" tone="muted" className="mb-1 block">
                  Default
                </Typography>
                <Input
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  placeholder="Shown on create / Defines"
                  fullWidth
                />
              </div>
              <div>
                <Typography variant="caption" tone="muted" className="mb-1 block">
                  Data column
                </Typography>
                <Select
                  value={dataEntityFieldId}
                  onValueChange={setDataEntityFieldId}
                  options={[{ value: 'none', label: 'Not linked' }, ...fieldOptions]}
                  placeholder="Data column"
                  disabled={!entityId || entityId === 'none'}
                />
              </div>
              {field.dataEntityFieldId && (entityId === 'none' || !entityId) ? (
                <Typography variant="caption" tone="muted">
                  A column is already linked. Pick the entity above to change it, then Save links.
                </Typography>
              ) : null}
              {formError ? (
                <Typography tone="error" variant="small">
                  {formError}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <FieldValidationsEditor
              workspaceId={workspaceId}
              screenId={screenId}
              fieldId={field.id}
              modes={modes}
              onChanged={onSaved}
            />
          )}
        </Stack>
      ) : null}
    </Modal>
  )
}
