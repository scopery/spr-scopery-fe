'use client'

import { cn } from '@/utils/cn'
import { UseCaseStatus } from '../model/use-case'

const STATUS_STYLES: Record<string, string> = {
  [UseCaseStatus.Draft]: 'bg-neutral-100 text-neutral-700',
  [UseCaseStatus.InReview]: 'bg-blue-100 text-blue-700',
  [UseCaseStatus.Approved]: 'bg-green-100 text-green-700',
  [UseCaseStatus.Deprecated]: 'bg-orange-100 text-orange-700',
  [UseCaseStatus.Archived]: 'bg-neutral-200 text-neutral-500',
}

const STATUS_LABELS: Record<string, string> = {
  [UseCaseStatus.Draft]: 'Draft',
  [UseCaseStatus.InReview]: 'In Review',
  [UseCaseStatus.Approved]: 'Approved',
  [UseCaseStatus.Deprecated]: 'Deprecated',
  [UseCaseStatus.Archived]: 'Archived',
}

interface Props {
  status: string
  className?: string
}

export function UseCaseStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-600',
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
