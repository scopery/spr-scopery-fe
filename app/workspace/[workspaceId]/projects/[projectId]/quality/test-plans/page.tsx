'use client'

import { LegacyQualityRedirect, TestManagementView } from '@/modules/quality'

export default function Page() {
  return (
    <LegacyQualityRedirect target="runs">
      <TestManagementView />
    </LegacyQualityRedirect>
  )
}
