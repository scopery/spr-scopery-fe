'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Button,
  Checkbox,
  DetailDrawer,
  Input,
  Typography,
} from '@/shared/ui'
import type { TestCase } from '@/modules/quality/domain/model/quality'
import type { LinkableTestCase } from '../api/traceability.api'

interface LinkTestCaseDrawerProps {
  open: boolean
  onClose: () => void
  requirementLabel: string
  requirementId: string | null
  testCases: TestCase[]
  alreadyLinkedIds: string[]
  loadLinkableTestCases?: (
    requirementId: string,
    q?: string
  ) => Promise<LinkableTestCase[] | TestCase[]>
  onLink: (testCaseIds: string[]) => Promise<void>
}

export function LinkTestCaseDrawer({
  open,
  onClose,
  requirementLabel,
  requirementId,
  testCases,
  alreadyLinkedIds,
  loadLinkableTestCases,
  onLink,
}: LinkTestCaseDrawerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [options, setOptions] = useState<Array<{ id: string; code?: string | null; title: string }>>(
    []
  )
  const [loadingOptions, setLoadingOptions] = useState(false)

  const linked = useMemo(() => new Set(alreadyLinkedIds), [alreadyLinkedIds])

  useEffect(() => {
    if (!open || !requirementId) return
    let cancelled = false
    const run = async () => {
      setLoadingOptions(true)
      try {
        if (loadLinkableTestCases) {
          const items = await loadLinkableTestCases(requirementId, query.trim() || undefined)
          if (!cancelled) setOptions(items)
        } else {
          const q = query.trim().toLowerCase()
          const items = testCases.filter((tc) => {
            if (linked.has(tc.id)) return false
            if (!q) return true
            return `${tc.code ?? ''} ${tc.title}`.toLowerCase().includes(q)
          })
          if (!cancelled) setOptions(items)
        }
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }
    const t = window.setTimeout(() => void run(), 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [open, requirementId, query, loadLinkableTestCases, testCases, linked])

  const reset = () => {
    setQuery('')
    setSelected(new Set())
    setSaving(false)
    setOptions([])
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!requirementId || selected.size === 0) return
    setSaving(true)
    try {
      await onLink([...selected])
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailDrawer
      open={open}
      onClose={handleClose}
      title="Link test case"
      subtitle="This requirement is tested by the selected test cases."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!requirementId || selected.size === 0}
            onClick={() => void handleSubmit()}
          >
            {selected.size > 0
              ? `Link ${selected.size} test case${selected.size === 1 ? '' : 's'}`
              : 'Link test cases'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Requirement
          </Typography>
          <Typography weight="medium">{requirementLabel}</Typography>
        </div>

        <Input
          label="Test cases"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or title…"
          prefix={<Search size={14} />}
        />

        {loadingOptions ? (
          <Typography variant="small" tone="muted">
            Loading test cases…
          </Typography>
        ) : options.length === 0 ? (
          <Typography variant="small" tone="muted">
            {testCases.length === 0
              ? 'No test cases in this project yet.'
              : 'No matching linkable test cases.'}
          </Typography>
        ) : (
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto border border-neutral-200">
            {options.map((tc) => {
              const checked = selected.has(tc.id)
              const label = [tc.code, tc.title].filter(Boolean).join(' · ')
              return (
                <li key={tc.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-neutral-50">
                    <Checkbox
                      checked={checked}
                      onChange={() => toggle(tc.id)}
                      className="mt-0.5"
                    />
                    <Typography variant="small">{label}</Typography>
                  </label>
                </li>
              )
            })}
          </ul>
        )}

        {selected.size > 0 ? (
          <Typography variant="caption" tone="muted">
            Selected {selected.size}
          </Typography>
        ) : null}
      </div>
    </DetailDrawer>
  )
}
