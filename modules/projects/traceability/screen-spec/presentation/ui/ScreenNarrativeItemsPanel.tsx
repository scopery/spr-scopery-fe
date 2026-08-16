'use client'

import { useMemo } from 'react'
import { PageSkeleton, Typography } from '@/shared/ui'
import {
  SCREEN_MODE_CODE_OPTIONS,
  TRIGGER_ACTION_CODE_OPTIONS,
} from '../../domain/enums/screen-spec.enum'
import { useScreenEventItems, useScreenProcessItems } from '../hooks/useScreenNarrativeItems'
import { ScreenStructureEditor, type StructureOption } from '../../../ui/ScreenStructureEditor'
import type { ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreen, RegistryScreenField } from '../../../model/application-registry'

const NONE = 'none'

function optionalId(value: string): string | null {
  const next = value.trim()
  return !next || next === NONE ? null : next
}

function modeOptions(modes: ScreenMode[]): StructureOption[] {
  return [
    { value: NONE, label: 'All modes' },
    ...modes.map((m) => ({ value: m.id, label: `${m.modeCode} · ${m.name}` })),
  ]
}

function resolveModeValue(
  modeId: string | null,
  modeCode: string | null | undefined,
  modes: ScreenMode[]
): string {
  if (modeId && modes.some((m) => m.id === modeId)) return modeId
  if (modeCode) {
    const match = modes.find((m) => m.modeCode === modeCode)
    if (match) return match.id
  }
  return modeId || NONE
}

function fieldOptions(fields: RegistryScreenField[]): StructureOption[] {
  return [
    { value: NONE, label: 'No field' },
    ...fields.map((f) => ({ value: f.id, label: `${f.fieldKey} · ${f.label}` })),
  ]
}

export function ScreenProcessItemsPanel({
  workspaceId,
  screenId,
  modes,
  fields,
}: {
  workspaceId: string
  screenId: string
  modes: ScreenMode[]
  fields: RegistryScreenField[]
}) {
  const { items, loading, error, createItem, updateItem, removeItem, reorderItems } =
    useScreenProcessItems(workspaceId, screenId)
  const columns = useMemo(
    () => [
      { key: 'title', label: 'Title', required: true, placeholder: '1. Data load' },
      { key: 'content', label: 'Content', placeholder: 'What happens' },
      { key: 'sourceTable', label: 'Source table', placeholder: 'USER_MASTER' },
      { key: 'conditionNote', label: 'Condition', placeholder: 'Optional' },
      { key: 'modeId', label: 'Mode', options: modeOptions(modes) },
      { key: 'targetFieldId', label: 'Field', options: fieldOptions(fields) },
    ],
    [modes, fields]
  )

  return (
    <div className="space-y-2">
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? <Typography tone="error" variant="small">{error}</Typography> : null}
      <ScreenStructureEditor
        columns={columns}
        items={items.map((item) => ({
          id: item.id,
          values: {
            title: item.title,
            content: item.content ?? '',
            sourceTable: item.sourceTable ?? '',
            conditionNote: item.conditionNote ?? '',
            modeId: resolveModeValue(item.modeId, item.modeCode, modes),
            targetFieldId: item.targetFieldId ?? NONE,
          },
        }))}
        emptyLabel="No process steps yet."
        addTitle="Add processes"
        editTitle="Edit processes"
        itemLabel="process"
        layout="masterDetail"
        onReorder={reorderItems}
        onCreate={async (values) => {
          await createItem({
            title: values.title.trim(),
            content: values.content.trim() || null,
            sourceTable: values.sourceTable.trim() || null,
            conditionNote: values.conditionNote.trim() || null,
            modeId: optionalId(values.modeId),
            targetFieldId: optionalId(values.targetFieldId),
          })
        }}
        onUpdate={async (id, values) => {
          await updateItem(id, {
            title: values.title.trim(),
            content: values.content.trim() || null,
            sourceTable: values.sourceTable.trim() || null,
            conditionNote: values.conditionNote.trim() || null,
            modeId: optionalId(values.modeId),
            targetFieldId: optionalId(values.targetFieldId),
          })
        }}
        onDelete={removeItem}
      />
    </div>
  )
}

export function ScreenEventItemsPanel({
  workspaceId,
  screenId,
  modes,
  fields,
  screens,
}: {
  workspaceId: string
  screenId: string
  modes: ScreenMode[]
  fields: RegistryScreenField[]
  screens: Array<{ id: string; code: string; name: string }>
}) {
  const { items, loading, error, createItem, updateItem, removeItem, reorderItems } =
    useScreenEventItems(workspaceId, screenId)
  const columns = useMemo(
    () => [
      { key: 'title', label: 'Title', required: true, placeholder: 'Submit click' },
      { key: 'content', label: 'Content', placeholder: 'Validate → POST → navigate' },
      {
        key: 'triggerActionCode',
        label: 'Trigger',
        options: TRIGGER_ACTION_CODE_OPTIONS,
      },
      { key: 'triggerFieldId', label: 'Trigger field', options: fieldOptions(fields) },
      { key: 'modeId', label: 'Mode', options: modeOptions(modes) },
      { key: 'conditionNote', label: 'Condition', placeholder: 'Optional' },
      {
        key: 'targetScreenId',
        label: 'Navigate to',
        options: [
          { value: NONE, label: 'No screen' },
          ...screens.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` })),
        ],
      },
      {
        key: 'targetModeCode',
        label: 'Target mode',
        options: [{ value: NONE, label: 'None' }, ...SCREEN_MODE_CODE_OPTIONS],
      },
    ],
    [modes, fields, screens]
  )

  return (
    <div className="space-y-2">
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? <Typography tone="error" variant="small">{error}</Typography> : null}
      <ScreenStructureEditor
        columns={columns}
        items={items.map((item) => ({
          id: item.id,
          values: {
            title: item.title,
            content: item.content ?? '',
            triggerActionCode: item.triggerActionCode ?? 'CLICK',
            triggerFieldId: item.triggerFieldId ?? NONE,
            modeId: resolveModeValue(item.modeId, item.modeCode, modes),
            conditionNote: item.conditionNote ?? '',
            targetScreenId: item.targetScreenId ?? NONE,
            targetModeCode: item.targetModeCode ?? NONE,
          },
        }))}
        emptyLabel="No events yet."
        addTitle="Add events"
        editTitle="Edit events"
        itemLabel="event"
        layout="masterDetail"
        onReorder={reorderItems}
        onCreate={async (values) => {
          await createItem({
            title: values.title.trim(),
            content: values.content.trim() || null,
            triggerActionCode: values.triggerActionCode.trim() || 'CLICK',
            triggerFieldId: optionalId(values.triggerFieldId),
            modeId: optionalId(values.modeId),
            conditionNote: values.conditionNote.trim() || null,
            targetScreenId: optionalId(values.targetScreenId),
            targetModeCode: optionalId(values.targetModeCode),
          })
        }}
        onUpdate={async (id, values) => {
          await updateItem(id, {
            title: values.title.trim(),
            content: values.content.trim() || null,
            triggerActionCode: values.triggerActionCode.trim() || 'CLICK',
            triggerFieldId: optionalId(values.triggerFieldId),
            modeId: optionalId(values.modeId),
            conditionNote: values.conditionNote.trim() || null,
            targetScreenId: optionalId(values.targetScreenId),
            targetModeCode: optionalId(values.targetModeCode),
          })
        }}
        onDelete={removeItem}
      />
    </div>
  )
}
