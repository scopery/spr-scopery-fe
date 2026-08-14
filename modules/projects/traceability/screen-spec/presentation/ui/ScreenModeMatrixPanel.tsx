'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Select, Typography } from '@/shared/ui'
import { RequiredOverride } from '../../domain/enums/screen-spec.enum'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import { draftFromModeConfig } from '../../domain/rules/mode-config.rules'
import { useScreenFieldSpec } from '../hooks/useScreenFieldSpec'
import type { ModeConfigDraft, ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreenField } from '../../../model/application-registry'

const REQUIRED_OPTIONS = [
  { value: RequiredOverride.Inherit, label: 'Inherit' },
  { value: RequiredOverride.Required, label: 'Required' },
  { value: RequiredOverride.Optional, label: 'Not required' },
]

function MatrixRow({
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
  const { field: detail, saveModeConfigs } = useScreenFieldSpec(workspaceId, screenId, field.id)
  const [drafts, setDrafts] = useState<ModeConfigDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  useEffect(() => {
    const configs = detail?.modeConfigs ?? []
    setDrafts(
      modes.map((mode) => draftFromModeConfig(mode.id, configs.find((c) => c.modeId === mode.id)))
    )
  }, [detail, modes])

  const updateDraft = (modeId: string, patch: Partial<ModeConfigDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.modeId === modeId ? { ...d, ...patch } : d)))
  }

  const handleSave = async () => {
    setSaving(true)
    setRowError(null)
    try {
      await saveModeConfigs(drafts, field.required)
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

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
        <Button size="sm" variant="ghost" className="mt-1" loading={saving} onClick={() => void handleSave()}>
          Save
        </Button>
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
              onValueChange={(v: string) => updateDraft(mode.id, { required: v as ModeConfigDraft['required'] })}
              options={REQUIRED_OPTIONS}
            />
          </td>
        )
      })}
    </tr>
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="sticky left-0 bg-white px-2 py-2 text-xs font-medium text-neutral-500">Field</th>
            {active.map((mode) => (
              <th key={mode.id} className="px-2 py-2 text-xs font-medium text-neutral-500">
                {mode.name}
                <span className="block font-normal text-neutral-400">{mode.modeCode}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <MatrixRow
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
  )
}
