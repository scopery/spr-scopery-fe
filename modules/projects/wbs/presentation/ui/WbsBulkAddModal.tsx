'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  BulkJobProgressPanel,
  Button,
  DataTable,
  Input,
  Modal,
  Select,
  Stack,
  Typography,
  type DataTableColumn,
} from '@/shared/ui'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import {
  BULK_MAX_ITEMS,
  BulkJobStatus,
  type BulkJobResponse,
} from '@/shared/lib/bulkJobs'
import { useBulkJobPoller } from '@/shared/lib/useBulkJobPoller'
import { cn } from '@/utils/cn'
import { WBS_NODE_TYPE_OPTIONS, WbsNodeType } from '../../domain/enums/wbs.enum'
import type { CreateWbsNodePayload } from '../../domain/model/wbs'
import { WbsPhaseIdReference } from './WbsPhaseIdReference'

interface PhaseOption {
  value: string
  label: string
}

interface DraftRow {
  id: string
  code: string
  title: string
  description: string
  phaseId: string
  parentId: string
  nodeType: string
  sortOrder: string
  error?: string | null
}

interface Props {
  open: boolean
  phaseOptions: PhaseOption[]
  defaultPhaseId?: string | null
  onClose: () => void
  onSubmitBulk: (items: CreateWbsNodePayload[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

function newRow(phaseId: string): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: '',
    title: '',
    description: '',
    phaseId,
    parentId: '',
    nodeType: WbsNodeType.WorkPackage,
    sortOrder: '',
    error: null,
  }
}

function isBlank(row: DraftRow, defaultPhaseId: string) {
  return (
    !row.code.trim() &&
    !row.title.trim() &&
    !row.description.trim() &&
    !row.parentId.trim() &&
    !row.sortOrder.trim() &&
    (!row.phaseId || row.phaseId === defaultPhaseId) &&
    row.nodeType === WbsNodeType.WorkPackage
  )
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map((c) => c.trim().toLowerCase()).join('|')
  return ['code', 'title', 'phase', 'phaseid', 'nodetype', 'type'].some((k) =>
    joined.includes(k)
  )
}

function parseClipboardToRows(text: string, defaultPhaseId: string): DraftRow[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []

  const delim = lines[0]!.includes('\t') ? '\t' : ','
  const rows: DraftRow[] = []
  lines.forEach((line, index) => {
    const cells = line.split(delim).map((c) => c.trim())
    if (index === 0 && looksLikeHeader(cells)) return
    const [code = '', title = '', description = '', phaseId = '', parentId = '', nodeType = '', sortOrder = ''] =
      cells
    rows.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
      code: code.toUpperCase(),
      title,
      description,
      phaseId: phaseId || defaultPhaseId,
      parentId,
      nodeType: (nodeType || WbsNodeType.WorkPackage).toUpperCase().replace(/\s+/g, '_'),
      sortOrder,
      error: null,
    })
  })
  return rows
}

