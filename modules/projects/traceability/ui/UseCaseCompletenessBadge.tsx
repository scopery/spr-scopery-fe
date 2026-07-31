'use client'

import { cn } from '@/utils/cn'
import { UseCaseCompletenessStatus } from '../model/use-case'

const COMPLETENESS_STYLES: Record<string, string> = {
  [UseCaseCompletenessStatus.NotStarted]: 'bg-neutral-100 text-neutral-500',
  [UseCaseCompletenessStatus.Incomplete]: 'bg-yellow-100 text-yellow-700',
  [UseCaseCompletenessStatus.ReadyForReview]: 'bg-blue-100 text-blue-700',
  [UseCaseCompletenessStatus.Complete]: 'bg-green-100 text-green-700',
}

const COMPLETENESS_LABELS: Record<string, string> = {
  [UseCaseCompletenessStatus.NotStarted]: 'Not Started',
  [UseCaseCompletenessStatus.Incomplete]: 'Incomplete',
  [UseCaseCompletenessStatus.ReadyForReview]: 'Ready for Review',
  [UseCaseCompletenessStatus.Complete]: 'Complete',
}

interface Props {
  completenessStatus: string
  className?: string
}

export function UseCaseCompletenessBadge({ completenessStatus, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium',
        COMPLETENESS_STYLES[completenessStatus] ?? 'bg-neutral-100 text-neutral-600',
        className
      )}
    >
      {COMPLETENESS_LABELS[completenessStatus] ?? completenessStatus}
    </span>
  )
}
