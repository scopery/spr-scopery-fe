'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CircleArrowOutUpLeft } from 'lucide-react'
import { Typography, Button, ContentLoader, Input } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import {
  AIAgentStatusBadge,
  formatEstimatedCost,
} from '@/shared/components/ai-agent-control/ai-agent-badges'
import { useAiAgentsList } from '@/hooks/useAiAgents'

export default function AdminAIAgentsPage() {
  const router = useRouter()
  const { summary, items, loading } = useAiAgentsList()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!FEATURES.aiAdminAgents) {
      router.replace(ROUTES.admin.templates)
    }
  }, [router])

  if (!FEATURES.aiAdminAgents) return null

  const filtered = items.filter((item) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.key.toLowerCase().includes(q) ||
      item.feature.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <ContentLoader />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-primary hover:underline"
        >
          <CircleArrowOutUpLeft size={20} />
        </Link>
        <Typography as="h1" size="xl" weight="bold">
          AI Agents
        </Typography>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Manage AI agent prompts, models, and view usage
        </Typography>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total agents', value: summary.totalAgents },
            { label: 'Active agents', value: summary.activeAgents },
            { label: 'Runs this month', value: summary.runsThisMonth },
            {
              label: 'Est. cost this month',
              value: formatEstimatedCost(summary.estimatedCostThisMonth, 'USD'),
            },
          ].map((card) => (
            <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-4">
              <Typography variant="xs" className="mb-1 text-neutral-500 uppercase">
                {card.label}
              </Typography>
              <Typography variant="lg" className="font-semibold">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </Typography>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <Typography tone="muted">No AI agents configured yet.</Typography>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Runs (month)</th>
                <th className="px-4 py-3 font-medium">Cost (month)</th>
                <th className="px-4 py-3 font-medium">Last run</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr key={agent.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Typography weight="medium">{agent.name}</Typography>
                    <Typography variant="xs" tone="muted">
                      {agent.key}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">{agent.feature}</td>
                  <td className="px-4 py-3">
                    <AIAgentStatusBadge status={agent.status} />
                  </td>
                  <td className="px-4 py-3">
                    {agent.publishedVersionNumber != null
                      ? `v${agent.publishedVersionNumber}`
                      : 'None'}
                  </td>
                  <td className="px-4 py-3">
                    {agent.modelName ? (
                      <>
                        {agent.modelName}
                        {agent.modelTier ? (
                          <Typography variant="xs" tone="muted" className="block">
                            {agent.modelTier}
                          </Typography>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{agent.runsThisMonth}</td>
                  <td className="px-4 py-3">
                    {formatEstimatedCost(agent.costThisMonth, 'USD')}
                  </td>
                  <td className="px-4 py-3">
                    {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(ROUTES.admin.aiAgent(agent.id))}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
