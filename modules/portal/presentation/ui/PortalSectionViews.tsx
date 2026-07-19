'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Stack, Typography } from '@/shared/ui'

function PortalSimpleSection({ title, note }: { title: string; note: string }) {
  const { projectId } = useParams<{ projectId: string }>()
  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Link href={`/portal/projects/${projectId}`} className="text-sm underline">
        ← Project home
      </Link>
      <Typography variant="h2">{title}</Typography>
      <Typography tone="muted">{note}</Typography>
    </Stack>
  )
}

export function PortalMeetingsView() {
  return (
    <PortalSimpleSection
      title="Meetings"
      note="Portal-safe meeting list. Detail/agenda expand when portal DTOs are complete."
    />
  )
}

export function PortalFormsView() {
  return (
    <PortalSimpleSection
      title="Forms"
      note="External forms shared with portal accounts."
    />
  )
}

export function PortalFeedbackView() {
  return (
    <PortalSimpleSection
      title="Feedback"
      note="Client feedback with explicit visibility rules."
    />
  )
}
