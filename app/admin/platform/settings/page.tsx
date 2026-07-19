'use client'

import { PlatformPlaceholderView } from '@/modules/admin/platform-reliability/presentation/ui/PlatformPlaceholderView'

export default function PlatformSettingsPage() {
  return (
    <PlatformPlaceholderView
      title="Platform settings"
      description="Reliability toggles and retention (Đợt 3)."
      expectedApi="GET /api/platform/settings"
    />
  )
}
