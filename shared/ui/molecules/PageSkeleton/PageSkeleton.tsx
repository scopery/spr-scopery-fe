import React from 'react'
import { cn } from '@/utils/cn'
import { Skeleton } from '../../atoms/Skeleton'

export type PageSkeletonVariant = 'list' | 'split' | 'cards' | 'form' | 'detail'

export interface PageSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout placeholder that matches common page shapes. */
  variant?: PageSkeletonVariant
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="text" width={320} height={14} />
        </div>
        <Skeleton variant="rectangular" width={120} height={36} />
      </div>
      <div className="flex gap-3">
        <Skeleton variant="rectangular" width="100%" height={40} className="max-w-sm" />
        <Skeleton variant="rectangular" width={160} height={40} />
      </div>
      <div className="overflow-hidden border border-neutral-200">
        <Skeleton variant="rectangular" width="100%" height={44} />
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-t border-neutral-100 px-4 py-3"
          >
            <Skeleton variant="text" width="28%" height={14} />
            <Skeleton variant="text" width="18%" height={14} />
            <Skeleton variant="text" width="14%" height={14} />
            <Skeleton variant="text" width="20%" height={14} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SplitSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton variant="text" width={240} height={28} />
        <Skeleton variant="text" width={360} height={14} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="border border-neutral-200 bg-surface-card">
          <div className="border-b border-neutral-100 px-4 py-3">
            <Skeleton variant="text" width={140} height={14} />
          </div>
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2 px-4 py-3">
                <Skeleton variant="text" width="70%" height={14} />
                <Skeleton variant="text" width="40%" height={12} />
              </div>
            ))}
          </div>
        </div>
        <div className="border border-neutral-200 bg-surface-card p-4">
          <Skeleton variant="text" width="45%" height={22} className="mb-4" />
          <div className="space-y-3">
            <Skeleton variant="rectangular" width="100%" height={40} />
            <Skeleton variant="rectangular" width="100%" height={40} />
            <Skeleton variant="rectangular" width="100%" height={120} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton variant="text" width={220} height={28} />
        <Skeleton variant="text" width={300} height={14} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 border border-neutral-200 p-4">
            <Skeleton variant="text" width="60%" height={18} />
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="text" width="80%" height={12} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Skeleton variant="text" width={200} height={28} />
      <Skeleton variant="text" width="80%" height={14} />
      <div className="space-y-3 border border-neutral-200 bg-surface-card p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton variant="text" width={100} height={12} />
            <Skeleton variant="rectangular" width="100%" height={40} />
          </div>
        ))}
        <Skeleton variant="rectangular" width={140} height={36} />
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width={120} height={14} />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width={260} height={28} />
          <Skeleton variant="text" width={180} height={14} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={96} height={36} />
          <Skeleton variant="rectangular" width={96} height={36} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 border border-neutral-200 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex justify-between gap-4">
              <Skeleton variant="text" width="30%" height={12} />
              <Skeleton variant="text" width="45%" height={12} />
            </div>
          ))}
        </div>
        <div className="space-y-3 border border-neutral-200 p-4">
          <Skeleton variant="rectangular" width="100%" height={160} />
          <Skeleton variant="text" width="70%" height={12} />
          <Skeleton variant="text" width="50%" height={12} />
        </div>
      </div>
    </div>
  )
}

/**
 * In-shell page placeholder. Prefer this over ContentLoader for route/content loading.
 * Use ContentLoader only for true full-viewport takeover (auth gates, blocking shells).
 */
export function PageSkeleton({
  variant = 'list',
  className,
  ...props
}: PageSkeletonProps) {
  return (
    <div
      className={cn('w-full', className)}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading page"
      {...props}
    >
      {variant === 'list' ? <ListSkeleton /> : null}
      {variant === 'split' ? <SplitSkeleton /> : null}
      {variant === 'cards' ? <CardsSkeleton /> : null}
      {variant === 'form' ? <FormSkeleton /> : null}
      {variant === 'detail' ? <DetailSkeleton /> : null}
    </div>
  )
}
