'use client'

import NextLink from 'next/link'
import { Badge, Button, Typography } from '@/shared/ui'
import type { PortfolioAttentionItem } from '../../domain/rules/portfolio.rules'
import { portfolioSeverityTone } from './portfolioStatusTones'

interface WorkspaceAttentionQueueProps {
  items: PortfolioAttentionItem[]
}

export function WorkspaceAttentionQueue({ items }: WorkspaceAttentionQueueProps) {
  return (
    <section className="border border-neutral-200 bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <Typography as="h2" size="sm" weight="semibold">
          Needs your attention
        </Typography>
        {items.length > 0 ? (
          <Badge variant="solid" tone="error" size="sm">
            {items.length}
          </Badge>
        ) : null}
      </header>
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            No urgent portfolio issues right now.
          </Typography>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="solid" size="sm" tone={portfolioSeverityTone(item.severity)}>
                      {item.severity}
                    </Badge>
                    {item.projectName ? (
                      <Typography variant="small" tone="muted">
                        {item.projectName}
                      </Typography>
                    ) : null}
                  </div>
                  <Typography weight="medium" className="text-neutral-900">
                    {item.title}
                  </Typography>
                  <Typography variant="small" tone="muted" className="mt-0.5">
                    {item.impact}
                  </Typography>
                </div>
                <Button as={NextLink} href={item.href} variant="outline" size="sm">
                  {item.ctaLabel}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
