'use client'

import { useMemo, useState } from 'react'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import type { RegistryScreen } from '../model/application-registry'
import { useScreenDetail } from '../hooks/useScreenDetail'
import { ScreenStructureEditor } from './ScreenStructureEditor'
import type { StructureItemGroup } from './StructureGroupBlocks'
import {
  fieldComponentGroupLabel,
  fieldSectionGroupLabel,
  groupFieldsByComponent,
  groupFieldsBySection,
  shouldShowComponentGroups,
  shouldShowSectionGroups,
} from '../screen-spec/domain/rules/field-groups.rules'
import {
  SCREEN_FIELD_TYPE_OPTIONS,
  SCREEN_MODE_CODE_OPTIONS,
} from '../screen-spec/domain/enums/screen-spec.enum'
import { useScreenModes } from '../screen-spec/presentation/hooks/useScreenModes'
import { useBindComponentToSection } from '../screen-spec/presentation/hooks/useBindComponentToSection'
import { useApplyFieldDefault } from '../screen-spec/presentation/hooks/useApplyFieldDefault'
import {
  FieldSpecDrawer,
  type FieldSpecDrawerTab,
  type SpecCatalogComponent,
} from '../screen-spec/presentation/ui/FieldSpecDrawer'
import { ScreenModeMatrixPanel } from '../screen-spec/presentation/ui/ScreenModeMatrixPanel'
import { useScreenSpecExcelExport } from '../screen-spec/presentation/hooks/useScreenSpecExcelExport'
import { SCREEN_STRUCTURE_TAB_HINTS } from '../screen-spec/presentation/ui/ScreenSpecHowTo'
import {
  ScreenEventItemsPanel,
  ScreenProcessItemsPanel,
} from '../screen-spec/presentation/ui/ScreenNarrativeItemsPanel'
import { ScreenValidationsPanel } from '../screen-spec/presentation/ui/ScreenValidationsPanel'
import { useScreenValidations } from '../screen-spec/presentation/hooks/useFieldValidations'
import { ScreenSectionBindComponentModal } from '../screen-spec/presentation/ui/ScreenSectionBindComponentModal'
import { ScreenLinkedComponentsPanel } from '../screen-spec/presentation/ui/ScreenLinkedComponentsPanel'
import { ScreenMockupUpload } from '../screen-spec/presentation/ui/SpecImageUpload'
import { useScreenComponents } from '../screen-spec/presentation/hooks/useScreenComponents'
import type { SpecCatalogEntity } from '../screen-spec/presentation/ui/ComponentSpecPanel'

type ScreenDetailTab =
  | 'sections'
  | 'fields'
  | 'components'
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

function FieldStatusChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mr-1 inline-flex items-center px-1.5 py-0.5 text-[11px]',
        active ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-400'
      )}
    >
      {children}
    </button>
  )
}

const SECTION_BASE_COLS = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Main form' },
  { key: 'description', label: 'Description', placeholder: 'Optional' },
] as const

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
  { key: 'defaultValue', label: 'Default', placeholder: 'Optional', createOnly: true },
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

function toScreenFieldBody(values: Record<string, string>) {
  return {
    fieldKey: values.fieldKey.trim(),
    label: values.label.trim(),
    fieldType: values.fieldType.trim() || 'TEXT',
    required: values.required === 'true',
    remark: values.remark.trim() || null,
  }
}

