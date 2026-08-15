'use client'

import { useMemo, useState } from 'react'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import type { RegistryScreen } from '../model/application-registry'
import { useScreenDetail } from '../hooks/useScreenDetail'
import { ScreenStructureEditor } from './ScreenStructureEditor'
import {
  SCREEN_FIELD_TYPE_OPTIONS,
  SCREEN_MODE_CODE_OPTIONS,
} from '../screen-spec/domain/enums/screen-spec.enum'
import { useScreenModes } from '../screen-spec/presentation/hooks/useScreenModes'
import { useBindComponentToSection } from '../screen-spec/presentation/hooks/useBindComponentToSection'
import { FieldSpecDrawer } from '../screen-spec/presentation/ui/FieldSpecDrawer'
import { ScreenModeMatrixPanel } from '../screen-spec/presentation/ui/ScreenModeMatrixPanel'
import { useScreenSpecExcelExport } from '../screen-spec/presentation/hooks/useScreenSpecExcelExport'
import { SCREEN_STRUCTURE_TAB_HINTS } from '../screen-spec/presentation/ui/ScreenSpecHowTo'
import {
  ScreenEventItemsPanel,
  ScreenProcessItemsPanel,
} from '../screen-spec/presentation/ui/ScreenNarrativeItemsPanel'
import { ScreenValidationsPanel } from '../screen-spec/presentation/ui/ScreenValidationsPanel'
import { ScreenSectionBindComponentModal } from '../screen-spec/presentation/ui/ScreenSectionBindComponentModal'
import type { SpecCatalogComponent } from '../screen-spec/presentation/ui/FieldSpecDrawer'
import type { SpecCatalogEntity } from '../screen-spec/presentation/ui/ComponentSpecPanel'

type ScreenDetailTab =
  | 'sections'
  | 'fields'
  | 'modes'
  | 'matrix'
  | 'validations'
  | 'processes'
  | 'events'
  | 'actions'

interface ScreenDetailPanelProps {
  workspaceId: string
  screen: RegistryScreen
  onClose: () => void
  embedded?: boolean
  components?: SpecCatalogComponent[]
  entities?: SpecCatalogEntity[]
  screens?: Array<{ id: string; code: string; name: string }>
}

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
  { key: 'required', label: 'Required', options: ['false', 'true'] as const },
  { key: 'maxLength', label: 'Max length', placeholder: '255' },
  { key: 'remark', label: 'Remark', placeholder: 'Optional' },
]

