'use client'

import { LegacyQualityRedirect, ReleaseCenterView } from '@/modules/quality'

export default function Page() {
  return (
    <LegacyQualityRedirect target="releases">
      <ReleaseCenterView />
    </LegacyQualityRedirect>
  )
}
