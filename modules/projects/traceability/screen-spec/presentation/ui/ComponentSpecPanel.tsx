'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, PageSkeleton, SearchableSelect, Select, Stack, Typography } from '@/shared/ui'
import { OptionSourceType } from '../../domain/enums/screen-spec.enum'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import { useApplicationComponentDetail } from '../hooks/useApplicationComponentDetail'
import { useDataEntityFields } from '../hooks/useDataEntityFields'
import { ComponentFieldsPanel } from './ComponentFieldsPanel'
import { ComponentApisPanel, type SpecCatalogApi } from './ComponentApisPanel'
import { SpecTabBar } from './SpecTabBar'
import { ComponentScreenshotUpload } from './SpecImageUpload'
import { ScreenStructureEditor } from '../../../ui/ScreenStructureEditor'

export interface SpecCatalogEntity {
  id: string
  code: string
  name: string
}

const OPTION_COLS = [
  { key: 'optionValue', label: 'Value', required: true, placeholder: 'active' },
  { key: 'optionLabel', label: 'Label', required: true, placeholder: 'Active' },
  { key: 'displayOrder', label: 'Order', placeholder: '1' },
]

export function ComponentSpecPanel({
  workspaceId,
  applicationId,
  componentId,
  componentName,
  componentType,
  entities,
  apis = [],
}: {
  workspaceId: string
  applicationId: string
  componentId: string
  componentName: string
  componentType: string | null
  entities: SpecCatalogEntity[]
  apis?: SpecCatalogApi[]
}) {
  const {
    component,
    options,
    loading,
    error,
    saveSource,
    createOption,
    updateOption,
    removeOption,
  } = useApplicationComponentDetail(workspaceId, applicationId, componentId)

  const [tab, setTab] = useState<'fields' | 'options' | 'apis'>('fields')
  const [sourceType, setSourceType] = useState<string>(OptionSourceType.None)
  const [sourceEntityId, setSourceEntityId] = useState('')
  const [valueCol, setValueCol] = useState('')
  const [labelCol, setLabelCol] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!component) return
    setSourceType(component.optionSourceType || OptionSourceType.None)
    setSourceEntityId(component.sourceEntityId ?? '')
    setValueCol(component.sourceValueColumn ?? '')
    setLabelCol(component.sourceLabelColumn ?? '')
  }, [component])

  const { items: entityFields } = useDataEntityFields(
    workspaceId,
    sourceType === OptionSourceType.Dynamic ? sourceEntityId || null : null
  )
  const columnOptions = useMemo(
    () => entityFields.map((f) => ({ value: f.columnName, label: f.columnName })),
    [entityFields]
  )

  const handleSave = async () => {
    setSaving(true)
    setFormError(null)
    try {
      await saveSource({
        name: component?.name || componentName,
        description: component?.description ?? null,
        componentType: component?.componentType ?? componentType,
        optionSourceType: sourceType,
        sourceEntityId: sourceType === OptionSourceType.Dynamic ? sourceEntityId || null : null,
        sourceValueColumn: sourceType === OptionSourceType.Dynamic ? valueCol || null : null,
        sourceLabelColumn: sourceType === OptionSourceType.Dynamic ? labelCol || null : null,
        sourceFilterJson: null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      {loading && !component ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      <ComponentScreenshotUpload
        key={componentId}
        workspaceId={workspaceId}
        componentId={componentId}
        initialUrl={component?.screenshotUrl}
      />
      <SpecTabBar
        label="Component spec"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'fields', label: 'Fields' },
          { id: 'options', label: 'Options' },
          { id: 'apis', label: 'APIs' },
        ]}
      />

      {tab === 'fields' ? (
        <ComponentFieldsPanel workspaceId={workspaceId} componentId={componentId} />
      ) : null}

      {tab === 'options' ? (
        <div className="space-y-3">
          <Typography weight="medium" variant="small">
            Option source
          </Typography>
          <Typography variant="caption" tone="muted">
            None = no list. Static = type values here. Dynamic = load from an entity column.
          </Typography>
          <Select
            value={sourceType}
            onValueChange={setSourceType}
            options={[
              { value: OptionSourceType.None, label: 'None' },
              { value: OptionSourceType.Static, label: 'Static' },
              { value: OptionSourceType.Dynamic, label: 'Dynamic' },
            ]}
          />
          {sourceType === OptionSourceType.Dynamic ? (
            <Stack direction="vertical" spacing="sm">
              {entities.length === 0 ? (
                <Typography variant="small" tone="muted">
                  Create a data entity first, then map value and label columns.
                </Typography>
              ) : (
                <SearchableSelect
                  value={sourceEntityId}
                  onValueChange={setSourceEntityId}
                  options={entities.map((e) => ({
                    value: e.id,
                    label: `${e.code} · ${e.name}`,
                  }))}
                  placeholder="Source entity"
                  searchPlaceholder="Search entity…"
                />
              )}
              <SearchableSelect
                value={valueCol}
                onValueChange={setValueCol}
                options={columnOptions}
                placeholder="Value column"
                searchPlaceholder="Search column…"
                disabled={!sourceEntityId}
              />
              <SearchableSelect
                value={labelCol}
                onValueChange={setLabelCol}
                options={columnOptions}
                placeholder="Label column"
                searchPlaceholder="Search column…"
                disabled={!sourceEntityId}
              />
            </Stack>
          ) : null}
          {formError ? (
            <Typography tone="error" variant="small">
              {formError}
            </Typography>
          ) : null}
          <Button size="sm" onClick={() => void handleSave()} loading={saving}>
            Save source
          </Button>
          {sourceType === OptionSourceType.Static ? (
            <div className="space-y-2 pt-2">
              <Typography weight="medium" variant="small">
                Static options
              </Typography>
              <ScreenStructureEditor
                columns={OPTION_COLS}
                items={options.map((o) => ({
                  id: o.id,
                  values: {
                    optionValue: o.optionValue,
                    optionLabel: o.optionLabel,
                    displayOrder: o.displayOrder != null ? String(o.displayOrder) : '',
                  },
                }))}
                emptyLabel="No options yet."
                addTitle="Add options"
                editTitle="Edit options"
                itemLabel="option"
                onCreate={async (values) => {
                  const order = values.displayOrder.trim()
                  await createOption({
                    optionValue: values.optionValue.trim(),
                    optionLabel: values.optionLabel.trim(),
                    displayOrder: order ? Number(order) : null,
                  })
                }}
                onUpdate={async (id, values) => {
                  const order = values.displayOrder.trim()
                  await updateOption(id, {
                    optionValue: values.optionValue.trim(),
                    optionLabel: values.optionLabel.trim(),
                    displayOrder: order ? Number(order) : null,
                  })
                }}
                onDelete={removeOption}
              />
            </div>
          ) : (
            <Typography variant="small" tone="muted">
              {sourceType === OptionSourceType.None
                ? ScreenSpecMessages.STATIC_OPTIONS_ONLY
                : 'Dynamic options are resolved by the consuming app, not listed here.'}
            </Typography>
          )}
        </div>
      ) : null}

      {tab === 'apis' ? (
        <ComponentApisPanel workspaceId={workspaceId} componentId={componentId} apis={apis} />
      ) : null}
    </div>
  )
}
