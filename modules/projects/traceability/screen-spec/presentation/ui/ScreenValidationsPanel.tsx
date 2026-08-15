'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageSkeleton, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useScreenValidations } from '../hooks/useFieldValidations'
import { FieldValidationsEditor } from './FieldValidationsEditor'
import type { ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreenField } from '../../../model/application-registry'

export function ScreenValidationsPanel({
  workspaceId,
  screenId,
  modes,
  fields,
  onChanged,
}: {
  workspaceId: string
  screenId: string
  modes: ScreenMode[]
  fields: RegistryScreenField[]
  onChanged?: () => void
}) {
  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields])
  const { items, loading, error, refetch } = useScreenValidations(workspaceId, screenId, fieldIds)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(fields[0]?.id ?? null)

  useEffect(() => {
    if (selectedFieldId && fields.some((f) => f.id === selectedFieldId)) return
    setSelectedFieldId(fields[0]?.id ?? null)
  }, [fields, selectedFieldId])

  const countByField = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      map.set(item.fieldId, (map.get(item.fieldId) ?? 0) + 1)
    }
    return map
  }, [items])

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  if (fields.length === 0) {
    return (
      <Typography variant="small" tone="muted">
        Add fields first, then add validation rules here.
      </Typography>
    )
  }

  return (
    <div className="space-y-2">
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      <div className="flex max-h-[min(28rem,55vh)] min-h-0 min-w-0 border border-neutral-200">
        <aside className="w-52 shrink-0 overflow-y-auto border-r border-neutral-200">
          <ul className="divide-y divide-neutral-100">
            {fields.map((field) => {
              const count = countByField.get(field.id) ?? 0
              const active = selectedFieldId === field.id
              return (
                <li key={field.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedFieldId(field.id)}
                    className={cn(
                      'flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left',
                      active ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                    )}
                  >
                    <span className="min-w-0">
                      <Typography variant="small">{field.fieldKey}</Typography>
                      <Typography variant="caption" tone="muted" className="block truncate">
                        {field.label}
                      </Typography>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 px-1.5 py-0.5 text-[11px]',
                        count > 0 ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-400'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto p-md">
          {selectedField ? (
            <FieldValidationsEditor
              key={selectedField.id}
              workspaceId={workspaceId}
              screenId={screenId}
              fieldId={selectedField.id}
              modes={modes}
              onChanged={() => {
                void refetch()
                onChanged?.()
              }}
            />
          ) : (
            <Typography variant="small" tone="muted">
              Select a field to review rules.
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}
