'use client'

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { Button, Checkbox, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import { draftFromModeConfig, findModeConfig } from '../../domain/rules/mode-config.rules'
import {
  fieldComponentGroupHeading,
  groupFieldsByComponent,
  shouldShowComponentGroups,
} from '../../domain/rules/field-groups.rules'
import { FieldGroupHeading } from '../../../ui/FieldGroupHeading'
import { useFieldModeConfigs } from '../hooks/useFieldModeConfigs'
import type { ModeConfigDraft, ScreenFieldModeConfig, ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreenField } from '../../../model/application-registry'
import type { SpecCatalogComponent } from './FieldSpecDrawer'

function modeSummary(draft: ModeConfigDraft): string {
  return [
    draft.isVisible ? 'Visible' : 'Hidden',
    draft.isReadonly ? 'Readonly' : 'Editable',
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
  field,
  modes,
  configs,
}: {
  field: RegistryScreenField
  modes: ScreenMode[]
  configs: ScreenFieldModeConfig[] | undefined
}) {
  const drafts = draftsFromDetail(modes, configs)

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

function isDraftDirty(drafts: ModeConfigDraft[], baseline: ModeConfigDraft[]): boolean {
  return drafts.some((draft, index) => {
    const orig = baseline[index]
    if (!orig) return true
    return (
      draft.isVisible !== orig.isVisible ||
      draft.isReadonly !== orig.isReadonly ||
      (draft.defaultValue ?? '') !== (orig.defaultValue ?? '')
    )
  })
}

function MatrixEditRow({
  field,
  modes,
  drafts,
  error,
  onChange,
}: {
  field: RegistryScreenField
  modes: ScreenMode[]
  drafts: ModeConfigDraft[]
  error?: string | null
  onChange: (modeId: string, patch: Partial<ModeConfigDraft>) => void
}) {
  return (
    <tr className="border-b border-neutral-200">
      <FieldNameCell field={field} error={error} />
      {modes.map((mode) => {
        const draft = drafts.find((d) => d.modeId === mode.id)
        if (!draft) return <td key={mode.id} className="px-3.5 py-2.5" />
        return (
          <td key={mode.id} className="px-3.5 py-2.5 align-top">
            <ModeControlStack
              draft={draft}
              mode={mode}
              onChange={(patch) => onChange(mode.id, patch)}
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
                  className="flex items-start gap-1.5 text-left"
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
                      'mt-1 shrink-0 text-neutral-500 transition-transform',
                      !open && '-rotate-90'
                    )}
                  />
                  <FieldGroupHeading
                    className="min-w-0 flex-1"
                    {...fieldComponentGroupHeading(group)}
                  />
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
  fields,
  modes,
  components,
  componentIdBySectionId,
  byFieldId,
  onDirtyChange,
  saveRef,
  saveFieldConfigs,
}: {
  fields: RegistryScreenField[]
  modes: ScreenMode[]
  components: SpecCatalogComponent[]
  componentIdBySectionId?: Record<string, string>
  byFieldId: Record<string, ScreenFieldModeConfig[]>
  onDirtyChange: (dirty: boolean) => void
  saveRef: MutableRefObject<(() => Promise<void>) | null>
  saveFieldConfigs: (
    fieldId: string,
    drafts: ModeConfigDraft[],
    fieldRequired: boolean | null | undefined
  ) => Promise<void>
}) {
  const [draftsByField, setDraftsByField] = useState<Record<string, ModeConfigDraft[]>>({})
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  useEffect(() => {
    setDraftsByField((prev) => {
      const next = { ...prev }
      for (const field of fields) {
        if (!(field.id in byFieldId)) continue
        const baseline = draftsFromDetail(modes, byFieldId[field.id])
        const current = prev[field.id]
        if (!current || !isDraftDirty(current, baseline)) {
          next[field.id] = baseline
        }
      }
      return next
    })
  }, [byFieldId, fields, modes])

  const dirtyIds = useMemo(() => {
    return fields
      .filter((field) =>
        isDraftDirty(draftsByField[field.id] ?? [], draftsFromDetail(modes, byFieldId[field.id]))
      )
      .map((field) => field.id)
  }, [byFieldId, draftsByField, fields, modes])

  useEffect(() => {
    onDirtyChange(dirtyIds.length > 0)
  }, [dirtyIds, onDirtyChange])

  useEffect(() => {
    saveRef.current = async () => {
      for (const field of fields) {
        if (!dirtyIds.includes(field.id)) continue
        const drafts = draftsByField[field.id]
        if (!drafts) continue
        try {
          await saveFieldConfigs(field.id, drafts, field.required)
          setErrors((prev) => ({ ...prev, [field.id]: null }))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to save'
          setErrors((prev) => ({ ...prev, [field.id]: message }))
          throw err
        }
      }
    }
    return () => {
      saveRef.current = null
    }
  }, [dirtyIds, draftsByField, fields, saveFieldConfigs, saveRef])

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
            field={field}
            modes={modes}
            drafts={draftsByField[field.id] ?? draftsFromDetail(modes, byFieldId[field.id])}
            error={errors[field.id]}
            onChange={(modeId, patch) =>
              setDraftsByField((prev) => ({
                ...prev,
                [field.id]: (prev[field.id] ?? draftsFromDetail(modes, byFieldId[field.id])).map(
                  (draft) => (draft.modeId === modeId ? { ...draft, ...patch } : draft)
                ),
              }))
            }
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
  const fieldIds = useMemo(() => fields.map((field) => field.id), [fields])
  const { byFieldId, saveFieldConfigs } = useFieldModeConfigs(workspaceId, screenId, fieldIds)
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveRef = useRef<(() => Promise<void>) | null>(null)

  if (modes.length === 0) {
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
      <MatrixTable modes={modes}>
        <MatrixTableHead modes={modes} />
        <MatrixFieldGroups
          fields={fields}
          components={components}
          componentIdBySectionId={componentIdBySectionId}
          colSpan={1 + modes.length}
          renderRow={(field) => (
            <MatrixViewRow
              key={field.id}
              field={field}
              modes={modes}
              configs={byFieldId[field.id]}
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
          fields={fields}
          modes={modes}
          components={components}
          componentIdBySectionId={componentIdBySectionId}
          byFieldId={byFieldId}
          onDirtyChange={setDirty}
          saveRef={saveRef}
          saveFieldConfigs={saveFieldConfigs}
        />
      </Modal>
    </div>
  )
}