export function WbsBulkAddModal({
  open,
  phaseOptions,
  defaultPhaseId,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
  const defaultPhase = defaultPhaseId ?? phaseOptions[0]?.value ?? ''
  const [rows, setRows] = useState<DraftRow[]>(() => [newRow(defaultPhase)])
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)
  const submittingRef = useRef(false)
  const poller = useBulkJobPoller()

  useEffect(() => {
    if (!open) return
    setRows([newRow(defaultPhaseId ?? phaseOptions[0]?.value ?? '')])
    setFormError(null)
    setJobId(null)
    setPasteHint(false)
    setSubmitting(false)
    submittingRef.current = false
    poller.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening
  }, [open, defaultPhaseId, phaseOptions])

  useEffect(() => {
    if (!open) return
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'TEXTAREA' || target.isContentEditable) return
      }
      const text = e.clipboardData?.getData('text') ?? ''
      if (!text.includes('\t') && !text.includes('\n')) return
      const pasted = parseClipboardToRows(text, defaultPhase)
      if (pasted.length === 0) return
      e.preventDefault()
      setPasteHint(true)
      setRows((prev) => {
        const onlyBlank = prev.length === 1 && isBlank(prev[0]!, defaultPhase)
        return onlyBlank ? pasted : [...prev, ...pasted]
      })
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [open, defaultPhase])

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: null } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, newRow(defaultPhase)])
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length <= 1 ? [newRow(defaultPhase)] : prev.filter((r) => r.id !== id)))

  const validRows = useMemo(
    () => rows.filter((r) => r.code.trim() && r.title.trim() && r.phaseId.trim()),
    [rows]
  )

  const buildItems = useCallback((): CreateWbsNodePayload[] | null => {
    const items: CreateWbsNodePayload[] = []
    const nextRows = rows.map((row) => {
      if (isBlank(row, defaultPhase)) return { ...row, error: null }
      if (!row.code.trim() || !row.title.trim()) {
        return { ...row, error: 'Code and title are required' }
      }
      if (!row.phaseId.trim()) {
        return { ...row, error: 'Phase is required' }
      }
      const sortRaw = row.sortOrder.trim()
      let sortOrder = 1
      if (sortRaw) {
        const n = Number.parseInt(sortRaw, 10)
        if (!Number.isFinite(n) || n < 0) {
          return { ...row, error: 'Sort order must be a non-negative integer' }
        }
        sortOrder = n
      }
      items.push({
        code: row.code.trim().toUpperCase(),
        title: row.title.trim(),
        description: row.description.trim() || null,
        phaseId: row.phaseId.trim(),
        parentId: row.parentId.trim() || null,
        nodeType: row.nodeType || WbsNodeType.WorkPackage,
        sortOrder,
      })
      return { ...row, error: null }
    })
    if (nextRows.some((r) => r.error)) {
      setRows(nextRows)
      return null
    }
    return items
  }, [rows, defaultPhase])

  const runBulk = useCallback(async () => {
    if (submittingRef.current) return
    if (validRows.length === 0) {
      setFormError('Add at least one row with code, title, and phase.')
      return
    }
    const items = buildItems()
    if (!items || items.length === 0) {
      setFormError('Fix validation errors before submitting.')
      return
    }
    if (items.length > BULK_MAX_ITEMS) {
      setFormError(`Maximum ${BULK_MAX_ITEMS} items per bulk request.`)
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)
    poller.reset()

    try {
      const job = await onSubmitBulk(items)
      setJobId(job.id)
      setSubmitting(false)
      submittingRef.current = false
      toast.message('Job accepted', { description: 'Processing in the background…' })
      onClose()
      const done = await poller.start(job.id, job)
      if (done.succeededItems > 0) await onBatchComplete?.()

      if (done.status === BulkJobStatus.Succeeded) {
        toast.success(done.resultSummary ?? `Created ${done.succeededItems} planning elements`)
      } else if (done.status === BulkJobStatus.Partial) {
        toast.warning(
          done.resultSummary ??
            `${done.succeededItems} created, ${done.failedItems} failed. Successful items are already saved.`
        )
      } else {
        toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk create failed')
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to submit bulk create'
      setFormError(message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [validRows.length, buildItems, onSubmitBulk, onBatchComplete, onClose, poller])

  const busy = submitting || poller.isPolling

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add planning elements"
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting
            ? 'Submitting…'
            : poller.isPolling
              ? 'Running…'
              : `Create ${validRows.length}`,
          onClick: () => void runBulk(),
          variant: 'primary',
          disabled: busy || validRows.length === 0 || phaseOptions.length === 0,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Add one or more planning elements. Paste Excel/TSV (Ctrl/Cmd+V): Code · Title · Description ·
          PhaseId · ParentId · NodeType · SortOrder. Use JSON Import for full guide + copy sample.
          Prefer the Phase dropdown per row — or copy a phase id from the list below for paste/JSON.
        </Typography>

        <WbsPhaseIdReference phases={phaseOptions} />

        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review, edit, or remove rows below.
          </Typography>
        ) : null}

        <BulkJobProgressPanel
          job={poller.job}
          percent={poller.percent}
          isPolling={poller.isPolling}
          error={poller.error}
          onRetryFailed={(failedItems) => {
            setJobId(null)
            poller.reset()
            void (async () => {
              try {
                const job = await onSubmitBulk(
                  failedItems as unknown as CreateWbsNodePayload[]
                )
                setJobId(job.id)
                toast.message('Job accepted', { description: 'Processing in the background…' })
                const done = await poller.start(job.id, job)
                if (done.succeededItems > 0) await onBatchComplete?.()
              } catch {
                /* interceptor */
              }
            })()
          }}
          onRetry={() => {
            setJobId(null)
            poller.reset()
            void runBulk()
          }}
        />

        <div className="border border-neutral-200">
          <DataTable
            ariaLabel="Planning elements to create"
            rows={rows}
            rowKey={(row) => row.id}
            tableClassName="min-w-[960px]"
            compact
            rowClassName={(row) => cn(row.error && 'bg-red-50/60')}
            columns={[
              { id: 'index', header: '#', width: '2rem', cell: (_row, index) => index + 1 },
              {
                id: 'code',
                header: 'Code *',
                kind: 'code',
                cell: (row, index) => (
                  <Input
                    size="sm"
                    fullWidth
                    value={row.code}
                    disabled={busy}
                    placeholder="PE-AUTH"
                    aria-label={`Code row ${index + 1}`}
                    onChange={(e) => updateRow(row.id, { code: e.target.value.toUpperCase() })}
                  />
                ),
              },
              {
                id: 'title',
                header: 'Title *',
                cell: (row, index) => (
                  <Input
                    size="sm"
                    fullWidth
                    value={row.title}
                    disabled={busy}
                    placeholder="Authentication"
                    aria-label={`Title row ${index + 1}`}
                    onChange={(e) => updateRow(row.id, { title: e.target.value })}
                  />
                ),
              },
              {
                id: 'phaseId',
                header: 'Phase *',
                cell: (row, index) => (
                  <Select
                    value={row.phaseId}
                    onValueChange={(v: string) => updateRow(row.id, { phaseId: v })}
                    options={phaseOptions}
                    disabled={busy || phaseOptions.length === 0}
                    aria-label={`Phase row ${index + 1}`}
                  />
                ),
              },
              {
                id: 'nodeType',
                header: 'Type *',
                cell: (row, index) => (
                  <Select
                    value={row.nodeType}
                    onValueChange={(v: string) => updateRow(row.id, { nodeType: v })}
                    options={[...WBS_NODE_TYPE_OPTIONS]}
                    disabled={busy}
                    aria-label={`Node type row ${index + 1}`}
                  />
                ),
              },
              {
                id: 'parentId',
                header: 'Parent id',
                cell: (row, index) => (
                  <Input
                    size="sm"
                    fullWidth
                    value={row.parentId}
                    disabled={busy}
                    placeholder="UUID or empty"
                    aria-label={`Parent id row ${index + 1}`}
                    onChange={(e) => updateRow(row.id, { parentId: e.target.value })}
                  />
                ),
              },
              {
                id: 'description',
                header: 'Description',
                cell: (row, index) => (
                  <Input
                    size="sm"
                    fullWidth
                    value={row.description}
                    disabled={busy}
                    placeholder="Optional"
                    aria-label={`Description row ${index + 1}`}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                  />
                ),
              },
              {
                id: 'sortOrder',
                header: 'Order',
                cell: (row, index) => (
                  <Input
                    size="sm"
                    fullWidth
                    type="number"
                    value={row.sortOrder}
                    disabled={busy}
                    placeholder="1"
                    aria-label={`Sort order row ${index + 1}`}
                    onChange={(e) => updateRow(row.id, { sortOrder: e.target.value })}
                  />
                ),
              },
              {
                id: 'remove',
                header: '',
                width: '2.5rem',
                cell: (row, index) => (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-800"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove row ${index + 1}`}
                    disabled={busy}
                  >
                    <Trash2 size={14} />
                  </button>
                ),
              },
            ] satisfies DataTableColumn<DraftRow>[]}
          />
        </div>

        {rows.some((r) => r.error) ? (
          <ul className="space-y-1">
            {rows.map((r, i) =>
              r.error ? (
                <li key={r.id}>
                  <Typography variant="small" tone="error">
                    Row {i + 1}: {r.error}
                  </Typography>
                </li>
              ) : null
            )}
          </ul>
        ) : null}

        {formError ? (
          <Typography tone="error" variant="small">
            {formError}
          </Typography>
        ) : null}

        {jobId ? (
          <Typography variant="caption" tone="muted">
            Job {jobId}
          </Typography>
        ) : null}

        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          <Button size="sm" variant="secondary" onClick={addRow} disabled={busy}>
            <Plus size={14} className="mr-1 inline" />
            Add row
          </Button>
          <Typography variant="caption" tone="muted" className="self-center">
            {validRows.length} ready · max {BULK_MAX_ITEMS}
          </Typography>
        </Stack>
      </div>
    </Modal>
  )
}