function fieldDefault(values: Record<string, string>): string | null {
  return values.defaultValue?.trim() || null
}

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
    createFieldsBulk,
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
  const applyFieldDefault = useApplyFieldDefault(workspaceId, screen.id)
  const { items: linkedComponents, refetch: refetchLinked } = useScreenComponents(
    workspaceId,
    screen.id
  )
  const [tab, setTab] = useState<ScreenDetailTab>('sections')
  const [specFieldId, setSpecFieldId] = useState<string | null>(null)
  const [specFieldTab, setSpecFieldTab] = useState<FieldSpecDrawerTab>('links')
  const [bindSectionId, setBindSectionId] = useState<string | null>(null)
  const [bindSaving, setBindSaving] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)
  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields])
  const { items: screenValidations, refetch: refetchValidations } = useScreenValidations(
    workspaceId,
    screen.id,
    fieldIds
  )
  const validationCountByField = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of screenValidations) {
      map.set(item.fieldId, (map.get(item.fieldId) ?? 0) + 1)
    }
    return map
  }, [screenValidations])

  const openFieldSetup = (fieldId: string, nextTab: FieldSpecDrawerTab = 'links') => {
    setSpecFieldTab(nextTab)
    setSpecFieldId(fieldId)
  }

  const componentBySectionId = useMemo(() => {
    const map = new Map<string, string>()
    for (const link of linkedComponents) {
      if (link.sectionId) map.set(link.sectionId, link.componentId)
    }
    return map
  }, [linkedComponents])
  const sectionComponentIds = useMemo(
    () => Object.fromEntries(componentBySectionId),
    [componentBySectionId]
  )

  const linkedComponentIds = useMemo(
    () => new Set(linkedComponents.map((l) => l.componentId)),
    [linkedComponents]
  )

  const sectionCols = useMemo(() => {
    const catalogOptions = components.map((c) => ({
      value: c.id,
      label: `${c.code} · ${c.name}`,
    }))
    return [
      ...SECTION_BASE_COLS,
      {
        key: 'componentId',
        label: 'Component',
        createOnly: true,
        options: [{ value: '', label: 'None' }, ...catalogOptions],
        createOptions: [
          { value: '', label: 'None' },
          ...catalogOptions.filter((c) => !linkedComponentIds.has(c.value)),
        ],
      },
    ]
  }, [components, linkedComponentIds])

  const sectionItems = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        values: {
          name: s.name,
          description: s.description ?? '',
          componentId: componentBySectionId.get(s.id) ?? '',
        },
      })),
    [sections, componentBySectionId]
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
          remark: '',
        },
      })),
    [fields]
  )

  const fieldGroups = useMemo((): StructureItemGroup[] | undefined => {
    const catalog = components.map((c) => ({ id: c.id, code: c.code, name: c.name }))
    const sectionGroups = groupFieldsBySection(
      fields,
      sections.map((s) => ({ id: s.id, name: s.name })),
      catalog,
      sectionComponentIds
    )
    if (shouldShowSectionGroups(sectionGroups)) {
      return sectionGroups.map((group) => ({
        key: group.key,
        label: fieldSectionGroupLabel(group),
        itemIds: group.fields.map((field) => field.id),
      }))
    }
    const componentGroups = groupFieldsByComponent(fields, catalog, sectionComponentIds)
    if (!shouldShowComponentGroups(componentGroups)) return undefined
    return componentGroups.map((group) => ({
      key: group.key,
      label: fieldComponentGroupLabel(group),
      itemIds: group.fields.map((field) => field.id),
    }))
  }, [components, fields, sectionComponentIds, sections])

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
    { id: 'components' as const, label: 'Components' },
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
                const result = await exportScreen(screen.id, screen.applicationId)
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

      <ScreenMockupUpload
        key={screen.id}
        workspaceId={workspaceId}
        screenId={screen.id}
        initialUrl={screen.mockupUrl}
      />

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
          columns={sectionCols}
          items={sectionItems}
          emptyLabel="No sections yet."
          addTitle="Add sections"
          editTitle="Edit sections"
          itemLabel="section"
          onCreate={async (values) => {
            const created = await createSection({
              name: values.name.trim(),
              description: values.description.trim() || null,
            })
            const componentId = values.componentId?.trim()
            if (!created?.id || !componentId) return
            const result = await bind(created.id, { componentId, displayOrder: 0 })
            const keys = result?.importedFieldKeys?.length
              ? result.importedFieldKeys.join(', ')
              : ''
            toast.success(
              result
                ? `Imported ${result.fieldsImported} field${result.fieldsImported === 1 ? '' : 's'}${keys ? `: ${keys}` : ''}`
                : 'Component bound'
            )
            await refetch()
            await refetchLinked()
            void refetchValidations()
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
              {item.values.componentId ? 'Change component' : 'Bind component'}
            </Button>
          )}
        />
      ) : null}

      {tab === 'fields' ? (
        <Stack direction="vertical" spacing="sm">
          <ScreenStructureEditor
            columns={FIELD_COLS}
            items={fieldItems}
            itemGroups={fieldGroups}
            emptyLabel="No fields yet."
            addTitle="Add fields"
            editTitle="Edit fields"
            itemLabel="field"
            onCreate={async (values) => {
              const created = await createField(toScreenFieldBody(values))
              const defaultValue = fieldDefault(values)
              if (created?.id && defaultValue) {
                await applyFieldDefault(created.id, defaultValue, modes, values.required === 'true')
              }
            }}
            onCreateMany={async (rows) => createFieldsBulk(rows.map(toScreenFieldBody))}
            onUpdate={async (id, values) => {
              await updateField(id, {
                label: values.label.trim(),
                fieldType: values.fieldType.trim() || 'TEXT',
                required: values.required === 'true',
                remark: values.remark.trim() || null,
              })
            }}
            onDelete={removeField}
            renderRowAction={(item) => (
              <Button size="sm" variant="ghost" onClick={() => openFieldSetup(item.id, 'links')}>
                Configure
              </Button>
            )}
            renderRowStatus={(item) => {
              const field = fields.find((f) => f.id === item.id)
              if (!field) return null
              const component = field.componentId
                ? components.find((c) => c.id === field.componentId)
                : null
              const ruleCount = validationCountByField.get(field.id) ?? 0
              return (
                <div>
                  {field.componentFieldId ? (
                    <FieldStatusChip
                      active
                      onClick={() => openFieldSetup(field.id, 'links')}
                    >
                      Copied
                    </FieldStatusChip>
                  ) : null}
                  {component || field.componentId ? (
                    <FieldStatusChip
                      active
                      onClick={() => openFieldSetup(field.id, 'links')}
                    >
                      {component ? `Component · ${component.code}` : 'Component'}
                    </FieldStatusChip>
                  ) : null}
                  {field.dataEntityFieldId ? (
                    <FieldStatusChip
                      active
                      onClick={() => openFieldSetup(field.id, 'links')}
                    >
                      Column
                    </FieldStatusChip>
                  ) : null}
                  <FieldStatusChip
                    active={ruleCount > 0}
                    onClick={() => openFieldSetup(field.id, 'validations')}
                  >
                    {ruleCount > 0
                      ? `${ruleCount} rule${ruleCount === 1 ? '' : 's'}`
                      : 'No rules'}
                  </FieldStatusChip>
                </div>
              )
            }}
          />
        </Stack>
      ) : null}

      {tab === 'components' ? (
        <ScreenLinkedComponentsPanel
          workspaceId={workspaceId}
          screenId={screen.id}
          components={components}
          sections={sections}
          onChanged={() => {
            void refetch()
            void refetchValidations()
          }}
        />
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
          components={components}
          componentIdBySectionId={sectionComponentIds}
        />
      ) : null}

      {tab === 'validations' ? (
        <ScreenValidationsPanel
          workspaceId={workspaceId}
          screenId={screen.id}
          modes={activeModes}
          fields={fields}
          components={components}
          componentIdBySectionId={sectionComponentIds}
          onChanged={() => void refetchValidations()}
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
          layout="masterDetail"
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
        initialTab={specFieldTab}
        onSaved={() => {
          void refetch()
          void refetchValidations()
        }}
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
            await refetchLinked()
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
