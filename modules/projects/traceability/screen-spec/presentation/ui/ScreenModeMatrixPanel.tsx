'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Button, Checkbox, Modal, Select, Typography } from '@/shared/ui'
import { RequiredOverride } from '../../domain/enums/screen-spec.enum'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import { draftFromModeConfig } from '../../domain/rules/mode-config.rules'
import { useScreenFieldSpec } from '../hooks/useScreenFieldSpec'
import type { ModeConfigDraft, ScreenFieldModeConfig, ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreenField } from '../../../model/application-registry'

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
  ].join(' · ')
}

function draftsFromDetail(
  modes: ScreenMode[],
  configs: ScreenFieldModeConfig[] | undefined
): ModeConfigDraft[] {
  return modes.map((mode) => draftFromModeConfig(mode.id, configs?.find((c) => c.modeId === mode.id)))
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
    <tr className="border-t border-neutral-200">
      <td className="sticky left-0 bg-white px-2 py-2 align-top">
        <Typography variant="small" className="font-medium">
          {field.label}
        </Typography>
        <Typography variant="caption" tone="muted">
          {field.fieldKey}
        </Typography>
      </td>
      {modes.map((mode, index) => {
        const draft = drafts[index]
        return (
          <td key={mode.id} className="min-w-[9.5rem] px-2 py-2 align-top">
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
      draft.required !== orig.required
    )
  })

  const updateDraft = (modeId: string, patch: Partial<ModeConfigDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.modeId === modeId ? { ...d, ...patch } : d)))
  }

  const save = useCallback(async () => {
    setRowError(null)
    try {
      await saveModeConfigs(drafts, field.required)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setRowError(message)
      throw err
    }
  }, [drafts, field.required, saveModeConfigs])

  useEffect(() => {
    onState(field.id, { dirty, save, error: rowError })
  }, [dirty, field.id, onState, rowError, save])

  return (
    <tr className="border-t border-neutral-200">
      <td className="sticky left-0 bg-white px-2 py-2 align-top">
        <Typography variant="small" className="font-medium">
          {field.label}
        </Typography>
        <Typography variant="caption" tone="muted">
          {field.fieldKey}
        </Typography>
        {rowError ? (
          <Typography variant="caption" className="text-error">
            {rowError}
          </Typography>
        ) : null}
      </td>
      {modes.map((mode) => {
        const draft = drafts.find((d) => d.modeId === mode.id)
        if (!draft) return <td key={mode.id} className="px-2 py-2" />
        return (
          <td key={mode.id} className="min-w-[9.5rem] px-2 py-2 align-top">
            <label className="mb-1 flex items-center gap-2 text-xs text-neutral-700">
              <Checkbox
                size="sm"
                checked={draft.isVisible}
                onChange={() => updateDraft(mode.id, { isVisible: !draft.isVisible })}
              />
              Visible
            </label>
            <label className="mb-1 flex items-center gap-2 text-xs text-neutral-700">
              <Checkbox
                size="sm"
                checked={draft.isReadonly}
                onChange={() => updateDraft(mode.id, { isReadonly: !draft.isReadonly })}
              />
              Readonly
            </label>
            <Select
              size="sm"
              value={draft.required}
              onValueChange={(v: string) =>
                updateDraft(mode.id, { required: v as ModeConfigDraft['required'] })
              }
              options={REQUIRED_OPTIONS}
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
        <th className="sticky left-0 bg-white px-2 py-2 text-xs font-medium text-neutral-500">
          Field
        </th>
        {modes.map((mode) => (
          <th key={mode.id} className="px-2 py-2 text-xs font-medium text-neutral-500">
            {mode.name}
            <span className="block font-normal text-neutral-400">{mode.modeCode}</span>
          </th>
        ))}
      </tr>
    </thead>
  )
}

function ModeMatrixEditor({
  workspaceId,
  screenId,
  fields,
  modes,
  onDirtyChange,
  saveRef,
}: {
  workspaceId: string
  screenId: string
  fields: RegistryScreenField[]
  modes: ScreenMode[]
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left">
        <MatrixTableHead modes={modes} />
        <tbody>
          {fields.map((field) => (
            <MatrixEditRow
              key={field.id}
              workspaceId={workspaceId}
              screenId={screenId}
              field={field}
              modes={modes}
              onState={onState}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ScreenModeMatrixPanel({
  workspaceId,
  screenId,
  fields,
  modes,
}: {
  workspaceId: string
  screenId: string
  fields: RegistryScreenField[]
  modes: ScreenMode[]
}) {
  const active = useMemo(() => modes, [modes])
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left">
          <MatrixTableHead modes={active} />
          <tbody>
            {fields.map((field) => (
              <MatrixViewRow
                key={field.id}
                workspaceId={workspaceId}
                screenId={screenId}
                field={field}
                modes={active}
              />
            ))}
          </tbody>
        </table>
      </div>
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
          workspaceId={workspaceId}
          screenId={screenId}
          fields={fields}
          modes={active}
          onDirtyChange={setDirty}
          saveRef={saveRef}
        />
      </Modal>
    </div>
  )
}
