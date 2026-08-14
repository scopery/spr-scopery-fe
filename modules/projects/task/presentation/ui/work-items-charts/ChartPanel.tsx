'use client'

import type { ReactNode } from 'react'
import { Typography } from '@/shared/ui'

export function ChartPanel({
  title,
  empty,
  children,
}: {
  title: string
  empty?: boolean
  children: ReactNode
}) {
  return (
    <section className="border border-neutral-300 bg-white p-4">
      <Typography weight="medium" size="sm" className="mb-3">
        {title}
      </Typography>
      {empty ? (
        <Typography variant="small" tone="muted">
          No data yet
        </Typography>
      ) : (
        children
      )}
    </section>
  )
}
