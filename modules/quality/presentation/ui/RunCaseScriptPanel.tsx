'use client'

import type { ReactNode } from 'react'
import { Typography } from '@/shared/ui'
import type { RunCaseScript } from '../hooks/useRunCaseScript'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Typography variant="caption" weight="medium" tone="muted" className="mb-1 uppercase tracking-wide">
        {title}
      </Typography>
      <div className="text-sm text-neutral-900 whitespace-pre-wrap break-words">{children}</div>
    </div>
  )
}

export function RunCaseScriptPanel({
  script,
  loading,
  error,
}: {
  script: RunCaseScript | null
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <Typography variant="caption" tone="muted">
        Loading test script…
      </Typography>
    )
  }
  if (error) {
    return (
      <Typography variant="caption" tone="muted">
        {error}
      </Typography>
    )
  }
  if (!script) return null

  if (script.kind === 'NFR') {
    return (
      <Block title="Expected result">
        {script.expectedResultJson?.trim() || '—'}
      </Block>
    )
  }

  const hasSteps = script.steps.length > 0
  const hasPreconditions = Boolean(script.preconditions?.trim())
  const hasExpected = Boolean(script.expectedResult?.trim())

  if (!hasSteps && !hasPreconditions && !hasExpected) {
    return (
      <Typography variant="caption" tone="muted">
        No preconditions or steps on this case yet.
      </Typography>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {hasPreconditions ? (
        <Block title="Preconditions">{script.preconditions}</Block>
      ) : null}

      {hasSteps ? (
        <div className="min-w-0 overflow-x-auto">
          <Typography
            variant="caption"
            weight="medium"
            tone="muted"
            className="mb-1 uppercase tracking-wide"
          >
            Steps
          </Typography>
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-600">
                <th className="w-10 py-1 pr-2 font-medium">#</th>
                <th className="py-1 pr-3 font-medium">Action</th>
                <th className="py-1 font-medium">Expected</th>
              </tr>
            </thead>
            <tbody>
              {script.steps.map((step, index) => (
                <tr key={step.id} className="border-b border-neutral-100 align-top">
                  <td className="py-1.5 pr-2 font-mono text-neutral-500">{index + 1}</td>
                  <td className="py-1.5 pr-3 whitespace-pre-wrap text-neutral-900">
                    {step.action || '—'}
                  </td>
                  <td className="py-1.5 whitespace-pre-wrap text-neutral-800">
                    {step.expectedResult?.trim() || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {hasExpected ? <Block title="Expected result">{script.expectedResult}</Block> : null}
    </div>
  )
}
