'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { Button, Checkbox, Input, Modal, Select, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { RequiredOverride } from '../../domain/enums/screen-spec.enum'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import { draftFromModeConfig, findModeConfig } from '../../domain/rules/mode-config.rules'
import {
  UNGROUPED_COMPONENT_KEY,
  groupFieldsByComponent,
  shouldShowComponentGroups,
} from '../../domain/rules/field-groups.rules'
import { useScreenFieldSpec } from '../hooks/useScreenFieldSpec'
import type { ModeConfigDraft, ScreenFieldModeConfig, ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreenField } from '../../../model/application-registry'
import type { SpecCatalogComponent } from './FieldSpecDrawer'

function componentGroupLabel(group: {
  key: string
  component: { code: string; name: string } | null
}): string {
  if (group.component) return `${group.component.code} · ${group.component.name}`
  if (group.key !== UNGROUPED_COMPONENT_KEY) return 'Linked component'
  return 'No component'
}

const REQUIRED_OPTIONS = [
  { value: RequiredOverride.Inherit, label: 'Inherit' },
  { value: RequiredOverride.Required, label: 'Required' },
  { value: RequiredOverride.Optional, label: 'Not required' },
]

function requiredLabel(value: ModeConfigDraft['required']): string {
  if (value === RequiredOverride.Required) return 'Required'
  if (value === RequiredOverride.Optional) return 'Not required'
  return 'Inherit'
}

