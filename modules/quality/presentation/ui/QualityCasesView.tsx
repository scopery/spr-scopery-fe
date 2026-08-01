'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ClipboardPaste, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, PageSkeleton, Select, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useTestCaseCatalog } from '../hooks/useTestCaseCatalog'
import { useVerificationCaseCatalog } from '../hooks/useVerificationCaseCatalog'
import { useQualityAssigneePeople } from '../hooks/useQualityAssigneePeople'
import {
  mapTestCaseToCaseRow,
  mapVerificationCaseToCaseRow,
} from '../../infrastructure/mappers/quality-compatibility.mapper'
import type { CaseRow } from '../../domain/model/quality'
import { TestCaseDetailDrawer } from './TestCaseDetailDrawer'
import { VerificationCaseDetailDrawer } from './VerificationCaseDetailDrawer'
import { CaseImportFlow } from './cases/CaseImportFlow'
import { CasesGrid } from './cases/CasesGrid'
import { QualitySingleAddModal } from './QualitySingleAddModal'
import { TestCaseJsonImportModal } from './TestCaseJsonImportModal'

type CaseTab = 'functional' | 'nfr'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...['DRAFT', 'READY', 'DEPRECATED', 'ARCHIVED'].map((value) => ({ value, label: value })),
]

export function QualityCasesView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get('type') === 'nfr' ? 'nfr' : 'functional') as CaseTab
  const selectedId = searchParams.get('selected')

  const functional = useTestCaseCatalog(projectId)
  const nfr = useVerificationCaseCatalog(projectId)
  const { people: assigneePeople } = useQualityAssigneePeople(workspaceId)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importOpen, setImportOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // Hydrate filters from URL once
  useEffect(() => {
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    if (q != null) {
      if (tab === 'functional') functional.setQuery(q)
      else nfr.setQuery(q)
    }
    if (status != null) {
      if (tab === 'functional') functional.setStatus(status)
      else nfr.setStatus(status)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate from URL on mount/tab
  }, [tab])

  const persistFilters = useCallback(
    (next: { type?: CaseTab; q?: string; status?: string; selected?: string | null }) => {
      const params = new URLSearchParams()
      params.set('type', next.type ?? tab)
      const q = next.q ?? (tab === 'functional' ? functional.query : nfr.query)
      const status = next.status ?? (tab === 'functional' ? functional.status : nfr.status)
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      if (next.selected) params.set('selected', next.selected)
      router.replace(
        `${ROUTES.workspace.projectQualityCases(workspaceId, projectId)}?${params.toString()}`
      )
    },
    [functional.query, functional.status, nfr.query, nfr.status, projectId, router, tab, workspaceId]
  )

  const setTab = useCallback(
    (next: CaseTab) => {
      setSelectedIds(new Set())
      persistFilters({ type: next, selected: null, q: '', status: '' })
    },
    [persistFilters]
  )

  const openRow = useCallback(
    (row: CaseRow) => {
      persistFilters({ selected: row.id })
    },
    [persistFilters]
  )

  const closeDrawer = useCallback(() => {
    persistFilters({ selected: null })
  }, [persistFilters])

  const rows: CaseRow[] = useMemo(() => {
    if (tab === 'functional') return functional.items.map(mapTestCaseToCaseRow)
    return nfr.items.map(mapVerificationCaseToCaseRow)
  }, [functional.items, nfr.items, tab])

  const loading = tab === 'functional' ? functional.loading : nfr.loading
  const error = tab === 'functional' ? functional.error : nfr.error
  const query = tab === 'functional' ? functional.query : nfr.query
  const status = tab === 'functional' ? functional.status : nfr.status

  const setQuery = (value: string) => {
    if (tab === 'functional') functional.setQuery(value)
    else nfr.setQuery(value)
    persistFilters({ q: value })
  }

  const setStatus = (value: string) => {
    if (tab === 'functional') functional.setStatus(value)
    else nfr.setStatus(value)
    persistFilters({ status: value })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (rows.length > 0 && rows.every((row) => prev.has(row.id))) return new Set()
      return new Set(rows.map((row) => row.id))
    })
  }

  const bulkReady = async () => {
    if (tab !== 'functional' || selectedIds.size === 0) return
    await functional.batchUpdate([...selectedIds], { status: 'READY' })
    toast.success(`${selectedIds.size} case(s) marked Ready`)
    setSelectedIds(new Set())
  }

  const bulkArchive = async () => {
    if (tab !== 'functional' || selectedIds.size === 0) return
    await functional.batchUpdate([...selectedIds], { status: 'ARCHIVED' })
    toast.success(`${selectedIds.size} case(s) archived`)
    setSelectedIds(new Set())
  }

  if (loading && rows.length === 0) return <PageSkeleton variant="list" className="p-lg" />

  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4 lg:py-3">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Cases
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Functional tests and NFR verifications stay separate backend entities — tabs switch
            catalogs, not merged records.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<ClipboardPaste size={14} />}
            onClick={() => setImportOpen(true)}
          >
            {tab === 'functional' ? 'JSON import' : 'Import'}
          </Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
            Add case
          </Button>
        </div>
      </header>

      <div className="mt-3 flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          className={
            tab === 'functional'
              ? 'border-b-2 border-neutral-900 px-3 py-2 text-sm font-medium'
              : 'px-3 py-2 text-sm text-neutral-500'
          }
          onClick={() => setTab('functional')}
        >
          Functional Tests
        </button>
        <button
          type="button"
          className={
            tab === 'nfr'
              ? 'border-b-2 border-neutral-900 px-3 py-2 text-sm font-medium'
              : 'px-3 py-2 text-sm text-neutral-500'
          }
          onClick={() => setTab('nfr')}
        >
          NFR Verifications
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="w-52 shrink-0">
          <Input
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases…"
            prefix={<Search size={14} />}
          />
        </div>
        <Select
          value={status}
          onValueChange={setStatus}
          options={STATUS_OPTIONS}
          className="w-40"
        />
      </div>

      {selectedIds.size > 0 && tab === 'functional' ? (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
          <Typography variant="small">{selectedIds.size} selected</Typography>
          <Button size="sm" variant="outline" onClick={() => void bulkReady()}>
            Mark Ready
          </Button>
          <Button size="sm" variant="outline" onClick={() => void bulkArchive()}>
            Archive
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      ) : null}

      {error ? (
        <Typography tone="error" className="mt-3">
          {error}
        </Typography>
      ) : null}

      <CasesGrid
        tab={tab}
        rows={rows}
        selectedId={selectedId}
        selectedIds={selectedIds}
        savingIds={tab === 'functional' ? functional.savingIds : undefined}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onOpenRow={openRow}
        onInlineUpdate={
          tab === 'functional'
            ? async (id, changes) => {
                await functional.update(id, changes)
              }
            : undefined
        }
        onQuickDraft={
          tab === 'functional'
            ? async ({ title, code }) => {
                await functional.create({
                  title,
                  code: code || null,
                  type: 'FUNCTIONAL',
                  priority: 'MEDIUM',
                })
                toast.success('Draft case created')
              }
            : undefined
        }
      />

      {tab === 'functional' && selectedId ? (
        <TestCaseDetailDrawer
          projectId={projectId}
          testCaseId={selectedId}
          assigneePeople={assigneePeople}
          onClose={closeDrawer}
          onChanged={() => void functional.refetch()}
        />
      ) : null}
      {tab === 'nfr' && selectedId ? (
        <VerificationCaseDetailDrawer
          projectId={projectId}
          verificationCaseId={selectedId}
          assigneePeople={assigneePeople}
          onClose={closeDrawer}
          onChanged={() => void nfr.refetch()}
        />
      ) : null}

      {tab === 'functional' ? (
        <TestCaseJsonImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onComplete={async () => {
            setImportOpen(false)
            await functional.refetch()
          }}
        />
      ) : (
        <CaseImportFlow
          open={importOpen}
          caseKind="NFR"
          projectId={projectId}
          onClose={() => setImportOpen(false)}
          onComplete={async () => {
            setImportOpen(false)
            await nfr.refetch()
            toast.success('Import completed')
          }}
        />
      )}

      <QualitySingleAddModal
        open={createOpen}
        kind="TEST_CASE"
        onClose={() => setCreateOpen(false)}
        onCreate={async (input) => {
          if (input.kind !== 'TEST_CASE') return
          if (tab === 'functional') {
            await functional.create(input.payload)
            toast.success('Functional case created')
          } else {
            toast.message('Create NFR cases via Import for now')
          }
          setCreateOpen(false)
          await (tab === 'functional' ? functional.refetch() : nfr.refetch())
        }}
      />
    </div>
  )
}
