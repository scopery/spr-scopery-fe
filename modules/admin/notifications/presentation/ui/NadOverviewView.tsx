'use client'

import NextLink from 'next/link'
import { Typography } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

const CARDS = [
  {
    title: 'Email templates',
    description: 'Studio for templates, versions, publish, and preview',
    href: ADMIN_ROUTES.nadEmailTemplates,
  },
  {
    title: 'Email rules',
    description: 'Event → template routing and enablement',
    href: ADMIN_ROUTES.nadEmailRules,
  },
  {
    title: 'Automation rules',
    description: 'Reminders, alerts, digests (thin shell until BE schemas land)',
    href: ADMIN_ROUTES.nadAutomation,
  },
  {
    title: 'Delivery operations',
    description: 'Deliveries and outbox retry',
    href: ADMIN_ROUTES.nadDeliveries,
  },
]

export function NadOverviewView() {
  return (
    <div>
      <Typography as="h1" size="lg" weight="semibold" className="mb-2">
        Notification administration
      </Typography>
      <Typography tone="muted" className="mb-8">
        Manage templates, routing rules, automation shells, and delivery operations.
      </Typography>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <NextLink
            key={c.title}
            href={c.href}
            className="border border-neutral-200 bg-white p-5 hover:border-neutral-400"
          >
            <Typography weight="semibold">{c.title}</Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {c.description}
            </Typography>
          </NextLink>
        ))}
      </div>
    </div>
  )
}
