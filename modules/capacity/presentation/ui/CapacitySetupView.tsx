'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, Gauge, Layers, Users } from 'lucide-react'
import { Card, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'

const SECTIONS = [
  {
    id: 'calendars',
    title: 'Working Calendars',
    description: 'Define weekly schedules, holidays, and default calendars for the workspace.',
    href: (ws: string) => ROUTES.workspace.settingsCapacityCalendars(ws),
    icon: Calendar,
  },
  {
    id: 'resources',
    title: 'Resource Roles & Skills',
    description:
      'Catalog of resource roles and skills used for capacity planning — not IAM or cost roles.',
    href: (ws: string) => ROUTES.workspace.settingsCapacityResources(ws),
    icon: Layers,
  },
  {
    id: 'profiles',
    title: 'Capacity Profiles',
    description: 'Per-member daily hours, focus factor, and effective-dated calendar assignment.',
    href: (ws: string) => ROUTES.workspace.settingsCapacityProfiles(ws),
    icon: Users,
  },
  {
    id: 'policies',
    title: 'Utilization Policies',
    description:
      'Workspace thresholds for under-allocated, healthy, watch, overloaded, and critical.',
    href: (ws: string) => ROUTES.workspace.settingsCapacityPolicies(ws),
    icon: Gauge,
  },
] as const

export function CapacitySetupView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  return (
    <div>
      <div className="mb-2">
        <Typography as="h1" size="md" weight="medium">
          Capacity Setup
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Configure working calendars, resource catalogs, capacity profiles, and utilization
          thresholds. Operational planning lives under Workspace Capacity.
        </Typography>
      </div>

      <ul className="grid gap-md sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <li key={section.id}>
              <Card
                as={NextLink}
                href={section.href(workspaceId)}
                className="flex h-full flex-col gap-sm border border-neutral-200 bg-white p-md no-underline transition-colors hover:border-neutral-400 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-sm text-neutral-900">
                  <Icon size={18} aria-hidden className="text-neutral-500" />
                  <Typography as="span" weight="semibold">
                    {section.title}
                  </Typography>
                </span>
                <Typography as="span" variant="small" tone="muted">
                  {section.description}
                </Typography>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
