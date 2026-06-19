'use client'

import { useEffect, useState } from 'react'
import { Typography, Button, Badge, Select } from '@/shared/ui'
import type { AiPurpose, AiRunStatus } from '@/modules/admin'
import { useRouter } from 'next/navigation'
import { FEATURES } from '@/config/features'
import { useAdminAiRuns } from '@/modules/admin'

export default function AdminAIRunsPage() {
  const router = useRouter()
  const { runs, page, loading: isLoading, loadRuns } = useAdminAiRuns()
  const [offset, setOffset] = useState(0)

  // Filters
  const [purposeFilter, setPurposeFilter] = useState<AiPurpose | ''>('')
  const [statusFilter, setStatusFilter] = useState<AiRunStatus | ''>('')

  useEffect(() => {
    if (!FEATURES.aiAdminConfig) {
      router.replace('/admin/templates')
      return
    }
    void loadRuns({
      purpose: purposeFilter || undefined,
      status: statusFilter || undefined,
      limit: 50,
      offset,
    })
  }, [purposeFilter, statusFilter, offset, loadRuns, router])

  const handleNextPage = () => {
    setOffset((prev) => prev + 50)
  }
  const handlePrevPage = () => {
    setOffset((prev) => Math.max(0, prev - 50))
  }

  const STATUS_BADGE_VARIANT: Record<AiRunStatus, 'success' | 'warning' | 'error'> = {
    success: 'success',
    fallback_success: 'warning',
    failed: 'error',
  }

  const PURPOSE_LABELS: Record<string, string> = {
    improve_answer: 'Improve Answer',
    qgen_clarifying_questions: 'Generate Questions',
    clarity_assess_one: 'Clarity Assessment',
    impact_analysis: 'Impact Analysis',
  }

  const ENGINE_LABELS: Record<string, string> = {
    legacy_chat: 'Legacy',
    workflow_api: 'Workflow',
    agents_sdk: 'Agents',
  }

  if (!FEATURES.aiAdminConfig) return null

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Typography variant="2xl" className="mb-2 font-semibold">
            AI Orchestrator Runs
          </Typography>
          <Typography variant="sm" className="text-neutral-600">
            Audit log of all AI orchestration runs
          </Typography>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/ai')}>
          Back to Configs
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 rounded-lg bg-neutral-50 p-4">
        <div className="w-64">
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Purpose
          </Typography>
          <Select
            value={purposeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setPurposeFilter(e.target.value as AiPurpose | '')
              setOffset(0)
            }}
          >
            <option value="">All Purposes</option>
            <option value="improve_answer">Improve Answer</option>
            <option value="qgen_clarifying_questions">Generate Questions</option>
            <option value="clarity_assess_one">Clarity Assessment</option>
            <option value="impact_analysis">Impact Analysis</option>
          </Select>
        </div>

        <div className="w-64">
          <Typography variant="sm" className="mb-2 font-semibold text-neutral-700">
            Status
          </Typography>
          <Select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setStatusFilter(e.target.value as AiRunStatus | '')
              setOffset(0)
            }}
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="fallback_success">Fallback Success</option>
            <option value="failed">Failed</option>
          </Select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={() => loadRuns()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Runs Table */}
      {isLoading ? (
        <div className="text-center">
          <Typography variant="base" className="text-neutral-500">
            Loading...
          </Typography>
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <Typography variant="base" className="text-neutral-600">
            No runs found
          </Typography>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                    Engine
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                    Latency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                    Error
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Typography variant="xs" className="text-neutral-800">
                        {new Date(run.created_at).toLocaleString()}
                      </Typography>
                    </td>
                    <td className="px-4 py-3">
                      <Typography variant="xs" className="text-neutral-800">
                        {PURPOSE_LABELS[run.purpose] || run.purpose}
                      </Typography>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm">
                        {ENGINE_LABELS[run.engine_used] || run.engine_used}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[run.status]} size="sm">
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Typography variant="xs" className="text-neutral-600">
                        {run.latency_ms}ms
                      </Typography>
                    </td>
                    <td className="px-4 py-3">
                      {run.error_code && (
                        <Typography variant="xs" className="text-error-600 font-mono">
                          {run.error_code}
                        </Typography>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/ai/runs/${run.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <Typography variant="sm" className="text-neutral-600">
              Showing {page.offset + 1} to {Math.min(page.offset + page.limit, page.total)} of{' '}
              {page.total} runs
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page.offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page.offset + page.limit >= page.total}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
