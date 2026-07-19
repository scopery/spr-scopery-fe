'use client'

import { PlatformPlaceholderView } from '@/modules/admin/platform-reliability/presentation/ui/PlatformPlaceholderView'

export default function PlatformEventOutboxPage() {
  return (
    <PlatformPlaceholderView
      title="Event outbox"
      description="Transactional outbox for domain events (Đợt 2)."
      expectedApi="GET /api/platform/event-outbox"
    />
  )
}
