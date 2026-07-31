'use client'

import { FEATURES } from '@/config/features'
import { QualityOverviewView, QualityCenterView } from '@/modules/quality'

export default function QualityPage() {
  if (FEATURES.qualitySimplifiedWorkflow) {
    return <QualityOverviewView />
  }
  return <QualityCenterView />
}
