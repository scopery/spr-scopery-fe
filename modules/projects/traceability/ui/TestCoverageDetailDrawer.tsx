'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Checkbox, DetailDrawer, Input, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import type { LinkableTestCase } from '../api/traceability.api'
import {
  coverageNextAction,
  coverageStatusLabel,
  coverageStatusTone,
  type RequirementCoverageRow,
} from '../model/requirement-coverage'

interface TestCoverageDetailDrawerProps {
  open: boolean
  row: RequirementCoverageRow | null
  initialMode?: 'summary' | 'link'
  onClose: () => void
  loadLinkableTestCases: (requirementId: string, query?: string) => Promise<LinkableTestCase[]>
  onLink: (requirementId: string, testCaseIds: string[]) => Promise<void>
  onOpenTestRuns: () => void
  onOpenDefects: () => void
  onOpenTestCases: () => void
  onOpenVerificationCases: () => void
}

function resultTone(result: string): 'success' | 'error' | 'progress' | 'neutral' | 'warning' {
  switch (result.toUpperCase()) {
    case 'PASSED':
      return 'success'
    case 'FAILED':
      return 'error'
    case 'BLOCKED':
      return 'progress'
    case 'SKIPPED':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function TestCoverageDetailDrawer({
  open,
  row,
  initialMode = 'summary',
  onClose,
  loadLinkableTestCases,
  onLink,
  onOpenTestRuns,
  onOpenDefects,
  onOpenTestCases,
  onOpenVerificationCases,
}: TestCoverageDetailDrawerProps) {
  const [mode, setMode] = useState<'summary' | 'link'>(initialMode)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<LinkableTestCase[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setQuery('')
    setOptions([])
    setSelected(new Set())
  }, [open, row?.requirementId, initialMode])

  useEffect(() => {
    if (!open || mode !== 'link' || !row) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const items = await loadLinkableTestCases(row.requirementId, query.trim() || undefined)
        if (!cancelled) setOptions(items)
      } catch (error) {
        if (!cancelled) toast.error(getProblemToastMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, mode, query, row, loadLinkableTestCases])

  const nextAction = row ? coverageNextAction(row) : null
  const linkedTests = useMemo(() => row?.testCases ?? [], [row?.testCases])
  const isNfr = ['NON_FUNCTIONAL', 'NFR'].includes(
    (row?.reqType ?? '').toUpperCase().replace(/-/g, '_')
  )

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    if (!row || selected.size === 0) return
    setSaving(true)
    try {
      await onLink(row.requirementId, [...selected])
      toast.success(
        `${selected.size} Test Case${selected.size === 1 ? '' : 's'} linked successfully.`
      )
      setMode('summary')
      setSelected(new Set())
    } catch (error) {
      toast.error(getProblemToastMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const runNextAction = () => {
    if (!nextAction) return
    if (nextAction.type === 'LINK_TEST_CASE') onOpenTestCases()
    else if (nextAction.type === 'RESOLVE_BLOCKER') onOpenDefects()
    else onOpenTestRuns()
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      size="md"
      backdropClassName="bg-neutral-900/25 backdrop-blur-none"
      title={
        mode === 'summary'
          ? row
            ? `${row.code} · ${row.title}`
            : 'Test coverage'
          : 'Link Test Cases'
      }
      subtitle={
        mode === 'summary'
          ? isNfr
            ? 'NFR verification coverage'
            : 'Requirement test coverage'
          : 'Requirement linking'
      }
      footer={
        mode === 'link' ? (
          <div className="flex items-center justify-between gap-3">
            <Typography variant="small" tone="muted">
              Selected: {selected.size}
            </Typography>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={saving} onClick={() => setMode('summary')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={saving}
                disabled={selected.size === 0}
                onClick={() => void save()}
              >
                Link selected
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {row && mode === 'summary' && isNfr ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge size="sm" variant="soft" tone="neutral" className="border-0">
              Non-functional
            </Badge>
          </div>
          <section className="border border-neutral-200 px-4 py-4">
            <Typography variant="small" weight="semibold">
              NFR verification pipeline
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              This requirement is verified through an NFR specification, verification targets,
              Verification Cases, and measured results. Functional Test Case links are not used
              here.
            </Typography>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={onOpenVerificationCases}>
                Open Verification Cases
              </Button>
              <Button size="sm" variant="secondary" onClick={onOpenTestRuns}>
                Open Verification Runs
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {row && mode === 'summary' && !isNfr ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge
              size="sm"
              variant="soft"
              tone={coverageStatusTone(row.coverageStatus)}
              className="border-0"
            >
              {coverageStatusLabel(row.coverageStatus)}
            </Badge>
            <Badge
              size="sm"
              variant="soft"
              tone={resultTone(row.latestResultLabel)}
              className="border-0"
            >
              {row.latestResultLabel}
            </Badge>
          </div>

          <section className="border border-neutral-200">
            <div className="border-b border-neutral-100 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <Typography variant="small" weight="semibold">
                  Linked Test Cases{' '}
                  <span className="font-normal text-neutral-400">{row.testCaseCount}</span>
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto px-0 font-normal"
                  onClick={onOpenTestCases}
                >
                  Open Catalog
                </Button>
              </div>
              {linkedTests.length === 0 ? (
                <Typography variant="small" tone="muted" className="mt-1">
                  None linked
                </Typography>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {linkedTests.slice(0, 5).map((testCase) => (
                    <li
                      key={testCase.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {[testCase.code, testCase.title].filter(Boolean).join(' · ')}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-500">
                        {testCase.latestResultLabel}
                      </span>
                    </li>
                  ))}
                  {row.testCaseCount > 5 ? (
                    <li className="text-xs text-neutral-500">+{row.testCaseCount - 5} more</li>
                  ) : null}
                </ul>
              )}
            </div>

            <div className="border-b border-neutral-100 px-3 py-3">
              <Typography variant="small" weight="semibold">
                Latest result
              </Typography>
              <Typography variant="small" className="mt-1">
                {row.latestResultLabel}
              </Typography>
            </div>

            <div className="px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <Typography variant="small" weight="semibold">
                  Open defects
                </Typography>
                {row.openDefects.length > 0 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto px-0 font-normal"
                    onClick={onOpenDefects}
                  >
                    Open Defects
                  </Button>
                ) : null}
              </div>
              {row.openDefects.length === 0 ? (
                <Typography variant="small" tone="muted" className="mt-1">
                  None
                </Typography>
              ) : (
                <ul className="mt-2 space-y-1">
                  {row.openDefects.slice(0, 3).map((defect) => (
                    <li key={defect.id} className="text-sm">
                      {[defect.code, defect.title].filter(Boolean).join(' · ')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="border border-neutral-200 bg-neutral-50 px-4 py-3">
            <Typography variant="small" weight="semibold">
              Next action
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {nextAction?.type === 'LINK_TEST_CASE'
                ? 'Create a Test Case under a linked Use Case to preserve the Functional traceability path.'
                : nextAction?.type === 'START_TEST_RUN'
                  ? 'Linked Test Cases have not been executed.'
                  : nextAction?.type === 'REVIEW_FAILURE'
                    ? 'The latest execution contains a failed result.'
                    : nextAction?.type === 'RESOLVE_BLOCKER'
                      ? 'The latest execution is blocked.'
                      : 'Review the latest execution results.'}
            </Typography>
            <Button size="sm" variant="primary" className="mt-3" onClick={runNextAction}>
              {nextAction?.label}
            </Button>
          </section>

          <Button
            size="sm"
            variant="ghost"
            className="h-auto px-0 font-normal"
            onClick={onOpenTestCases}
          >
            Open Test Cases
          </Button>
        </div>
      ) : null}

      {row && mode === 'link' && !isNfr ? (
        <div className="space-y-4">
          <Button
            size="sm"
            variant="ghost"
            icon={<ArrowLeft size={14} />}
            className="h-auto px-0 font-normal"
            onClick={() => setMode('summary')}
          >
            Back to coverage
          </Button>
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Requirement
            </Typography>
            <Typography weight="medium">
              {row.code} · {row.title}
            </Typography>
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Test Cases by code or title…"
            prefix={<Search size={14} />}
          />
          <div>
            <Typography variant="small" weight="semibold" className="mb-2">
              Available Test Cases
            </Typography>
            {loading ? (
              <Typography variant="small" tone="muted">
                Loading…
              </Typography>
            ) : options.length === 0 ? (
              <div className="border border-neutral-200 px-4 py-5">
                <Typography variant="small" weight="medium">
                  No linkable Test Cases are available.
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-auto px-0 font-normal"
                  onClick={onOpenTestCases}
                >
                  Open Test Cases
                </Button>
              </div>
            ) : (
              <ul className="max-h-[48vh] overflow-y-auto border border-neutral-200">
                {options.map((testCase) => {
                  const label = [testCase.code, testCase.title].filter(Boolean).join(' · ')
                  return (
                    <li key={testCase.id} className="border-b border-neutral-100 last:border-b-0">
                      <label
                        className={cn(
                          'flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-neutral-50',
                          selected.has(testCase.id) && 'bg-neutral-50'
                        )}
                      >
                        <Checkbox
                          size="sm"
                          checked={selected.has(testCase.id)}
                          onChange={() => toggle(testCase.id)}
                          className="mt-0.5"
                          aria-label={label}
                        />
                        <span className="min-w-0">
                          <Typography variant="small">{label}</Typography>
                          {testCase.status ? (
                            <Typography variant="caption" tone="muted">
                              {testCase.status}
                            </Typography>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
