'use client'

import NextLink from 'next/link'
import { Button, Link as DesignLink, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useAiControlOverview } from '../hooks/useAiControlOverview'

interface OverviewCardProps {
  label: string
  count: number | null
  href: string
  error?: string
}

function OverviewCard({ label, count, href, error }: OverviewCardProps) {
  return (
    <DesignLink
      as={NextLink}
      href={href}
      className="block border border-neutral-200 p-md transition-colors hover:bg-neutral-50"
    >
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography variant="h3" className="mt-xs block">
        {count == null ? '—' : count.toLocaleString()}
      </Typography>
      {error ? (
        <Typography variant="caption" tone="error" className="mt-1 block">
          Unavailable
        </Typography>
      ) : null}
    </DesignLink>
  )
}

export function AiControlOverviewView() {
  const { counts, loading, error, refetch } = useAiControlOverview()

  if (loading && !counts) {
    return <PageSkeleton variant="cards" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">AI & Automation</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Control center overview. Counts are lazy-loaded from list APIs (size=1) — no mock
            data (GAP-09).
          </Typography>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          label="Providers"
          count={counts?.providers ?? null}
          href={ADMIN_ROUTES.aiControlProviders}
          error={counts?.errors.providers}
        />
        <OverviewCard
          label="Models"
          count={counts?.models ?? null}
          href={ADMIN_ROUTES.aiControlModels}
          error={counts?.errors.models}
        />
        <OverviewCard
          label="Deployments"
          count={counts?.deployments ?? null}
          href={ADMIN_ROUTES.aiControlDeployments}
          error={counts?.errors.deployments}
        />
        <OverviewCard
          label="Agents"
          count={counts?.agents ?? null}
          href={ADMIN_ROUTES.aiControlAgents}
          error={counts?.errors.agents}
        />
        <OverviewCard
          label="Prompt templates"
          count={counts?.promptTemplates ?? null}
          href={ADMIN_ROUTES.aiControlPrompts}
          error={counts?.errors.promptTemplates}
        />
        <OverviewCard
          label="Event configs"
          count={counts?.eventConfigs ?? null}
          href={ADMIN_ROUTES.aiControlEventConfigs}
          error={counts?.errors.eventConfigs}
        />
        <OverviewCard
          label="Usage policies"
          count={counts?.usagePolicies ?? null}
          href={ADMIN_ROUTES.aiControlUsagePolicies}
          error={counts?.errors.usagePolicies}
        />
        <OverviewCard
          label="Execution logs"
          count={counts?.executionLogs ?? null}
          href={ADMIN_ROUTES.aiControlExecutions}
          error={counts?.errors.executionLogs}
        />
        <OverviewCard
          label="Tools"
          count={counts?.tools ?? null}
          href={ADMIN_ROUTES.aiControlTools}
          error={counts?.errors.tools}
        />
      </div>

      <div className="flex flex-wrap gap-sm">
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlPlayground} variant="outline" size="sm">
          Open playground
        </Button>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.aiControlProviderSecrets}
          variant="outline"
          size="sm"
        >
          Provider secrets
        </Button>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.aiControlParameterCapabilities}
          variant="outline"
          size="sm"
        >
          Parameter capabilities
        </Button>
      </div>
    </Stack>
  )
}
