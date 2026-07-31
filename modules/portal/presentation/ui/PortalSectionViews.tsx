'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Stack, Typography } from '@/shared/ui'

function PortalSimpleSection({ title, note }: { title: string; note: string }) {
  const { projectId } = useParams<{ projectId: string }>()
  return (
    <Stack direction="vertical" spacing="sm" className="px-3 py-3 lg:px-4">
      <Link href={`/portal/projects/${projectId}`} className="text-sm underline">
        ← Project home
      </Link>
      <Typography as="h1" size="md" weight="medium">
        {title}
      </Typography>
      <Typography variant="small" tone="muted">
        {note}
      </Typography>
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
  return <PortalSimpleSection title="Forms" note="External forms shared with portal accounts." />
}

export function PortalFeedbackView() {
  return (
    <PortalSimpleSection title="Feedback" note="Client feedback with explicit visibility rules." />
  )
}
