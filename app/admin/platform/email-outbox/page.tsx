'use client'

import { PlatformPlaceholderView } from '@/modules/admin/platform-reliability/presentation/ui/PlatformPlaceholderView'

export default function PlatformEmailOutboxPage() {
  return (
    <PlatformPlaceholderView
      title="Email outbox"
      description="Notification email queue — BE API exists; UI wiring is Đợt 2."
      expectedApi="GET /api/notification/email-outbox"
    />
  )
}
