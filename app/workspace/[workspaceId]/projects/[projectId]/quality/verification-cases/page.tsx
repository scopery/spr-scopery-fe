'use client'

import { LegacyQualityRedirect, VerificationCaseCatalogView } from '@/modules/quality'

export default function VerificationCaseCatalogPage() {
  return (
    <LegacyQualityRedirect target="cases-nfr">
      <VerificationCaseCatalogView />
    </LegacyQualityRedirect>
  )
}
