'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Checkbox, Input, Typography } from '@/shared/ui'
import { useUseCaseCatalog, type UseCase } from '@/modules/projects/traceability'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { TestCase } from '../../domain/model/quality'

interface UseCaseTestCaseLinkPanelProps {
  projectId: string
  initialUseCaseId?: string | null
}

export function UseCaseTestCaseLinkPanel({
  projectId,
  initialUseCaseId,
}: UseCaseTestCaseLinkPanelProps) {
  const { useCases } = useUseCaseCatalog(projectId)
  const [useCaseId, setUseCaseId] = useState(initialUseCaseId ?? '')
  const [useCaseQuery, setUseCaseQuery] = useState('')
  const [testCaseQuery, setTestCaseQuery] = useState('')
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([])
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (useCaseId || useCases.length === 0) return
    setUseCaseId(initialUseCaseId ?? useCases[0]?.id ?? '')
  }, [initialUseCaseId, useCaseId, useCases])

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [all, linked] = await Promise.all([
        qualityApi.listTestCases(projectId, { page: 0, size: 500, sort: 'updatedAt,desc' }),
        useCaseId
          ? qualityApi.listTestCases(projectId, {
              useCaseId,
              page: 0,
              size: 500,
              sort: 'updatedAt,desc',
            })
          : Promise.resolve({ items: [] }),
      ])
      setAllTestCases(all.items)
      setLinkedIds(new Set(linked.items.map((item) => item.id)))
    } finally {
      setLoading(false)
    }
  }, [projectId, useCaseId])

  useEffect(() => {
    setSelectedIds(new Set())
    void load()
  }, [load])

  const filteredUseCases = useMemo(() => {
    const query = useCaseQuery.trim().toLowerCase()
    if (!query) return useCases
    return useCases.filter((item) =>
      `${item.key} ${item.name} ${item.primaryFunctionName}`.toLowerCase().includes(query)
    )
  }, [useCaseQuery, useCases])

  const candidates = useMemo(() => {
    const query = testCaseQuery.trim().toLowerCase()
    return allTestCases.filter(
      (item) =>
        !linkedIds.has(item.id) &&
        (!query || `${item.code ?? ''} ${item.title}`.toLowerCase().includes(query))
    )
  }, [allTestCases, linkedIds, testCaseQuery])

  const linked = useMemo(
    () => allTestCases.filter((item) => linkedIds.has(item.id)),
    [allTestCases, linkedIds]
  )

  const existingUseCaseIds = async (testCaseId: string): Promise<string[]> => {
    const traceability = await qualityApi.getTestCaseTraceability(projectId, testCaseId)
    return traceability.useCases.map((item) => item.id)
  }

  const linkSelected = async () => {
    if (!useCaseId || selectedIds.size === 0) return
    setSaving(true)
    try {
      await Promise.all(
        [...selectedIds].map(async (testCaseId) => {
          const currentIds = await existingUseCaseIds(testCaseId)
          const nextIds = [...new Set([...currentIds, useCaseId])]
          await qualityApi.replaceTestCaseUseCaseLinks(projectId, testCaseId, nextIds)
        })
      )
      toast.success(`${selectedIds.size} Test Case${selectedIds.size === 1 ? '' : 's'} linked`)
      setSelectedIds(new Set())
      await load()
    } finally {
      setSaving(false)
    }
  }

  const unlink = async (testCaseId: string) => {
    setSaving(true)
    try {
      const currentIds = await existingUseCaseIds(testCaseId)
      await qualityApi.replaceTestCaseUseCaseLinks(
        projectId,
        testCaseId,
        currentIds.filter((id) => id !== useCaseId)
      )
      toast.success('Use Case link removed')
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden border border-neutral-200 bg-white">
      <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
        <Typography weight="medium" size="sm">
          Use Case to Test Case
        </Typography>
        <Typography variant="small" tone="muted">
          Select a Use Case, then assign existing Test Cases. Requirement and Function coverage is
          derived.
        </Typography>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-neutral-200 lg:border-b-0 lg:border-r">
          <div className="shrink-0 space-y-2 border-b border-neutral-100 px-3 py-2">
            <Typography
              variant="caption"
              tone="muted"
              className="block text-[10px] uppercase tracking-wide"
            >
              Use Cases
            </Typography>
            <Input
              fullWidth
              placeholder="Search Use Cases…"
              value={useCaseQuery}
              onChange={(event) => setUseCaseQuery(event.target.value)}
              prefix={<Search size={14} />}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredUseCases.map((item: UseCase) => (
              <button
                key={item.id}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm ${
                  useCaseId === item.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-900 hover:bg-neutral-100'
                }`}
                onClick={() => setUseCaseId(item.id)}
              >
                <div className="truncate font-medium">{item.key}</div>
                <div
                  className={`truncate text-xs ${
                    useCaseId === item.id ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {item.name}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[minmax(280px,1.15fr)_minmax(0,0.85fr)]">
          <section className="flex min-h-0 flex-col overflow-hidden border-r border-neutral-200">
            <div className="shrink-0 space-y-2 border-b border-neutral-100 p-3">
              <Typography weight="medium" size="sm">
                Available to assign
              </Typography>
              <Typography variant="small" tone="muted">
                Select multiple Test Cases, then assign them together.
              </Typography>
              <Input
                fullWidth
                placeholder="Search available Test Cases…"
                value={testCaseQuery}
                onChange={(event) => setTestCaseQuery(event.target.value)}
                prefix={<Search size={14} />}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={saving || selectedIds.size === 0}
                onClick={() => void linkSelected()}
              >
                Link selected ({selectedIds.size})
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {candidates.map((item) => (
                <label
                  key={item.id}
                  className="hover:bg-secondary/5 flex cursor-pointer items-start gap-2 border border-transparent px-2.5 py-2"
                >
                  <Checkbox
                    size="sm"
                    checked={selectedIds.has(item.id)}
                    onChange={() =>
                      setSelectedIds((current) => {
                        const next = new Set(current)
                        if (next.has(item.id)) next.delete(item.id)
                        else next.add(item.id)
                        return next
                      })
                    }
                  />
                  <span>
                    <Typography variant="small" weight="medium">
                      {item.code ?? 'Draft'} · {item.title}
                    </Typography>
                    <Typography variant="caption" tone="muted">
                      {item.status}
                    </Typography>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden bg-white">
            <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
              <Typography weight="medium" size="sm">
                Linked Test Cases
              </Typography>
              <Typography variant="small" tone="muted">
                {loading ? 'Loading…' : `${linked.length} linked`}
              </Typography>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {linked.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 border-b border-neutral-100 py-2"
                >
                  <div>
                    <Typography variant="small" weight="medium">
                      {item.code ?? 'Draft'} · {item.title}
                    </Typography>
                    <Typography variant="caption" tone="muted">
                      {item.status}
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="error"
                    disabled={saving}
                    onClick={() => void unlink(item.id)}
                  >
                    Unlink
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
