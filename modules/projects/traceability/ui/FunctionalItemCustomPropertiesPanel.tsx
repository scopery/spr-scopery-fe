'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { Button, Input, Select, Stack, Typography } from '@/shared/ui'
import { CustomPropertyFieldType, type FunctionalItemCustomProperty } from '../model/functional-catalog'
import type { CreateCustomPropertyBody, UpdateCustomPropertyBody } from '../model/functional-catalog'

const FIELD_TYPE_OPTIONS = [
  { value: CustomPropertyFieldType.Text, label: 'Text' },
  { value: CustomPropertyFieldType.Number, label: 'Number' },
  { value: CustomPropertyFieldType.Date, label: 'Date' },
  { value: CustomPropertyFieldType.Boolean, label: 'Boolean' },
  { value: CustomPropertyFieldType.Url, label: 'URL' },
]

interface Props {
  properties: FunctionalItemCustomProperty[]
  loading?: boolean
  onAdd: (body: CreateCustomPropertyBody) => Promise<void>
  onUpdate: (id: string, body: UpdateCustomPropertyBody) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

interface EditState {
  propValue: string
  fieldType: string
}

interface NewRow {
  propKey: string
  propValue: string
  fieldType: string
}

const emptyNew = (): NewRow => ({ propKey: '', propValue: '', fieldType: CustomPropertyFieldType.Text })

export function FunctionalItemCustomPropertiesPanel({
  properties,
  loading,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ propValue: '', fieldType: 'TEXT' })
  const [newRow, setNewRow] = useState<NewRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (prop: FunctionalItemCustomProperty) => {
    setEditingId(prop.id)
    setEditState({ propValue: prop.propValue ?? '', fieldType: prop.fieldType })
    setNewRow(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError(null)
  }

  const commitEdit = async (id: string) => {
    setSaving(true)
    setError(null)
    try {
      await onUpdate(id, { propValue: editState.propValue, fieldType: editState.fieldType })
      setEditingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update property')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    setSaving(true)
    setError(null)
    try {
      await onRemove(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove property')
    } finally {
      setSaving(false)
    }
  }

  const startAdd = () => {
    setNewRow(emptyNew())
    setEditingId(null)
    setError(null)
  }

  const cancelAdd = () => {
    setNewRow(null)
    setError(null)
  }

  const commitAdd = async () => {
    if (!newRow || !newRow.propKey.trim()) {
      setError('Property key is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onAdd({
        propKey: newRow.propKey.trim(),
        propValue: newRow.propValue || undefined,
        fieldType: newRow.fieldType,
      })
      setNewRow(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add property')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack direction="vertical" spacing="sm">
      <div className="flex items-center justify-between">
        <Typography variant="small" weight="medium">
          Custom Properties
        </Typography>
        {!newRow && (
          <Button size="sm" variant="ghost" onClick={startAdd} disabled={saving || loading}>
            <Plus size={14} className="mr-1" />
            Add
          </Button>
        )}
      </div>

      {error && (
        <Typography variant="caption" tone="error">
          {error}
        </Typography>
      )}

      {properties.length === 0 && !newRow && (
        <Typography variant="caption" tone="muted">
          No custom properties yet.
        </Typography>
      )}

      <div className="space-y-1">
        {properties.map((prop) =>
          editingId === prop.id ? (
            <div key={prop.id} className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-2 py-1">
              <Typography variant="caption" className="w-28 shrink-0 font-mono text-neutral-700">
                {prop.propKey}
              </Typography>
              <Input
                size="sm"
                value={editState.propValue}
                onChange={(e) => setEditState((s) => ({ ...s, propValue: e.target.value }))}
                placeholder="Value"
                className="flex-1"
              />
              <Select
                size="sm"
                value={editState.fieldType}
                onValueChange={(v: string) =>
                  setEditState((s) => ({ ...s, fieldType: v }))
                }
                options={FIELD_TYPE_OPTIONS}
                className="w-24 shrink-0"
              />
              <button
                onClick={() => void commitEdit(prop.id)}
                disabled={saving}
                className="text-green-600 hover:text-green-700 disabled:opacity-40"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEdit}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              key={prop.id}
              className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-neutral-50"
            >
              <Typography variant="caption" className="w-28 shrink-0 font-mono text-neutral-700">
                {prop.propKey}
              </Typography>
              <Typography variant="caption" className="flex-1 text-neutral-900">
                {prop.propValue ?? <span className="italic text-neutral-400">—</span>}
              </Typography>
              <Typography variant="caption" className="w-16 shrink-0 text-neutral-400">
                {prop.fieldType}
              </Typography>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => startEdit(prop)}
                  className="text-neutral-400 hover:text-blue-600"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => void handleRemove(prop.id)}
                  disabled={saving}
                  className="text-neutral-400 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        )}

        {newRow && (
          <div className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-2 py-1">
            <Input
              size="sm"
              value={newRow.propKey}
              onChange={(e) => setNewRow((r) => r && { ...r, propKey: e.target.value })}
              placeholder="Key (e.g. complexity)"
              className="w-28 shrink-0 font-mono"
              autoFocus
            />
            <Input
              size="sm"
              value={newRow.propValue}
              onChange={(e) => setNewRow((r) => r && { ...r, propValue: e.target.value })}
              placeholder="Value"
              className="flex-1"
            />
            <Select
              size="sm"
              value={newRow.fieldType}
              onValueChange={(v: string) =>
                setNewRow((r) => r && { ...r, fieldType: v })
              }
              options={FIELD_TYPE_OPTIONS}
              className="w-24 shrink-0"
            />
            <button
              onClick={() => void commitAdd()}
              disabled={saving}
              className="text-green-600 hover:text-green-700 disabled:opacity-40"
            >
              <Check size={14} />
            </button>
            <button onClick={cancelAdd} className="text-neutral-400 hover:text-neutral-600">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </Stack>
  )
}
