'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Checkbox, DetailDrawer, Input, Typography } from '@/shared/ui'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { CaseKind, RunMembershipItem, TestCase, VerificationCase } from '../../domain/model/quality'

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

export function RunMembershipDrawer({
  open,
  projectId,
  runId,
  runName,
  runScope,
  onClose,
  onChanged,
}: RunMembershipDrawerProps) {
  const [membership, setMembership] = useState<RunMembershipItem[]>([])
  const [functionalCases, setFunctionalCases] = useState<TestCase[]>([])
  const [nfrCases, setNfrCases] = useState<VerificationCase[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const scope = String(runScope ?? 'FUNCTIONAL').toUpperCase()
  const showFunctional = scope === 'FUNCTIONAL' || scope === 'MIXED'
  const showNfr = scope === 'NON_FUNCTIONAL' || scope === 'MIXED'

  const memberKey = (kind: CaseKind, id: string) => `${kind}:${id}`

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
          ? qualityApi.listTestCases(projectId, { size: 100 })
          : Promise.resolve({ items: [] as TestCase[] }),
        showNfr
          ? qualityApi.listVerificationCases(projectId, { size: 100 })
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
      setQuery('')
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
    const q = query.trim().toLowerCase()
    return list.filter((item) => {
      if (linkedKeys.has(memberKey(item.caseKind, item.caseId))) return false
      if (!q) return true
      return `${item.label} ${item.meta ?? ''}`.toLowerCase().includes(q)
    })
  }, [functionalCases, linkedKeys, nfrCases, query, showFunctional, showNfr])

  const toggle = (kind: CaseKind, id: string) => {
    const key = memberKey(kind, id)
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const addSelected = async () => {
    if (selected.size === 0) return
    setSaving(true)
    try {
      const add = [...selected].map((key) => {
        const [caseKind, caseId] = key.split(':') as [CaseKind, string]
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

  return (
    <DetailDrawer open={open} onClose={onClose} title="Run membership" subtitle={runName}>
      <div className="flex h-full min-h-0 flex-col gap-4 p-4">
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
            <section className="space-y-2">
              <Typography weight="medium" size="sm">
                In this run ({membership.length})
              </Typography>
              {loading ? (
                <Typography variant="small" tone="muted">
                  Loading…
                </Typography>
              ) : membership.length === 0 ? (
                <Typography variant="small" tone="muted">
                  No cases yet. Select cases below and click Add.
                </Typography>
              ) : (
                <ul className="divide-y divide-neutral-100 border border-neutral-200">
                  {membership.map((item) => (
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
            </section>

            <section className="flex min-h-0 flex-1 flex-col gap-2">
              <Typography weight="medium" size="sm">
                Add cases
              </Typography>
              <Typography variant="caption" tone="muted">
                Pick Functional
                {showNfr ? ' / NFR' : ''} cases for this run scope, then Add to run.
              </Typography>
              <Input
                fullWidth
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cases…"
                prefix={<Search size={14} />}
              />
              {selected.size > 0 ? (
                <div className="flex items-center gap-2">
                  <Typography variant="small">{selected.size} selected</Typography>
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
                </div>
              ) : null}
              <div className="min-h-0 flex-1 overflow-y-auto border border-neutral-200">
                {candidates.length === 0 ? (
                  <Typography variant="small" tone="muted" className="p-3">
                    {loading
                      ? 'Loading candidates…'
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
          </>
        )}
      </div>
    </DetailDrawer>
  )
}
