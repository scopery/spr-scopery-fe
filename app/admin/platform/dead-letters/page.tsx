'use client'

import { PlatformPlaceholderView } from '@/modules/admin/platform-reliability/presentation/ui/PlatformPlaceholderView'

export default function PlatformDeadLettersPage() {
  return (
    <PlatformPlaceholderView
      title="Dead letters"
      description="Failed deliveries awaiting operator action (Đợt 2)."
      expectedApi="GET /api/platform/dead-letters"
    />
  )
}
