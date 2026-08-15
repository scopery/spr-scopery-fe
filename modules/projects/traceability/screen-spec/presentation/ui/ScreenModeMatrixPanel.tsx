'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button, Checkbox, Select, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
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

function requiredLabel(value: ModeConfigDraft['required']): string {
  if (value === RequiredOverride.Required) return 'Required'
  if (value === RequiredOverride.Optional) return 'Not required'
  return 'Inherit'
}

function FieldModeConfigPane({
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
  const { field: detail, loading, saveModeConfigs } = useScreenFieldSpec(workspaceId, screenId, field.id)
  const [drafts, setDrafts] = useState<ModeConfigDraft[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  useEffect(() => {
    const configs = detail?.modeConfigs ?? []
    setDrafts(
      modes.map((mode) => draftFromModeConfig(mode.id, configs.find((c) => c.modeId === mode.id)))
    )
    setEditing(false)
    setRowError(null)
  }, [detail, modes, field.id])

  const updateDraft = (modeId: string, patch: Partial<ModeConfigDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.modeId === modeId ? { ...d, ...patch } : d)))
  }

  const handleSave = async () => {
    setSaving(true)
    setRowError(null)
    try {
      await saveModeConfigs(drafts, field.required)
      setEditing(false)
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const configs = detail?.modeConfigs ?? []
    setDrafts(
      modes.map((mode) => draftFromModeConfig(mode.id, configs.find((c) => c.modeId === mode.id)))
    )
    setEditing(false)
    setRowError(null)
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Typography weight="medium" variant="small">
            {field.label}
          </Typography>
          <Typography variant="caption" tone="muted">
            {field.fieldKey}
          </Typography>
        </div>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={saving} onClick={() => void handleSave()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" disabled={saving} onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" disabled={loading} onClick={() => setEditing(true)}>
            <Pencil size={14} className="mr-1 inline" />
            Edit
          </Button>
        )}
      </div>
      {rowError ? (
        <Typography variant="caption" className="text-error">
          {rowError}
        </Typography>
      ) : null}
      {loading && drafts.length === 0 ? (
        <Typography variant="small" tone="muted">
          Loading mode settings…
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-200">
          {modes.map((mode) => {
            const draft = drafts.find((d) => d.modeId === mode.id)
            if (!draft) return null
            return (
              <li key={mode.id} className="px-3 py-3">
                <Typography variant="small" className="font-medium">
                  {mode.name}
                </Typography>
                <Typography variant="caption" tone="muted" className="mb-2 block">
                  {mode.modeCode}
                </Typography>
                {editing ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-neutral-700">
                      <Checkbox
                        size="sm"
                        checked={draft.isVisible}
                        onChange={() => updateDraft(mode.id, { isVisible: !draft.isVisible })}
                      />
                      Visible
                    </label>
                    <label className="flex items-center gap-2 text-xs text-neutral-700">
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
                  </div>
                ) : (
                  <Typography variant="small" tone="muted">
                    {draft.isVisible ? 'Visible' : 'Hidden'}
                    {' · '}
                    {draft.isReadonly ? 'Readonly' : 'Editable'}
                    {' · '}
                    {requiredLabel(draft.required)}
                  </Typography>
                )}
              </li>
            )
          })}
        </ul>
      )}
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
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(fields[0]?.id ?? null)

  useEffect(() => {
    if (selectedFieldId && fields.some((field) => field.id === selectedFieldId)) return
    setSelectedFieldId(fields[0]?.id ?? null)
  }, [fields, selectedFieldId])

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null

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
    <div className="flex min-h-[360px] min-w-0 border border-neutral-200">
      <aside className="flex w-44 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
        <Typography variant="caption" tone="muted" className="border-b border-neutral-200 px-3 py-2">
          Fields
        </Typography>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {fields.map((field) => {
            const activeField = selectedFieldId === field.id
            return (
              <li key={field.id}>
                <button
                  type="button"
                  onClick={() => setSelectedFieldId(field.id)}
                  className={cn(
                    'flex w-full flex-col items-start border-b border-neutral-100 px-3 py-2 text-left',
                    activeField ? 'bg-white' : 'hover:bg-white'
                  )}
                >
                  <Typography variant="small">{field.fieldKey}</Typography>
                  <Typography variant="caption" tone="muted" className="block truncate">
                    {field.label}
                  </Typography>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto p-md">
        {selectedField ? (
          <FieldModeConfigPane
            key={selectedField.id}
            workspaceId={workspaceId}
            screenId={screenId}
            field={selectedField}
            modes={active}
          />
        ) : (
          <Typography variant="small" tone="muted">
            Select a field to review mode settings.
          </Typography>
        )}
      </div>
    </div>
  )
}
