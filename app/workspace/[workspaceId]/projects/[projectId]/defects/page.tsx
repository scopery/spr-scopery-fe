'use client'

import { LegacyQualityRedirect, DefectCenterView } from '@/modules/quality'

export default function Page() {
  return (
    <LegacyQualityRedirect target="defects">
      <DefectCenterView />
    </LegacyQualityRedirect>
  )
}
