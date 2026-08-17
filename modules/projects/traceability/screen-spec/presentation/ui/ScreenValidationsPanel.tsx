'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { Button, Input, Modal, PageSkeleton, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  fieldComponentGroupHeading,
  fieldComponentGroupLabel,
  filterFieldComponentGroups,
  groupFieldsByComponent,
  shouldShowComponentGroups,
} from '../../domain/rules/field-groups.rules'
import { FieldGroupHeading } from '../../../ui/FieldGroupHeading'
import { useScreenValidations, useValidationRuleTypes } from '../hooks/useFieldValidations'
import { FieldValidationsEditor } from './FieldValidationsEditor'
import { FieldValidationJsonImportModal } from './FieldValidationJsonImportModal'
import type { ScreenMode } from '../../domain/model/screen-spec'
import type { RegistryScreenField } from '../../../model/application-registry'
import type { SpecCatalogComponent } from './FieldSpecDrawer'

function RuleCount({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'shrink-0 px-1.5 py-0.5 text-[11px]',
        count > 0 ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-400'
      )}
    >
      {count}
    </span>
  )
}

function ValidationFieldGroups({
  groups,
  countByField,
  selectedFieldId,
  onSelect,
}: {
  groups: ReturnType<typeof groupFieldsByComponent<RegistryScreenField>>
  countByField: Map<string, number>
  selectedFieldId?: string | null
  onSelect?: (fieldId: string) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const showGroups = shouldShowComponentGroups(groups)

  const fieldRow = (field: RegistryScreenField) => {
    const count = countByField.get(field.id) ?? 0
    const active = selectedFieldId === field.id
    const body = (
      <>
        <span className="min-w-0">
          <Typography variant="small">{field.fieldKey}</Typography>
          <Typography variant="caption" tone="muted" className="block truncate">
            {field.label}
          </Typography>
        </span>
        <RuleCount count={count} />
      </>
    )
    if (!onSelect) {
      return (
        <li key={field.id} className="flex items-start justify-between gap-2 px-3 py-2.5">
          {body}
        </li>
      )
    }
    return (
      <li key={field.id}>
        <button
          type="button"
          onClick={() => onSelect(field.id)}
          className={cn(
            'flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left',
            active ? 'bg-neutral-50' : 'hover:bg-neutral-50'
          )}
        >
          {body}
        </button>
      </li>
    )
  }

  if (!showGroups) {
    return <ul className="divide-y divide-neutral-100">{groups.flatMap((g) => g.fields).map(fieldRow)}</ul>
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {groups.map((group) => {
        const open = !collapsed.has(group.key)
        const ruleCount = group.fields.reduce((sum, field) => sum + (countByField.get(field.id) ?? 0), 0)
        return (
          <li key={group.key}>
            <button
              type="button"
              className="flex w-full items-start gap-1.5 bg-neutral-50 px-3 py-2 text-left"
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
              <span className="min-w-0 flex-1">
                <FieldGroupHeading {...fieldComponentGroupHeading(group)} />
              </span>
              <Typography variant="caption" tone="muted">
                {group.fields.length}
              </Typography>
              <RuleCount count={ruleCount} />
            </button>
            {open ? <ul className="divide-y divide-neutral-100">{group.fields.map(fieldRow)}</ul> : null}
          </li>
        )
      })}
    </ul>
  )
}

export function ScreenValidationsPanel({
  workspaceId,
  screenId,
  modes,
  fields,
  components = [],
  componentIdBySectionId,
  onChanged,
}: {
  workspaceId: string
  screenId: string
  modes: ScreenMode[]
  fields: RegistryScreenField[]
  components?: SpecCatalogComponent[]
  componentIdBySectionId?: Record<string, string>
  onChanged?: () => void
}) {
  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields])
  const { items, loading, error, refetch } = useScreenValidations(workspaceId, screenId, fieldIds)
  const { items: ruleTypes } = useValidationRuleTypes(workspaceId)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(fields[0]?.id ?? null)
  const [importOpen, setImportOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [fieldQuery, setFieldQuery] = useState('')
  const importRefs = useMemo(
    () => ({
      fields: fields.map((field) => ({ id: field.id, fieldKey: field.fieldKey })),
      modes: modes.map((mode) => ({ id: mode.id, modeCode: mode.modeCode })),
      ruleTypes: ruleTypes.map((type) => ({ id: type.id, code: type.code })),
    }),
    [fields, modes, ruleTypes]
  )

  const groups = useMemo(
    () => groupFieldsByComponent(fields, components, componentIdBySectionId),
    [componentIdBySectionId, components, fields]
  )
  const visibleGroups = useMemo(
    () => filterFieldComponentGroups(groups, fieldQuery),
    [fieldQuery, groups]
  )
  const visibleFields = useMemo(
    () => visibleGroups.flatMap((group) => group.fields),
    [visibleGroups]
  )

  useEffect(() => {
    if (selectedFieldId && visibleFields.some((f) => f.id === selectedFieldId)) return
    setSelectedFieldId(visibleFields[0]?.id ?? null)
  }, [selectedFieldId, visibleFields])

  const countByField = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      map.set(item.fieldId, (map.get(item.fieldId) ?? 0) + 1)
    }
    return map
  }, [items])

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null
  const handleChanged = () => {
    void refetch()
    onChanged?.()
  }

  if (fields.length === 0) {
    return (
      <Typography variant="small" tone="muted">
        Add fields first, then add validation rules here.
      </Typography>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)}>
          Import JSON
        </Button>
        <Button
          size="sm"
          variant="primary"
          icon={<Pencil size={14} />}
          onClick={() => {
            setFieldQuery('')
            setEditOpen(true)
          }}
        >
          Edit
        </Button>
      </div>
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      <div className="border border-neutral-200">
        <ValidationFieldGroups groups={groups} countByField={countByField} />
      </div>
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit validations"
        size="2xl"
        actions={[{ label: 'Close', onClick: () => setEditOpen(false), variant: 'ghost' }]}
      >
        <div className="space-y-3">
          <Input
            size="sm"
            fullWidth
            type="search"
            value={fieldQuery}
            onChange={(e) => setFieldQuery(e.target.value)}
            placeholder="Search field or component"
            aria-label="Search field or component"
          />
          <div className="flex max-h-[min(28rem,55vh)] min-h-0 min-w-0 border border-neutral-200">
            <aside className="w-56 shrink-0 overflow-y-auto border-r border-neutral-200">
              {visibleFields.length === 0 ? (
                <Typography variant="caption" tone="muted" className="block px-3 py-2.5">
                  No fields match this search.
                </Typography>
              ) : (
                <ValidationFieldGroups
                  groups={visibleGroups}
                  countByField={countByField}
                  selectedFieldId={selectedFieldId}
                  onSelect={setSelectedFieldId}
                />
              )}
            </aside>
            <div className="min-w-0 flex-1 overflow-y-auto p-md">
              {selectedField ? (
                <FieldValidationsEditor
                  key={selectedField.id}
                  workspaceId={workspaceId}
                  screenId={screenId}
                  fieldId={selectedField.id}
                  modes={modes}
                  onChanged={handleChanged}
                />
              ) : (
                <Typography variant="small" tone="muted">
                  Select a field to review rules.
                </Typography>
              )}
            </div>
          </div>
        </div>
      </Modal>
      <FieldValidationJsonImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        workspaceId={workspaceId}
        screenId={screenId}
        refs={importRefs}
        onImported={handleChanged}
      />
    </div>
  )
}
