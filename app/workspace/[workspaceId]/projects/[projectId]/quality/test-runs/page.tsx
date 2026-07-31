'use client'

import { LegacyQualityRedirect, TestRunExecutionView } from '@/modules/quality'

export default function TestRunExecutionPage() {
  return (
    <LegacyQualityRedirect target="runs">
      <TestRunExecutionView />
    </LegacyQualityRedirect>
  )
}
