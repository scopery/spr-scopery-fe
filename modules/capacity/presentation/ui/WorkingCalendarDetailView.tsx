'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Switch,
  Typography,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useWorkingCalendarDetail } from '../hooks/useWorkingCalendarDetail'
import { CalendarExceptionType, DAY_OF_WEEK_ORDER } from '../../domain/enums/capacity.enum'

const EXCEPTION_OPTIONS = [
  { value: CalendarExceptionType.Holiday, label: 'Holiday' },
  { value: CalendarExceptionType.CustomWorking, label: 'Custom working' },
  { value: CalendarExceptionType.CustomNonWorking, label: 'Custom non-working' },
]

function dayLabel(day: string) {
  return day.charAt(0) + day.slice(1).toLowerCase()
}

export function WorkingCalendarDetailView() {
  const { workspaceId, calendarId } = useParams<{
    workspaceId: string
    calendarId: string
  }>()
  const {
    calendar,
    dayRules,
    exceptions,
    loading,
    error,
    dirtyRules,
    savingRules,
    updateDayRule,
    saveDayRules,
    createException,
    removeException,
  } = useWorkingCalendarDetail(calendarId)

  const [showException, setShowException] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [exForm, setExForm] = useState({
    exceptionDate: '',
    exceptionType: CalendarExceptionType.Holiday as string,
    name: '',
    description: '',
    isWorkingDay: false,
    workingHours: '0',
  })

  if (loading) return <PageSkeleton variant="detail" />
  if (error || !calendar) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error ?? 'Calendar not found'}
        </Typography>
      </div>
    )
  }

  const orderedRules = DAY_OF_WEEK_ORDER.map(
    (day) =>
      dayRules.find((r) => r.dayOfWeek === day) ?? {
        dayOfWeek: day,
        isWorkingDay: false,
        startTime: null,
        endTime: null,
        workingHours: 0,
      }
  )

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-4">
        <NextLink
          href={ROUTES.workspace.settingsCapacityCalendars(workspaceId)}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Working calendars
        </NextLink>
      </div>

      <div className="mb-2 flex flex-wrap items-start justify-between gap-md">
        <div>
          <div className="flex flex-wrap items-center gap-sm">
            <Typography as="h1" size="md" weight="medium">
              {calendar.name}
            </Typography>
            {calendar.isDefault ? (
              <Badge size="sm" tone="primary">
                Default
              </Badge>
            ) : null}
            <Badge size="sm" tone="neutral">
              {calendar.status}
            </Badge>
          </div>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            {calendar.code} · {calendar.timezone}
          </Typography>
        </div>
        <Button
          variant="primary"
          disabled={!dirtyRules}
          loading={savingRules}
          onClick={() => setConfirmSave(true)}
        >
          Save weekly schedule
        </Button>
      </div>

      <Card as="section" className="mb-8 border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-3">
          <Typography weight="semibold" variant="small">
            Weekly schedule
          </Typography>
          <Typography variant="caption" tone="muted">
            Changes replace the full week. Save when ready — no auto-save per cell.
          </Typography>
        </div>
        <DataTable
          ariaLabel="Weekly schedule"
          rows={orderedRules}
          rowKey={(rule) => rule.dayOfWeek}
          columns={[
            { id: 'day', header: 'Day', accessor: (rule) => dayLabel(rule.dayOfWeek) },
            {
              id: 'working',
              header: 'Working',
              cell: (rule) => (
                <Switch
                  checked={rule.isWorkingDay}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateDayRule(rule.dayOfWeek, {
                      isWorkingDay: checked,
                      startTime: checked ? (rule.startTime ?? '09:00') : null,
                      endTime: checked ? (rule.endTime ?? '17:00') : null,
                      workingHours: checked ? rule.workingHours || 8 : 0,
                    })
                  }}
                />
              ),
            },
            {
              id: 'start',
              header: 'Start',
              cell: (rule) => (
                <Input
                  type="time"
                  disabled={!rule.isWorkingDay}
                  value={rule.startTime ?? ''}
                  onChange={(e) =>
                    updateDayRule(rule.dayOfWeek, { startTime: e.target.value || null })
                  }
                />
              ),
            },
            {
              id: 'end',
              header: 'End',
              cell: (rule) => (
                <Input
                  type="time"
                  disabled={!rule.isWorkingDay}
                  value={rule.endTime ?? ''}
                  onChange={(e) =>
                    updateDayRule(rule.dayOfWeek, { endTime: e.target.value || null })
                  }
                />
              ),
            },
            {
              id: 'hours',
              header: 'Hours',
              cell: (rule) => (
                <Input
                  type="number"
                  disabled={!rule.isWorkingDay}
                  value={String(rule.workingHours)}
                  onChange={(e) =>
                    updateDayRule(rule.dayOfWeek, { workingHours: Number(e.target.value) || 0 })
                  }
                />
              ),
            },
          ]}
        />
      </Card>

      <Card as="section" className="border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <Typography weight="semibold" variant="small">
            Exceptions ({exceptions.length})
          </Typography>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowException(true)}
          >
            Add exception
          </Button>
        </div>
        <DataTable
          ariaLabel="Calendar exceptions"
          rows={exceptions}
          rowKey={(exception) => exception.id}
          emptyMessage="No exceptions yet."
          columns={[
            { id: 'date', header: 'Date', accessor: 'exceptionDate' },
            { id: 'type', header: 'Type', accessor: 'exceptionType' },
            { id: 'name', header: 'Name', accessor: (ex) => ex.name || '—' },
            {
              id: 'working',
              header: 'Working',
              accessor: (ex) => (ex.isWorkingDay ? 'Yes' : 'No'),
            },
            { id: 'hours', header: 'Hours', accessor: 'workingHours' },
            {
              id: 'actions',
              header: 'Actions',
              cell: (ex) => (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={14} />}
                  onClick={() => void removeException(ex.id)}
                  title="Delete"
                />
              ),
            },
          ]}
        />
      </Card>

      <ConfirmDialog
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        title="Replace weekly schedule?"
        message="This replaces all day rules for the calendar. Continue?"
        confirmLabel="Save schedule"
        onConfirm={async () => {
          await saveDayRules()
        }}
        loading={savingRules}
      />

      <Modal
        open={showException}
        onClose={() => setShowException(false)}
        title="Add exception"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowException(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            onClick: async () => {
              await createException({
                exceptionDate: exForm.exceptionDate,
                exceptionType: exForm.exceptionType as typeof CalendarExceptionType.Holiday,
                name: exForm.name.trim(),
                description: exForm.description.trim() || null,
                isWorkingDay: exForm.isWorkingDay,
                workingHours: Number(exForm.workingHours) || 0,
              })
              setShowException(false)
              setExForm({
                exceptionDate: '',
                exceptionType: CalendarExceptionType.Holiday,
                name: '',
                description: '',
                isWorkingDay: false,
                workingHours: '0',
              })
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Date"
            type="date"
            value={exForm.exceptionDate}
            onChange={(e) => setExForm((f) => ({ ...f, exceptionDate: e.target.value }))}
          />
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Type
            </Typography>
            <Select
              value={exForm.exceptionType}
              onValueChange={(v: string) => setExForm((f) => ({ ...f, exceptionType: v }))}
              options={EXCEPTION_OPTIONS}
            />
          </div>
          <Input
            label="Name"
            value={exForm.name}
            onChange={(e) => setExForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Description"
            value={exForm.description}
            onChange={(e) => setExForm((f) => ({ ...f, description: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={exForm.isWorkingDay}
              onChange={(e) => setExForm((f) => ({ ...f, isWorkingDay: e.target.checked }))}
            />
            Working day
          </label>
          <Input
            label="Working hours"
            type="number"
            value={exForm.workingHours}
            onChange={(e) => setExForm((f) => ({ ...f, workingHours: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
