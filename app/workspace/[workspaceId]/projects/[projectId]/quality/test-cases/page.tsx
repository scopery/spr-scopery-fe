'use client'

import { LegacyQualityRedirect, TestCaseCatalogView } from '@/modules/quality'

export default function TestCaseCatalogPage() {
  return (
    <LegacyQualityRedirect target="cases-functional">
      <TestCaseCatalogView />
    </LegacyQualityRedirect>
  )
}