function modeSummary(draft: ModeConfigDraft): string {
  return [
    draft.isVisible ? 'Visible' : 'Hidden',
    draft.isReadonly ? 'Readonly' : 'Editable',
    requiredLabel(draft.required),
    draft.defaultValue ? `Default ${draft.defaultValue}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function draftsFromDetail(
  modes: ScreenMode[],
  configs: ScreenFieldModeConfig[] | undefined
): ModeConfigDraft[] {
  return modes.map((mode) => draftFromModeConfig(mode.id, findModeConfig(configs, mode)))
}

function FieldNameCell({
  field,
  error,
}: {
  field: RegistryScreenField
  error?: string | null
}) {
  return (
    <td className="sticky left-0 w-[28%] max-w-[12rem] bg-white px-3 py-2.5 align-top">
      <Typography variant="small" weight="medium" className="block leading-5">
        {field.label}
      </Typography>
      <Typography variant="caption" className="block text-[11px] leading-4 text-neutral-400">
        {field.fieldKey}
      </Typography>
      {error ? (
        <Typography variant="caption" className="text-error">
          {error}
        </Typography>
      ) : null}
    </td>
  )
}

function ModeControlStack({
  draft,
  mode,
  onChange,
}: {
  draft: ModeConfigDraft
  mode: ScreenMode
  onChange: (patch: Partial<ModeConfigDraft>) => void
}) {
  return (
    <div className="w-[10.5rem] space-y-1.5">
      <label className="grid grid-cols-[1.25rem_1fr] items-center gap-x-1.5 text-xs text-neutral-700">
        <Checkbox
          size="md"
          className="gap-0"
          checked={draft.isVisible}
          onChange={() => onChange({ isVisible: !draft.isVisible })}
          aria-label={`Visible · ${mode.name}`}
        />
        Visible
      </label>
      <label className="grid grid-cols-[1.25rem_1fr] items-center gap-x-1.5 text-xs text-neutral-700">
        <Checkbox
          size="md"
          className="gap-0"
          checked={draft.isReadonly}
          onChange={() => onChange({ isReadonly: !draft.isReadonly })}
          aria-label={`Readonly · ${mode.name}`}
        />
        Readonly
      </label>
      <Select
        size="sm"
        className="w-full"
        value={draft.required}
        onValueChange={(v: string) => onChange({ required: v as ModeConfigDraft['required'] })}
        options={REQUIRED_OPTIONS}
      />
      <Input
        size="sm"
        fullWidth
        value={draft.defaultValue ?? ''}
        onChange={(e) => onChange({ defaultValue: e.target.value || null })}
        placeholder="Default"
        aria-label={`Default · ${mode.name}`}
      />
    </div>
  )
}

function MatrixTable({
  modes,
  children,
}: {
  modes: ScreenMode[]
  children: ReactNode
}) {
  const modeWidth = `${72 / Math.max(modes.length, 1)}%`
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-3xl table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: '28%' }} />
          {modes.map((mode) => (
            <col key={mode.id} style={{ width: modeWidth }} />
          ))}
        </colgroup>
        {children}
      </table>
    </div>
  )
}

function MatrixViewRow({
  workspaceId,
  screenId,
  field,
  modes,
}: {
  workspaceId: string
  screenId: string
  field: RegistryScreenField
  modes: ScreenMode[]
}) {
  const { field: detail } = useScreenFieldSpec(workspaceId, screenId, field.id)
  const drafts = draftsFromDetail(modes, detail?.modeConfigs)

  return (
    <tr className="border-b border-neutral-200">
      <FieldNameCell field={field} />
      {modes.map((mode, index) => {
        const draft = drafts[index]
        return (
          <td key={mode.id} className="px-3.5 py-2.5 align-top">
            <Typography variant="caption" tone="muted">
              {draft ? modeSummary(draft) : '—'}
            </Typography>
          </td>
        )
      })}
    </tr>
  )
}

function MatrixEditRow({
  workspaceId,
  screenId,
  field,
  modes,
  onState,
}: {
  workspaceId: string
  screenId: string
  field: RegistryScreenField
  modes: ScreenMode[]
  onState: (fieldId: string, state: { dirty: boolean; save: () => Promise<void>; error: string | null }) => void
}) {
  const { field: detail, saveModeConfigs } = useScreenFieldSpec(workspaceId, screenId, field.id)
  const [drafts, setDrafts] = useState<ModeConfigDraft[]>([])
  const [rowError, setRowError] = useState<string | null>(null)
  const baseline = useMemo(
    () => draftsFromDetail(modes, detail?.modeConfigs),
    [detail, modes]
  )

  useEffect(() => {
    setDrafts(baseline)
    setRowError(null)
  }, [baseline])

  const dirty = drafts.some((draft, index) => {
    const orig = baseline[index]
    if (!orig) return true
    return (
      draft.isVisible !== orig.isVisible ||
      draft.isReadonly !== orig.isReadonly ||
      draft.required !== orig.required ||
      (draft.defaultValue ?? '') !== (orig.defaultValue ?? '')
    )
  })

  const updateDraft = (modeId: string, patch: Partial<ModeConfigDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.modeId === modeId ? { ...d, ...patch } : d)))
  }

  const save = useCallback(async () => {
    setRowError(null)
    try {
      await saveModeConfigs(drafts, detail?.required ?? field.required)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setRowError(message)
      throw err
    }
  }, [detail?.required, drafts, field.required, saveModeConfigs])

  useEffect(() => {
    onState(field.id, { dirty, save, error: rowError })
  }, [dirty, field.id, onState, rowError, save])

  return (
    <tr className="border-b border-neutral-200">
      <FieldNameCell field={field} error={rowError} />
      {modes.map((mode) => {
        const draft = drafts.find((d) => d.modeId === mode.id)
        if (!draft) return <td key={mode.id} className="px-3.5 py-2.5" />
        return (
          <td key={mode.id} className="px-3.5 py-2.5 align-top">
            <ModeControlStack
              draft={draft}
              mode={mode}
              onChange={(patch) => updateDraft(mode.id, patch)}
            />
          </td>
        )
      })}
    </tr>
  )
}

function MatrixTableHead({ modes }: { modes: ScreenMode[] }) {
  return (
    <thead>
      <tr className="border-b border-neutral-200">
        <th className="sticky left-0 bg-white px-3 py-2 text-left text-xs font-semibold text-neutral-800">
          Field
        </th>
        {modes.map((mode) => (
          <th key={mode.id} className="px-3.5 py-2 text-left">
            <span className="block text-sm font-semibold uppercase tracking-wide text-neutral-900">
              {mode.modeCode}
            </span>
            <span className="block text-[11px] font-medium text-neutral-500">{mode.name}</span>
          </th>
        ))}
      </tr>
    </thead>
  )
}

function MatrixFieldGroups({
  fields,
  components,
  componentIdBySectionId,
  colSpan,
  renderRow,
}: {
  fields: RegistryScreenField[]
  components: SpecCatalogComponent[]
  componentIdBySectionId?: Record<string, string>
  colSpan: number
  renderRow: (field: RegistryScreenField) => ReactNode
}) {
  const groups = useMemo(
    () => groupFieldsByComponent(fields, components, componentIdBySectionId),
    [componentIdBySectionId, components, fields]
  )
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const showGroups = shouldShowComponentGroups(groups)

  if (!showGroups) {
    return <tbody>{fields.map((field) => renderRow(field))}</tbody>
  }

  return (
    <tbody>
      {groups.map((group) => {
        const open = !collapsed.has(group.key)
        return (
          <Fragment key={group.key}>
            <tr>
              <td colSpan={colSpan} className="sticky left-0 border-b border-neutral-200 bg-neutral-50 px-3 py-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-left"
                  aria-expanded={open}
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev)
                      if (next.has(group.key)) next.delete(group.key)
                      else next.add(group.key)
                      return next
                    })
                  }
                >
                  <ChevronDown
                    size={14}
                    className={cn(
                      'shrink-0 text-neutral-500 transition-transform',
                      !open && '-rotate-90'
                    )}
                  />
                  <Typography variant="small" className="font-medium">
                    {componentGroupLabel(group)}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {group.fields.length}
                  </Typography>
                </button>
              </td>
            </tr>
            {open ? group.fields.map((field) => renderRow(field)) : null}
          </Fragment>
        )
      })}
    </tbody>
  )
}

function ModeMatrixEditor({
  workspaceId,
  screenId,
  fields,
  modes,
  components,
  componentIdBySectionId,
  onDirtyChange,
  saveRef,
}: {
  workspaceId: string
  screenId: string
  fields: RegistryScreenField[]
  modes: ScreenMode[]
  components: SpecCatalogComponent[]
  componentIdBySectionId?: Record<string, string>
  onDirtyChange: (dirty: boolean) => void
  saveRef: MutableRefObject<(() => Promise<void>) | null>
}) {
  const rowState = useRef(
    new Map<string, { dirty: boolean; save: () => Promise<void>; error: string | null }>()
  )

  const onState = useCallback(
    (fieldId: string, state: { dirty: boolean; save: () => Promise<void>; error: string | null }) => {
      rowState.current.set(fieldId, state)
      onDirtyChange([...rowState.current.values()].some((row) => row.dirty))
    },
    [onDirtyChange]
  )

  useEffect(() => {
    saveRef.current = async () => {
      const dirtyRows = [...rowState.current.values()].filter((row) => row.dirty)
      for (const row of dirtyRows) {
        await row.save()
      }
    }
    return () => {
      saveRef.current = null
    }
  }, [saveRef])

  return (
    <MatrixTable modes={modes}>
      <MatrixTableHead modes={modes} />
      <MatrixFieldGroups
        fields={fields}
        components={components}
        componentIdBySectionId={componentIdBySectionId}
        colSpan={1 + modes.length}
        renderRow={(field) => (
          <MatrixEditRow
            key={field.id}
            workspaceId={workspaceId}
            screenId={screenId}
            field={field}
            modes={modes}
            onState={onState}
          />
        )}
      />
    </MatrixTable>
  )
}

export function ScreenModeMatrixPanel({
  workspaceId,
  screenId,
  fields,
  modes,
  components = [],
  componentIdBySectionId,
}: {
  workspaceId: string
  screenId: string
  fields: RegistryScreenField[]
  modes: ScreenMode[]
  components?: SpecCatalogComponent[]
  componentIdBySectionId?: Record<string, string>
}) {
  const active = useMemo(() => modes, [modes])
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewEpoch, setViewEpoch] = useState(0)
  const saveRef = useRef<(() => Promise<void>) | null>(null)

  if (active.length === 0) {
    return (
      <Typography variant="small" tone="muted">
        {ScreenSpecMessages.ADD_MODE_FIRST}
      </Typography>
    )
  }

  if (fields.length === 0) {
    return (
      <Typography variant="small" tone="muted">
        Add fields before configuring visibility.
      </Typography>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Edit matrix
        </Button>
      </div>
      <MatrixTable modes={active}>
        <MatrixTableHead modes={active} />
        <MatrixFieldGroups
          fields={fields}
          components={components}
          componentIdBySectionId={componentIdBySectionId}
          colSpan={1 + active.length}
          renderRow={(field) => (
            <MatrixViewRow
              key={`${field.id}-${viewEpoch}`}
              workspaceId={workspaceId}
              screenId={screenId}
              field={field}
              modes={active}
            />
          )}
        />
      </MatrixTable>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Mode matrix"
        size="full"
        actions={[
          { label: 'Close', onClick: () => setOpen(false), variant: 'ghost' },
          {
            label: 'Save',
            onClick: () => {
              void (async () => {
                if (!saveRef.current) return
                setSaving(true)
                try {
                  await saveRef.current()
                  setViewEpoch((n) => n + 1)
                  setOpen(false)
                } finally {
                  setSaving(false)
                }
              })()
            },
            variant: 'primary',
            disabled: !dirty || saving,
            loading: saving,
          },
        ]}
      >
        <ModeMatrixEditor
          workspaceId={workspaceId}
          screenId={screenId}
          fields={fields}
          modes={active}
          components={components}
          componentIdBySectionId={componentIdBySectionId}
          onDirtyChange={setDirty}
          saveRef={saveRef}
        />
      </Modal>
    </div>
  )
}
