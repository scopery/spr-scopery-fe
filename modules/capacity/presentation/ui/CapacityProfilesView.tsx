'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Archive, Ban, Check, Plus } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
import { listWorkspaceMembers } from '@/modules/org/workspace'
import { PersonReferenceSelect, UserIdentity, useResolveUsers } from '@/modules/platform'
import { useUserCapacityProfiles } from '../hooks/useUserCapacityProfiles'
import { useWorkingCalendars } from '../hooks/useWorkingCalendars'
import { CapacityEntityStatus } from '../../domain/enums/capacity.enum'
import { isUserProfileActive, isUserProfileArchived } from '../../domain/rules/capacity.rules'

function statusTone(status: string) {
  if (status === CapacityEntityStatus.Active) return 'success' as const
  if (status === CapacityEntityStatus.Archived) return 'neutral' as const
  return 'warning' as const
}

export function CapacityProfilesView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    items,
    loading,
    error,
    creating,
    findOverlaps,
    createProfile,
    activate,
    deactivate,
    archive,
  } = useUserCapacityProfiles(workspaceId)
  const { items: calendars } = useWorkingCalendars(workspaceId)

  const [members, setMembers] = useState<{ id: string; userId: string }[]>([])
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { personFor } = useResolveUsers(memberUserIds)
  const [showCreate, setShowCreate] = useState(false)
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null)
  const [form, setForm] = useState({
    workspaceMemberId: '',
    workingCalendarId: '',
    defaultDailyHours: '8',
    focusFactor: '0.85',
    effectiveFrom: '',
    effectiveTo: '',
  })

  const loadMembers = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await listWorkspaceMembers(workspaceId, {
        page: 0,
        size: 100,
      })
      setMembers(res.items.map((m) => ({ id: m.id, userId: m.userId })))
    } catch {
      setMembers([])
    }
  }, [workspaceId])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const calendarOptions = useMemo(
    () => calendars.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
    [calendars]
  )

  const memberOptions = useMemo(
    () =>
      members.flatMap((member) => {
        const person = personFor(member.userId)
        return person ? [{ value: member.id, person }] : []
      }),
    [members, personFor]
  )

  const calendarName = (id: string) => calendars.find((c) => c.id === id)?.name ?? '—'

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
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Capacity Profiles
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Effective-dated daily hours and calendar assignment per workspace member.
          </Typography>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setOverlapWarning(null)
            setShowCreate(true)
          }}
        >
          Add profile
        </Button>
      </div>

      <Card className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Capacity profiles"
          rows={items}
          rowKey={(profile) => profile.id}
          emptyMessage="No capacity profiles yet."
          columns={[
            {
              id: 'member',
              header: 'Member',
              kind: 'reference',
              cell: (p) => {
                const member = memberOptions.find((option) => option.value === p.workspaceMemberId)
                return member ? (
                  <UserIdentity
                    userId={member.person.id}
                    person={member.person}
                    showEmail
                    size="xs"
                  />
                ) : (
                  '—'
                )
              },
            },
            {
              id: 'calendar',
              header: 'Calendar',
              accessor: (p) => calendarName(p.workingCalendarId),
              kind: 'reference',
            },
            { id: 'hours', header: 'Daily hours', accessor: 'defaultDailyHours' },
            { id: 'focus', header: 'Focus', accessor: 'focusFactor' },
            {
              id: 'effective',
              header: 'Effective',
              accessor: (p) =>
                `${p.effectiveFrom}${p.effectiveTo ? ` → ${p.effectiveTo}` : ' → open'}`,
            },
            {
              id: 'status',
              header: 'Status',
              cell: (p) => (
                <Badge size="sm" tone={statusTone(p.status)}>
                  {p.status}
                </Badge>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (p) => (
                <div className="flex gap-1">
                  {!isUserProfileActive(p) && !isUserProfileArchived(p) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Check size={14} />}
                      onClick={() => void activate(p.id)}
                      title="Activate"
                    />
                  ) : null}
                  {isUserProfileActive(p) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Ban size={14} />}
                      onClick={() => void deactivate(p.id)}
                      title="Deactivate"
                    />
                  ) : null}
                  {!isUserProfileArchived(p) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Archive size={14} />}
                      onClick={() => void archive(p.id)}
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
        title="Create capacity profile"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowCreate(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: creating,
            onClick: async () => {
              const to = form.effectiveTo.trim() || null
              const overlaps = findOverlaps(form.workspaceMemberId, form.effectiveFrom, to)
              if (overlaps.length > 0 && !overlapWarning) {
                setOverlapWarning(
                  `Overlaps ${overlaps.length} existing profile(s) for this member. Create anyway to confirm.`
                )
                return
              }
              await createProfile({
                workspaceMemberId: form.workspaceMemberId,
                workingCalendarId: form.workingCalendarId,
                defaultDailyHours: Number(form.defaultDailyHours),
                focusFactor: Number(form.focusFactor),
                effectiveFrom: form.effectiveFrom,
                effectiveTo: to,
              })
              setShowCreate(false)
              setOverlapWarning(null)
              setForm({
                workspaceMemberId: '',
                workingCalendarId: '',
                defaultDailyHours: '8',
                focusFactor: '0.85',
                effectiveFrom: '',
                effectiveTo: '',
              })
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          {overlapWarning ? (
            <div className="border-warning/40 bg-warning/10 border p-3">
              <Typography variant="small" tone="warning">
                {overlapWarning}
              </Typography>
            </div>
          ) : null}
          <PersonReferenceSelect
            label="Member"
            value={form.workspaceMemberId}
            onChange={(v: string) => {
              setOverlapWarning(null)
              setForm((f) => ({ ...f, workspaceMemberId: v }))
            }}
            options={memberOptions}
            placeholder="Select member"
          />
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Working calendar
            </Typography>
            <Select
              value={form.workingCalendarId}
              onValueChange={(v: string) => setForm((f) => ({ ...f, workingCalendarId: v }))}
              options={calendarOptions}
              placeholder="Select calendar"
            />
          </div>
          <Input
            label="Default daily hours"
            type="number"
            value={form.defaultDailyHours}
            onChange={(e) => setForm((f) => ({ ...f, defaultDailyHours: e.target.value }))}
          />
          <Input
            label="Focus factor (0–1)"
            type="number"
            step="0.01"
            value={form.focusFactor}
            onChange={(e) => setForm((f) => ({ ...f, focusFactor: e.target.value }))}
          />
          <Input
            label="Effective from"
            type="date"
            value={form.effectiveFrom}
            onChange={(e) => {
              setOverlapWarning(null)
              setForm((f) => ({ ...f, effectiveFrom: e.target.value }))
            }}
          />
          <Input
            label="Effective to (optional)"
            type="date"
            value={form.effectiveTo}
            onChange={(e) => {
              setOverlapWarning(null)
              setForm((f) => ({ ...f, effectiveTo: e.target.value }))
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
