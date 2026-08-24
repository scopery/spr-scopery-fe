'use client'

import type { ReactNode } from 'react'
import { Typography } from '@/shared/ui'
import type { RunCaseScript } from '../hooks/useRunCaseScript'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Typography
        variant="caption"
        weight="medium"
        tone="muted"
        className="mb-1 uppercase tracking-wide"
      >
        {title}
      </Typography>
      <div className="whitespace-pre-wrap break-words text-sm text-neutral-900">{children}</div>
    </div>
  )
}

/** Compact script block for DataTable rows — always visible, no click required. */
export function RunCaseScriptInline({
  script,
  loading,
  error,
}: {
  script: RunCaseScript | null
  loading: boolean
  error: string | null
}) {
  if (loading && !script) {
    return (
      <Typography variant="small" tone="muted" className="mt-1.5 block">
        Loading script…
      </Typography>
    )
  }
  if (error && !script) {
    return (
      <Typography variant="small" tone="muted" className="mt-1.5 block">
        {error}
      </Typography>
    )
  }
  if (!script) return null

  if (script.kind === 'NFR') {
    const expected = script.expectedResultJson?.trim()
    if (!expected) {
      return (
        <Typography variant="small" tone="muted" className="mt-1.5 block">
          No expected result
        </Typography>
      )
    }
    return (
      <div className="mt-2 space-y-1.5 border-t border-neutral-100 pt-2 text-sm text-neutral-800">
        <div>
          <span className="font-medium text-neutral-600">Expected · </span>
          <span className="whitespace-pre-wrap break-words">{expected}</span>
        </div>
      </div>
    )
  }

  const hasSteps = script.steps.length > 0
  const hasPreconditions = Boolean(script.preconditions?.trim())
  const hasExpected = Boolean(script.expectedResult?.trim())

  if (!hasSteps && !hasPreconditions && !hasExpected) {
    return (
      <Typography variant="small" tone="muted" className="mt-1.5 block">
        No preconditions / steps / expected yet
      </Typography>
    )
  }

  return (
    <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto border-t border-neutral-100 pt-2 text-xs">
      {hasPreconditions ? (
        <div className="rounded bg-amber-50 px-2 py-1.5">
          <span className="mr-1.5 inline-block rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Pre
          </span>
          <span className="whitespace-pre-wrap break-words text-neutral-800">
            {script.preconditions}
          </span>
        </div>
      ) : null}

      {hasSteps ? (
        <div>
          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Steps
          </span>
          <ol className="space-y-1 text-neutral-800" style={{ listStyleType: 'decimal', paddingLeft: '1.1rem' }}>
            {script.steps.map((step) => (
              <li key={step.id} className="min-w-0">
                <span className="whitespace-pre-wrap break-words">{step.action || '—'}</span>
                {step.expectedResult?.trim() ? (
                  <span className="mt-0.5 block whitespace-pre-wrap break-words border-l-2 border-neutral-200 pl-2 text-neutral-500">
                    {step.expectedResult}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {hasExpected ? (
        <div className="rounded bg-green-50 px-2 py-1.5">
          <span className="mr-1.5 inline-block rounded bg-green-100 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
            Expect
          </span>
          <span className="whitespace-pre-wrap break-words text-neutral-800">
            {script.expectedResult}
          </span>
        </div>
      ) : null}
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
    return <Block title="Expected result">{script.expectedResultJson?.trim() || '—'}</Block>
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
      {hasPreconditions ? <Block title="Preconditions">{script.preconditions}</Block> : null}

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
                  <td className="whitespace-pre-wrap py-1.5 pr-3 text-neutral-900">
                    {step.action || '—'}
                  </td>
                  <td className="whitespace-pre-wrap py-1.5 text-neutral-800">
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
