'use client'

import { Check, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import type { MeetingAgendaItem, MeetingParticipant } from '../../domain/model/meeting'
import type { MeetingArtifactLink } from '../../domain/model/artifact-link'
import type { MeetingWorkspaceMode } from '../../domain/rules/meeting.rules'

interface MeetingContextRailProps {
  mode: MeetingWorkspaceMode
  agendaItems: MeetingAgendaItem[]
  participants: MeetingParticipant[]
  artifactLinks: MeetingArtifactLink[]
  onAddAgenda: () => void
  onRemoveAgenda?: (id: string) => void
  onAddParticipant: () => void
  onRemoveParticipant?: (id: string) => void
  onMarkAttended?: (id: string) => void
  onLinkItem: () => void
  onRemoveLink?: (id: string) => void
}

function agendaDiscussedCount(items: MeetingAgendaItem[]) {
  return items.filter((a) => {
    const s = a.status?.toUpperCase()
    return s === 'DISCUSSED' || s === 'DONE' || s === 'COMPLETED'
  }).length
}

function presentCount(participants: MeetingParticipant[]) {
  return participants.filter((p) => p.attendanceStatus === 'ATTENDED').length
}

export function MeetingContextRail({
  mode,
  agendaItems,
  participants,
  artifactLinks,
  onAddAgenda,
  onRemoveAgenda,
  onAddParticipant,
  onRemoveParticipant,
  onMarkAttended,
  onLinkItem,
  onRemoveLink,
}: MeetingContextRailProps) {
  const discussed = agendaDiscussedCount(agendaItems)
  const present = presentCount(participants)
  const showAttendance = mode === 'during' || mode === 'post'
  const progressPct =
    agendaItems.length === 0 ? 0 : Math.round((discussed / agendaItems.length) * 100)

  return (
    <aside className="space-y-4">
      <section className="border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <Typography weight="semibold">Agenda</Typography>
            {agendaItems.length > 0 ? (
              <Typography variant="small" tone="muted">
                {discussed} / {agendaItems.length} discussed
              </Typography>
            ) : null}
          </div>
          <Button size="sm" variant="neutral-flat" icon={<Plus size={14} />} onClick={onAddAgenda}>
            Add
          </Button>
        </div>

        {agendaItems.length > 0 ? (
          <div className="mb-3 h-1 w-full bg-neutral-100">
            <div className="h-1 bg-secondary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        ) : null}

        {agendaItems.length === 0 ? (
          <div className="space-y-2">
            <Typography variant="small" tone="muted">
              No agenda yet. Add discussion topics so participants know what to prepare.
            </Typography>
            <Button size="sm" variant="neutral-flat" onClick={onAddAgenda}>
              Add agenda item
            </Button>
          </div>
        ) : (
          <ol className="space-y-2">
            {agendaItems
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item, idx) => {
                const done =
                  item.status?.toUpperCase() === 'DISCUSSED' ||
                  item.status?.toUpperCase() === 'DONE'
                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 border border-neutral-100 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        {done ? (
                          <Check size={14} className="mt-0.5 shrink-0 text-secondary" aria-hidden />
                        ) : (
                          <span className="mt-0.5 w-3.5 shrink-0 text-center text-xs text-neutral-400">
                            {idx + 1}
                          </span>
                        )}
                        <div className="min-w-0">
                          <Typography variant="small" weight="medium">
                            {item.title}
                          </Typography>
                          {item.timeboxMinutes != null ? (
                            <Typography variant="small" tone="muted">
                              {item.timeboxMinutes} min
                            </Typography>
                          ) : null}
                          {item.description ? (
                            <Typography variant="small" tone="muted">
                              {item.description}
                            </Typography>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {onRemoveAgenda ? (
                      <Button
                        size="sm"
                        variant="neutral-flat"
                        tone="error"
                        icon={<Trash2 size={12} />}
                        aria-label="Remove agenda item"
                        onClick={() => onRemoveAgenda(item.id)}
                      />
                    ) : null}
                  </li>
                )
              })}
          </ol>
        )}
        {mode === 'during' ? (
          <Typography variant="small" tone="muted" className="mt-3">
            Start topic / mark discussed requires agenda lifecycle APIs (see BE requirements).
          </Typography>
        ) : null}
      </section>

      <section className="border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <Typography weight="semibold">Participants</Typography>
            <Typography variant="small" tone="muted">
              {participants.length} invited
              {showAttendance ? ` · ${present} present` : ''}
            </Typography>
          </div>
          <Button
            size="sm"
            variant="neutral-flat"
            icon={<Plus size={14} />}
            onClick={onAddParticipant}
          >
            Add
          </Button>
        </div>

        {participants.length === 0 ? (
          <div className="space-y-2">
            <Typography variant="small" tone="muted">
              No participants invited. Add people and assign presenter roles.
            </Typography>
            <Button size="sm" variant="neutral-flat" onClick={onAddParticipant}>
              Add participants
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 border border-neutral-100 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <Typography variant="small" weight="medium" className="truncate">
                    {p.displayNameSnapshot ?? p.targetId}
                  </Typography>
                  <Stack direction="horizontal" spacing="sm" className="mt-0.5 items-center">
                    <Badge tone="neutral">{p.participantRole}</Badge>
                    {showAttendance ? (
                      <Typography variant="small" tone="muted">
                        {p.attendanceStatus}
                      </Typography>
                    ) : null}
                  </Stack>
                </div>
                <Stack direction="horizontal" spacing="sm" className="shrink-0 items-center">
                  {showAttendance && onMarkAttended && p.attendanceStatus !== 'ATTENDED' ? (
                    <Button size="sm" variant="neutral-flat" onClick={() => onMarkAttended(p.id)}>
                      Present
                    </Button>
                  ) : null}
                  {onRemoveParticipant ? (
                    <Button
                      size="sm"
                      variant="neutral-flat"
                      tone="error"
                      icon={<Trash2 size={12} />}
                      aria-label="Remove participant"
                      onClick={() => onRemoveParticipant(p.id)}
                    />
                  ) : null}
                </Stack>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Typography weight="semibold">Linked work</Typography>
          <Button size="sm" variant="neutral-flat" icon={<Plus size={14} />} onClick={onLinkItem}>
            Link
          </Button>
        </div>
        {artifactLinks.length === 0 ? (
          <div className="space-y-2">
            <Typography variant="small" tone="muted">
              Link tasks, documents, decisions, or RAID items for context.
            </Typography>
            <Button size="sm" variant="neutral-flat" onClick={onLinkItem}>
              Link existing item
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {artifactLinks.map((link) => (
              <li
                key={link.id}
                className="flex items-start justify-between gap-2 border border-neutral-100 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <Typography variant="small" weight="medium" className="truncate">
                    {link.targetId}
                  </Typography>
                  <Typography variant="small" tone="muted">
                    {link.targetType} · {link.linkType}
                  </Typography>
                </div>
                {onRemoveLink ? (
                  <Button
                    size="sm"
                    variant="neutral-flat"
                    tone="error"
                    icon={<Trash2 size={12} />}
                    aria-label="Remove link"
                    onClick={() => onRemoveLink(link.id)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
