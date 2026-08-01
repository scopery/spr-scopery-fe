'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Checkbox, DetailDrawer, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { CaseKind, RunMembershipItem, TestCase, VerificationCase } from '../../domain/model/quality'

type MembershipTab = 'in-run' | 'add'

interface Candidate {
  caseKind: CaseKind
  caseId: string
  label: string
  meta?: string
}

interface RunMembershipDrawerProps {
  open: boolean
  projectId: string
  runId: string
  runName: string
  runScope?: string | null
  onClose: () => void
  onChanged: () => Promise<void>
}

function memberKey(kind: CaseKind, id: string) {
  return `${kind}:${id}`
}

export function RunMembershipDrawer({
  open,
  projectId,
  runId,
  runName,
  runScope,
  onClose,
  onChanged,
}: RunMembershipDrawerProps) {
  const [tab, setTab] = useState<MembershipTab>('add')
  const [membership, setMembership] = useState<RunMembershipItem[]>([])
  const [functionalCases, setFunctionalCases] = useState<TestCase[]>([])
  const [nfrCases, setNfrCases] = useState<VerificationCase[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [addQuery, setAddQuery] = useState('')
  const [inRunQuery, setInRunQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const scope = String(runScope ?? 'FUNCTIONAL').toUpperCase()
  const showFunctional = scope === 'FUNCTIONAL' || scope === 'MIXED'
  const showNfr = scope === 'NON_FUNCTIONAL' || scope === 'MIXED'

  const linkedKeys = useMemo(
    () => new Set(membership.map((item) => memberKey(item.caseKind, item.caseId))),
    [membership]
  )

  const load = useCallback(async () => {
    if (!open || !projectId || !runId) return
    setLoading(true)
    setUnavailable(false)
    try {
      const [membershipRes, functionalRes, nfrRes] = await Promise.all([
        qualityApi.getRunMembership(projectId, runId),
        showFunctional
          ? qualityApi.listTestCases(projectId, { size: 500 })
          : Promise.resolve({ items: [] as TestCase[] }),
        showNfr
          ? qualityApi.listVerificationCases(projectId, { size: 500 })
          : Promise.resolve({ items: [] as VerificationCase[] }),
      ])

      if (!membershipRes) {
        setMembership([])
        setUnavailable(true)
      } else {
        setMembership(membershipRes.items)
        setUnavailable(false)
      }
      setFunctionalCases(functionalRes.items ?? [])
      setNfrCases(nfrRes.items ?? [])
      setSelected(new Set())
      setAddQuery('')
      setInRunQuery('')
      setTab(membershipRes?.items?.length ? 'in-run' : 'add')
    } catch (err) {
      setUnavailable(true)
      toast.error(err instanceof Error ? err.message : 'Failed to load run membership')
    } finally {
      setLoading(false)
    }
  }, [open, projectId, runId, showFunctional, showNfr])

  useEffect(() => {
    void load()
  }, [load])

  const filteredMembership = useMemo(() => {
    const q = inRunQuery.trim().toLowerCase()
    if (!q) return membership
    return membership.filter((item) =>
      `${item.caseTitle ?? ''} ${item.caseCode ?? ''} ${item.caseKind}`
        .toLowerCase()
        .includes(q)
    )
  }, [inRunQuery, membership])

  const candidates = useMemo(() => {
    const list: Candidate[] = []
    if (showFunctional) {
      for (const item of functionalCases) {
        list.push({
          caseKind: 'FUNCTIONAL',
          caseId: item.id,
          label: item.title,
          meta: [item.code, item.status].filter(Boolean).join(' · ') || 'Functional',
        })
      }
    }
    if (showNfr) {
      for (const item of nfrCases) {
        list.push({
          caseKind: 'NFR',
          caseId: item.id,
          label: item.title,
          meta: item.code ?? 'NFR',
        })
      }
    }
    const q = addQuery.trim().toLowerCase()
    return list.filter((item) => {
      if (linkedKeys.has(memberKey(item.caseKind, item.caseId))) return false
      if (!q) return true
      return `${item.label} ${item.meta ?? ''}`.toLowerCase().includes(q)
    })
  }, [addQuery, functionalCases, linkedKeys, nfrCases, showFunctional, showNfr])

  const candidateKeys = useMemo(
    () => candidates.map((item) => memberKey(item.caseKind, item.caseId)),
    [candidates]
  )

  const allVisibleSelected =
    candidateKeys.length > 0 && candidateKeys.every((key) => selected.has(key))
  const someVisibleSelected = candidateKeys.some((key) => selected.has(key))

  const toggle = (kind: CaseKind, id: string) => {
    const key = memberKey(kind, id)
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        for (const key of candidateKeys) next.delete(key)
      } else {
        for (const key of candidateKeys) next.add(key)
      }
      return next
    })
  }

  const addSelected = async () => {
    if (selected.size === 0) return
    setSaving(true)
    try {
      const add = [...selected].map((key) => {
        const sep = key.indexOf(':')
        const caseKind = key.slice(0, sep) as CaseKind
        const caseId = key.slice(sep + 1)
        return { caseKind, caseId }
      })
      const res = await qualityApi.manageRunMembership(projectId, runId, { add })
      if (!res) {
        setUnavailable(true)
        toast.message(
          'Could not update run membership. Retry, or link cases via Test Suite as a fallback.'
        )
        return
      }
      setMembership(res.items)
      setSelected(new Set())
      await onChanged()
      toast.success(`${add.length} case${add.length === 1 ? '' : 's'} added to run`)
    } finally {
      setSaving(false)
    }
  }

  const removeMember = async (item: RunMembershipItem) => {
    setSaving(true)
    try {
      const res = await qualityApi.manageRunMembership(projectId, runId, {
        remove: [{ caseKind: item.caseKind, caseId: item.caseId }],
      })
      if (!res) {
        setUnavailable(true)
        toast.message('Cannot remove cases until membership API is available')
        return
      }
      setMembership(res.items)
      await onChanged()
      toast.success('Case removed from run')
    } finally {
      setSaving(false)
    }
  }

  const tabs: Array<{ id: MembershipTab; label: string }> = [
    { id: 'in-run', label: `In run (${membership.length})` },
    { id: 'add', label: 'Add cases' },
  ]

  return (
    <DetailDrawer open={open} onClose={onClose} title="Run membership" subtitle={runName}>
      <div className="flex h-full min-h-0 flex-col p-4">
        {unavailable ? (
          <div className="space-y-3 border border-neutral-200 bg-neutral-50 p-3">
            <Typography weight="medium" size="sm">
              Direct membership unavailable
            </Typography>
            <Typography variant="small" tone="muted">
              Could not load membership for this run. Fallback via Test Suite:
            </Typography>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
              <li>Tạo Test Plan + Suite (Test Management).</li>
              <li>Gắn Test Cases vào Suite.</li>
              <li>
                <strong>New run</strong> → chọn Plan + Suite → Create.
              </li>
              <li>
                Bấm <strong>Start</strong> — cases từ suite vào bảng kết quả.
              </li>
            </ol>
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Membership sections"
              className="mb-3 flex shrink-0 gap-1 border-b border-neutral-200"
            >
              {tabs.map((item) => {
                const active = tab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
                      active
                        ? 'border-neutral-900 font-medium text-neutral-900'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800'
                    )}
                  >
                    {item.label}
                    {item.id === 'add' && selected.size > 0 ? (
                      <span className="ml-1 text-neutral-400">· {selected.size}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            {tab === 'in-run' ? (
              <section className="flex min-h-0 flex-1 flex-col gap-2" role="tabpanel">
                <Input
                  fullWidth
                  value={inRunQuery}
                  onChange={(e) => setInRunQuery(e.target.value)}
                  placeholder="Search cases in this run…"
                  prefix={<Search size={14} />}
                />
                <div className="min-h-0 flex-1 overflow-y-auto border border-neutral-200">
                  {loading ? (
                    <Typography variant="small" tone="muted" className="p-3">
                      Loading…
                    </Typography>
                  ) : membership.length === 0 ? (
                    <div className="space-y-3 p-4">
                      <Typography variant="small" tone="muted">
                        No cases in this run yet.
                      </Typography>
                      <Button size="sm" onClick={() => setTab('add')}>
                        Go to Add cases
                      </Button>
                    </div>
                  ) : filteredMembership.length === 0 ? (
                    <Typography variant="small" tone="muted" className="p-3">
                      No cases match this search.
                    </Typography>
                  ) : (
                    <ul className="divide-y divide-neutral-100">
                      {filteredMembership.map((item) => (
                        <li
                          key={memberKey(item.caseKind, item.caseId)}
                          className="flex items-center justify-between gap-2 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <Typography variant="small" weight="medium" className="block truncate">
                              {item.caseTitle ?? 'Untitled'}
                            </Typography>
                            <Typography variant="caption" tone="muted">
                              {item.caseKind}
                              {item.caseCode ? ` · ${item.caseCode}` : ''}
                            </Typography>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            tone="error"
                            disabled={saving}
                            icon={<Trash2 size={14} />}
                            onClick={() => void removeMember(item)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ) : (
              <section className="flex min-h-0 flex-1 flex-col gap-2" role="tabpanel">
                <Typography variant="caption" tone="muted">
                  Pick Functional
                  {showNfr ? ' / NFR' : ''} cases for this run scope, then Add to run.
                </Typography>
                <Input
                  fullWidth
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="Search cases to add…"
                  prefix={<Search size={14} />}
                />
                {candidates.length > 0 || selected.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        size="sm"
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected && !allVisibleSelected}
                        disabled={candidates.length === 0}
                        onChange={toggleSelectAllVisible}
                        aria-label={
                          addQuery.trim()
                            ? 'Select all matching search results'
                            : 'Select all available cases'
                        }
                      />
                      <Typography variant="small">
                        {addQuery.trim()
                          ? `Select all matching (${candidates.length})`
                          : `Select all (${candidates.length})`}
                      </Typography>
                    </label>
                    {selected.size > 0 ? (
                      <>
                        <Typography variant="small" tone="muted">
                          {selected.size} selected
                        </Typography>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={saving}
                          icon={<Plus size={14} />}
                          onClick={() => void addSelected()}
                        >
                          Add to run
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<X size={14} />}
                          onClick={() => setSelected(new Set())}
                        >
                          Clear
                        </Button>
                      </>
                    ) : null}
                  </div>
                ) : null}
                <div className="min-h-0 flex-1 overflow-y-auto border border-neutral-200">
                  {candidates.length === 0 ? (
                    <Typography variant="small" tone="muted" className="p-3">
                      {loading
                        ? 'Loading candidates…'
                        : addQuery.trim()
                          ? 'No cases match this search.'
                          : 'No available cases. Create cases in Cases first.'}
                    </Typography>
                  ) : (
                    <ul>
                      {candidates.map((item) => {
                        const key = memberKey(item.caseKind, item.caseId)
                        return (
                          <li key={key}>
                            <label className="hover:bg-secondary/5 flex cursor-pointer items-start gap-2 px-3 py-2">
                              <Checkbox
                                size="sm"
                                checked={selected.has(key)}
                                onChange={() => toggle(item.caseKind, item.caseId)}
                              />
                              <span className="min-w-0">
                                <Typography
                                  variant="small"
                                  weight="medium"
                                  className="block truncate"
                                >
                                  {item.label}
                                </Typography>
                                <Typography variant="caption" tone="muted">
                                  {item.caseKind}
                                  {item.meta ? ` · ${item.meta}` : ''}
                                </Typography>
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DetailDrawer>
  )
}
