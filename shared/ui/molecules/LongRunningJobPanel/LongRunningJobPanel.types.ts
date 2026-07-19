import type { ReactNode } from 'react'
import type { UnifiedJob } from '@/shared/lib/unifiedJob'

export interface LongRunningJobPanelProps {
  job: UnifiedJob | null
  label?: string
  actions?: ReactNode
  className?: string
  onRetry?: () => void
  onCancel?: () => void
}
