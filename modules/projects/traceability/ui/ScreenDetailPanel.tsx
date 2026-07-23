'use client'

import { useMemo, useState } from 'react'
import { PageSkeleton, Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { RegistryScreen } from '../model/application-registry'
import { useScreenDetail } from '../hooks/useScreenDetail'
import { ScreenStructureEditor } from './ScreenStructureEditor'

type ScreenDetailTab = 'sections' | 'fields' | 'actions'

interface ScreenDetailPanelProps {
  workspaceId: string
  screen: RegistryScreen
  onClose: () => void
  embedded?: boolean
}

const SCREEN_FIELD_TYPE_OPTIONS = [
  'TEXT',
  'NUMBER',
  'DATE',
  'BOOLEAN',
  'URL',
] as const
const SCREEN_ACTION_TYPE_OPTIONS = ['PRIMARY', 'SECONDARY', 'DEFAULT'] as const

const SECTION_COLS = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Main form' },
  { key: 'description', label: 'Description', placeholder: 'Optional' },
]

const FIELD_COLS = [
  {
    key: 'fieldKey',
    label: 'Field key',
    required: true,
    placeholder: 'email',
    lockedOnExisting: true,
  },
  { key: 'label', label: 'Label', required: true, placeholder: 'Email' },
  {
    key: 'fieldType',
    label: 'Type',
    required: true,
    placeholder: 'TEXT',
    options: SCREEN_FIELD_TYPE_OPTIONS,
  },
]

const ACTION_COLS = [
  {
    key: 'actionCode',
    label: 'Action code',
    required: true,
    placeholder: 'SUBMIT',
    lockedOnExisting: true,
  },
  { key: 'name', label: 'Name', required: true, placeholder: 'Submit' },
  {
    key: 'actionType',
    label: 'Type',
    placeholder: 'PRIMARY',
    options: SCREEN_ACTION_TYPE_OPTIONS,
  },
]

export function ScreenDetailPanel({
  workspaceId,
  screen,
  onClose: _onClose,
  embedded = false,
}: ScreenDetailPanelProps) {
  const {
    sections,
    fields,
    actions,
    loading,
    error,
    createSection,
    updateSection,
    removeSection,
    createField,
    updateField,
    removeField,
    createAction,
    updateAction,
    removeAction,
  } = useScreenDetail(workspaceId, screen.id)
  const [tab, setTab] = useState<ScreenDetailTab>('sections')

  const sectionItems = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        values: {
          name: s.name,
          description: s.description ?? '',
        },
      })),
    [sections]
  )

  const fieldItems = useMemo(
    () =>
      fields.map((f) => ({
        id: f.id,
        values: {
          fieldKey: f.fieldKey,
          label: f.label,
          fieldType: f.fieldType,
        },
      })),
    [fields]
  )

  const actionItems = useMemo(
    () =>
      actions.map((a) => ({
        id: a.id,
        values: {
          actionCode: a.actionCode,
          name: a.name,
          actionType: a.actionType ?? '',
        },
      })),
    [actions]
  )

  return (
    <Stack direction="vertical" spacing="md">
      {embedded ? (
        <Typography weight="medium" variant="small">
          Screen structure
        </Typography>
      ) : null}

      <div
        className="flex gap-1 border-b border-neutral-200"
        role="tablist"
        aria-label="Screen structure"
      >
        {(
          [
            { id: 'sections', label: `Sections (${sections.length})` },
            { id: 'fields', label: `Fields (${fields.length})` },
            { id: 'actions', label: `Actions (${actions.length})` },
          ] as const
        ).map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {loading && sections.length === 0 && fields.length === 0 && actions.length === 0 ? (
        <PageSkeleton variant="list" />
      ) : null}
      {error ? <Typography tone="error">{error}</Typography> : null}

      {tab === 'sections' ? (
        <ScreenStructureEditor
          columns={SECTION_COLS}
          items={sectionItems}
          emptyLabel="No sections yet."
          addTitle="Add sections"
          editTitle="Edit sections"
          itemLabel="section"
          onCreate={async (values) => {
            await createSection({
              name: values.name.trim(),
              description: values.description.trim() || null,
            })
          }}
          onUpdate={async (id, values) => {
            await updateSection(id, {
              name: values.name.trim(),
              description: values.description.trim() || null,
            })
          }}
          onDelete={removeSection}
        />
      ) : null}

      {tab === 'fields' ? (
        <ScreenStructureEditor
          columns={FIELD_COLS}
          items={fieldItems}
          emptyLabel="No fields yet."
          addTitle="Add fields"
          editTitle="Edit fields"
          itemLabel="field"
          onCreate={async (values) => {
            await createField({
              fieldKey: values.fieldKey.trim(),
              label: values.label.trim(),
              fieldType: values.fieldType.trim() || 'TEXT',
            })
          }}
          onUpdate={async (id, values) => {
            await updateField(id, {
              label: values.label.trim(),
              fieldType: values.fieldType.trim() || 'TEXT',
            })
          }}
          onDelete={removeField}
        />
      ) : null}

      {tab === 'actions' ? (
        <ScreenStructureEditor
          columns={ACTION_COLS}
          items={actionItems}
          emptyLabel="No actions yet."
          addTitle="Add actions"
          editTitle="Edit actions"
          itemLabel="action"
          onCreate={async (values) => {
            await createAction({
              actionCode: values.actionCode.trim(),
              name: values.name.trim(),
              actionType: values.actionType.trim() || null,
            })
          }}
          onUpdate={async (id, values) => {
            await updateAction(id, {
              name: values.name.trim(),
              actionType: values.actionType.trim() || 'DEFAULT',
            })
          }}
          onDelete={removeAction}
        />
      ) : null}
    </Stack>
  )
}
