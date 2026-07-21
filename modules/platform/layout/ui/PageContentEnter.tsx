'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Soft page-content enter on route change.
 * Header/sidebar stay still — only main body animates.
 */
export function PageContentEnter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const pathname = usePathname()
  return (
    <div
      key={pathname}
      className={cn('page-content motion-page-enter', className ?? 'min-h-full')}
    >
      {children}
    </div>
  )
}
