'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Archive, Ban, Check, Plus, Star } from 'lucide-react'
import { Badge, Button, Card, DataTable, Input, Modal, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useWorkingCalendars } from '../hooks/useWorkingCalendars'
import { CapacityEntityStatus } from '../../domain/enums/capacity.enum'
import {
  canEditCalendar,
  isCalendarActive,
  isCalendarArchived,
} from '../../domain/rules/capacity.rules'

function statusTone(status: string) {
  if (status === CapacityEntityStatus.Active) return 'success' as const
  if (status === CapacityEntityStatus.Archived) return 'neutral' as const
  return 'warning' as const
}

export function WorkingCalendarsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    items,
    loading,
    error,
    creating,
    createCalendar,
    setDefault,
    activate,
    deactivate,
    archive,
  } = useWorkingCalendars(workspaceId)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    timezone: 'Asia/Ho_Chi_Minh',
    isDefault: false,
  })

  if (loading) return <PageSkeleton variant="list" />
  if (error) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Working Calendars
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Define schedules and exceptions used by capacity profiles.
          </Typography>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Add calendar
        </Button>
      </div>

      <Card className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Working calendars"
          rows={items}
          rowKey={(cal) => cal.id}
          emptyMessage="No working calendars yet."
          columns={[
            {
              id: 'calendar',
              header: 'Calendar',
              cell: (cal) => (
                <NextLink
                  href={ROUTES.workspace.settingsCapacityCalendar(workspaceId, cal.id)}
                  className="font-medium text-primary hover:underline"
                >
                  {cal.name}
                </NextLink>
              ),
            },
            { id: 'code', header: 'Code', accessor: (cal) => cal.code || '—', kind: 'code' },
            { id: 'timezone', header: 'Timezone', accessor: (cal) => cal.timezone || '—' },
            {
              id: 'default',
              header: 'Default',
              cell: (cal) =>
                cal.isDefault ? (
                  <Badge size="sm" tone="primary">
                    Default
                  </Badge>
                ) : (
                  '—'
                ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (cal) => (
                <Badge size="sm" tone={statusTone(cal.status)}>
                  {cal.status}
                </Badge>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (cal) => (
                <div className="flex flex-wrap gap-1">
                  {canEditCalendar(cal) && !cal.isDefault ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Star size={14} />}
                      onClick={() => void setDefault(cal.id)}
                      title="Set as default"
                    />
                  ) : null}
                  {canEditCalendar(cal) && !isCalendarActive(cal) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Check size={14} />}
                      onClick={() => void activate(cal.id)}
                      title="Activate"
                    />
                  ) : null}
                  {isCalendarActive(cal) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Ban size={14} />}
                      onClick={() => void deactivate(cal.id)}
                      title="Deactivate"
                    />
                  ) : null}
                  {!isCalendarArchived(cal) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Archive size={14} />}
                      onClick={() => void archive(cal.id)}
                      title="Archive"
                    />
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create working calendar"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowCreate(false), variant: 'ghost' },
          {
            label: 'Create',
            loading: creating,
            onClick: async () => {
              await createCalendar({
                code: form.code.trim(),
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                timezone: form.timezone.trim(),
                isDefault: form.isDefault,
              })
              setShowCreate(false)
              setForm({
                code: '',
                name: '',
                description: '',
                timezone: 'Asia/Ho_Chi_Minh',
                isDefault: false,
              })
            },
            variant: 'primary',
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="WC-VN-STD"
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Vietnam Standard"
          />
          <Input
            label="Timezone"
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            placeholder="Asia/Ho_Chi_Minh"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Set as workspace default
          </label>
        </div>
      </Modal>
    </div>
  )
}
