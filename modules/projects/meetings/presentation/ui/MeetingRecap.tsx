'use client'

import { ExternalLink, FileText } from 'lucide-react'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import {
  actionItemStatusLabel,
  minutesStatusLabel,
  minutesStatusTone,
} from '../../domain/rules/meeting.rules'
import type { MeetingMinutes } from '../../domain/model/meeting-minutes'
import type { MeetingActionItem } from '../../domain/model/meeting-action-item'
import type { MeetingParticipant } from '../../domain/model/meeting'
import type { MeetingNote } from '../../domain/model/meeting-note'

interface MeetingRecapProps {
  latestMinutes: MeetingMinutes | null
  summary: string
  actionItems: MeetingActionItem[]
  participants: MeetingParticipant[]
  notes: MeetingNote[]
  acting?: boolean
  generatingDoc?: boolean
  onSubmitForReview: () => void
  onApprove: () => void
  onReject?: () => void
  onGenerateDoc: () => void
  onOpenDoc: () => void
  onEditSummary?: () => void
}

function extractTagged(summary: string, tag: string): string[] {
  const re = new RegExp(`\\[${tag}\\]\\s*(.+)`, 'gi')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(summary)) !== null) {
    out.push(m[1].trim())
  }
  return out
}

export function MeetingRecap({
  latestMinutes,
  summary,
  actionItems,
  participants,
  notes,
  acting,
  generatingDoc,
  onSubmitForReview,
  onApprove,
  onReject,
  onGenerateDoc,
  onOpenDoc,
  onEditSummary,
}: MeetingRecapProps) {
  const present = participants.filter((p) => p.attendanceStatus === 'ATTENDED').length
  const decisions = [
    ...extractTagged(summary, 'DECISION'),
    ...(latestMinutes?.decisionsSummary
      ? latestMinutes.decisionsSummary.split('\n').map((s) => s.trim()).filter(Boolean)
      : []),
    ...notes
      .filter((n) => n.convertedTo?.type?.toUpperCase().includes('DECISION'))
      .map((n) => n.content),
  ]
  const risks = [
    ...extractTagged(summary, 'RISK'),
    ...extractTagged(summary, 'ISSUE'),
    ...notes
      .filter((n) => {
        const t = n.convertedTo?.type?.toUpperCase() ?? ''
        return t.includes('RISK') || t.includes('ISSUE') || t.includes('RAID')
      })
      .map((n) => n.content),
  ]
  const openActions = actionItems.filter((a) => a.status === 'OPEN')
  const linkedActions = actionItems.filter((a) => a.linkedTaskId)
  const status = latestMinutes?.status

  if (!summary.trim() && actionItems.length === 0 && decisions.length === 0) {
    return (
      <section className="border border-dashed border-neutral-200 bg-white px-4 py-8 text-center">
        <Typography weight="medium" className="mb-2">
          Meeting recap has not been generated
        </Typography>
        <Typography variant="small" tone="muted" className="mb-4">
          Finish live notes or write a summary, then submit for review when ready.
        </Typography>
        {onEditSummary ? (
          <Button size="sm" variant="neutral-flat" onClick={onEditSummary}>
            Edit summary
          </Button>
        ) : null}
      </section>
    )
  }

  return (
    <section className="border border-neutral-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Stack direction="horizontal" spacing="sm" className="items-center">
          <Typography weight="semibold">Meeting recap</Typography>
          {latestMinutes ? (
            <Badge tone={minutesStatusTone(latestMinutes.status)}>
              {minutesStatusLabel(latestMinutes.status)}
            </Badge>
          ) : (
            <Badge tone="neutral">Draft</Badge>
          )}
        </Stack>
        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          {status === 'DRAFT' || !latestMinutes ? (
            <Button
              size="sm"
              variant="neutral-flat"
              className="bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
              disabled={acting}
              onClick={onSubmitForReview}
            >
              Submit for review
            </Button>
          ) : null}
          {status === 'IN_REVIEW' ? (
            <>
              {onReject ? (
                <Button size="sm" variant="neutral-flat" disabled={acting} onClick={onReject}>
                  Request changes
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="neutral-flat"
                className="bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                disabled={acting}
                onClick={onApprove}
              >
                Approve
              </Button>
            </>
          ) : null}
          {(status === 'APPROVED' || status === 'IN_REVIEW' || status === 'DRAFT') &&
          latestMinutes &&
          !latestMinutes.documentId ? (
            <Button
              size="sm"
              variant="neutral-flat"
              icon={<FileText size={14} />}
              loading={generatingDoc}
              onClick={onGenerateDoc}
            >
              Publish meeting note
            </Button>
          ) : null}
          {latestMinutes?.documentId ? (
            <Button
              size="sm"
              variant="neutral-flat"
              icon={<ExternalLink size={14} />}
              onClick={onOpenDoc}
            >
              Open meeting note
            </Button>
          ) : null}
        </Stack>
      </div>

      <div className="space-y-5">
        <div>
          <Typography variant="small" weight="medium" className="mb-1 text-neutral-500">
            Summary
          </Typography>
          <Typography className="whitespace-pre-wrap text-sm">
            {summary.trim() || '—'}
          </Typography>
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 text-neutral-500">
            Decisions · {decisions.length}
          </Typography>
          {decisions.length === 0 ? (
            <Typography variant="small" tone="muted">
              No decisions captured
            </Typography>
          ) : (
            <ol className="list-decimal space-y-1 pl-5">
              {decisions.map((d, i) => (
                <li key={`${d}-${i}`}>
                  <Typography variant="small">{d}</Typography>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 text-neutral-500">
            Action items · {actionItems.length}
          </Typography>
          <Typography variant="small" tone="muted" className="mb-2">
            {linkedActions.length} linked to tasks · {openActions.length} open
          </Typography>
          {actionItems.length === 0 ? (
            <Typography variant="small" tone="muted">
              No action items
            </Typography>
          ) : (
            <ul className="space-y-1">
              {actionItems.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <Typography variant="small">{a.title}</Typography>
                  <Badge tone={a.status === 'COMPLETED' ? 'success' : 'neutral'}>
                    {actionItemStatusLabel(a.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 text-neutral-500">
            Risks and issues · {risks.length}
          </Typography>
          {risks.length === 0 ? (
            <Typography variant="small" tone="muted">
              None captured
            </Typography>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {risks.map((r, i) => (
                <li key={`${r}-${i}`}>
                  <Typography variant="small">{r}</Typography>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 text-neutral-500">
            Attendance
          </Typography>
          <Typography variant="small" tone="muted">
            {present} present · {participants.length - present} not marked · {participants.length}{' '}
            invited
          </Typography>
        </div>
      </div>
    </section>
  )
}