const MODE_COLS = [
  {
    key: 'modeCode',
    label: 'Code',
    required: true,
    options: SCREEN_MODE_CODE_OPTIONS,
    lockedOnExisting: true,
  },
  { key: 'name', label: 'Name', required: true, placeholder: 'Create' },
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
  components = [],
  entities = [],
  screens = [],
}: ScreenDetailPanelProps) {
  const {
    sections,
    fields,
    actions,
    loading,
    error,
    refetch,
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
  const {
    items: modes,
    activeModes,
    error: modesError,
    createMode,
    updateMode,
    removeMode,
  } = useScreenModes(workspaceId, screen.id)
  const { exporting, exportScreen } = useScreenSpecExcelExport(workspaceId)
  const { bind } = useBindComponentToSection(workspaceId, screen.id)
  const [tab, setTab] = useState<ScreenDetailTab>('sections')
  const [specFieldId, setSpecFieldId] = useState<string | null>(null)
  const [bindSectionId, setBindSectionId] = useState<string | null>(null)
  const [bindSaving, setBindSaving] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)

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
          required: f.required ? 'true' : 'false',
          maxLength: '',
          remark: '',
        },
      })),
    [fields]
  )

  const modeItems = useMemo(
    () =>
      modes.map((m) => ({
        id: m.id,
        values: {
          modeCode: String(m.modeCode),
          name: m.name,
        },
      })),
    [modes]
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

  const tabs = [
    { id: 'sections' as const, label: `Sections (${sections.length})` },
    { id: 'fields' as const, label: `Fields (${fields.length})` },
    { id: 'modes' as const, label: `Modes (${modes.length})` },
    { id: 'matrix' as const, label: 'Mode matrix' },
    { id: 'validations' as const, label: 'Validations' },
    { id: 'processes' as const, label: 'Processes' },
    { id: 'events' as const, label: 'Events' },
    { id: 'actions' as const, label: `Actions (${actions.length})` },
  ]

  return (
    <Stack direction="vertical" spacing="md">
      {embedded ? (
        <div className="flex items-center justify-between gap-2">
          <Typography weight="medium" variant="small">
            Screen structure
          </Typography>
          <Button
            size="sm"
            variant="outline"
            loading={exporting}
            onClick={async () => {
              try {
                const result = await exportScreen(screen.id)
                if (result) toast.success(`Exported ${result.filename}`)
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            }}
          >
            Export Excel
          </Button>
        </div>
      ) : null}

      <div
        className="flex flex-wrap gap-1 border-b border-neutral-200"
        role="tablist"
        aria-label="Screen structure"
      >
        {tabs.map((item) => {
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
      {modesError ? <Typography tone="error">{modesError}</Typography> : null}

      <Typography variant="caption" tone="muted">
        {SCREEN_STRUCTURE_TAB_HINTS[tab]}
      </Typography>

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
          renderRowAction={(item) => (
            <Button size="sm" variant="ghost" onClick={() => {
              setBindError(null)
              setBindSectionId(item.id)
            }}>
              Bind component
            </Button>
          )}
        />
      ) : null}

      {tab === 'fields' ? (
        <Stack direction="vertical" spacing="sm">
          <ScreenStructureEditor
            columns={FIELD_COLS}
            items={fieldItems}
            emptyLabel="No fields yet."
            addTitle="Add fields"
            editTitle="Edit fields"
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
            renderRowAction={(item) => (
              <Button size="sm" variant="ghost" onClick={() => setSpecFieldId(item.id)}>
                Bind
              </Button>
            )}
          />
        </Stack>
      ) : null}

      {tab === 'modes' ? (
        <ScreenStructureEditor
          columns={MODE_COLS}
          items={modeItems}
          emptyLabel="No modes yet."
          addTitle="Add modes"
          editTitle="Edit modes"
          itemLabel="mode"
          onCreate={async (values) => {
            await createMode({
              modeCode: values.modeCode.trim() || 'CREATE',
              name: values.name.trim() || values.modeCode.trim(),
            })
          }}
          onUpdate={async (id, values) => {
            await updateMode(id, { name: values.name.trim() })
          }}
          onDelete={removeMode}
        />
      ) : null}

      {tab === 'matrix' ? (
        <ScreenModeMatrixPanel
          workspaceId={workspaceId}
          screenId={screen.id}
          fields={fields}
          modes={activeModes}
        />
      ) : null}

      {tab === 'validations' ? (
        <ScreenValidationsPanel
          workspaceId={workspaceId}
          screenId={screen.id}
          modes={activeModes}
          fields={fields}
        />
      ) : null}

      {tab === 'processes' ? (
        <ScreenProcessItemsPanel
          workspaceId={workspaceId}
          screenId={screen.id}
          modes={activeModes}
          fields={fields}
        />
      ) : null}

      {tab === 'events' ? (
        <ScreenEventItemsPanel
          workspaceId={workspaceId}
          screenId={screen.id}
          modes={activeModes}
          fields={fields}
          screens={screens}
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

      <FieldSpecDrawer
        open={Boolean(specFieldId)}
        onClose={() => setSpecFieldId(null)}
        workspaceId={workspaceId}
        screenId={screen.id}
        fieldId={specFieldId}
        modes={activeModes}
        components={components}
        entities={entities}
        onSaved={() => void refetch()}
      />
      <ScreenSectionBindComponentModal
        open={Boolean(bindSectionId)}
        onClose={() => {
          if (bindSaving) return
          setBindSectionId(null)
          setBindError(null)
        }}
        sectionName={sections.find((s) => s.id === bindSectionId)?.name ?? 'Section'}
        components={components}
        saving={bindSaving}
        error={bindError}
        onBind={async (componentId) => {
          if (!bindSectionId) return
          setBindSaving(true)
          setBindError(null)
          try {
            const result = await bind(bindSectionId, { componentId, displayOrder: 0 })
            const keys = result?.importedFieldKeys?.length
              ? result.importedFieldKeys.join(', ')
              : ''
            toast.success(
              result
                ? `Imported ${result.fieldsImported} field${result.fieldsImported === 1 ? '' : 's'}${keys ? `: ${keys}` : ''}`
                : 'Component bound'
            )
            setBindSectionId(null)
            await refetch()
          } catch (err) {
            setBindError(err instanceof Error ? err.message : 'Failed to bind component')
          } finally {
            setBindSaving(false)
          }
        }}
      />
    </Stack>
  )
}
