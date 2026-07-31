'use client'

import { useState } from 'react'
import { Badge, Button, DataTable, Input, Select, Typography } from '@/shared/ui'
import type { CaseRow } from '../../../domain/model/quality'

const STATUS_INLINE = ['DRAFT', 'READY', 'DEPRECATED', 'ARCHIVED'].map((value) => ({
  value,
  label: value,
}))
const PRIORITY_INLINE = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => ({
  value,
  label: value,
}))

function resultTone(result?: string | null): 'neutral' | 'success' | 'warning' | 'error' {
  if (result === 'PASSED') return 'success'
  if (result === 'FAILED') return 'error'
  if (result === 'BLOCKED') return 'warning'
  return 'neutral'
}

export function CasesGrid({
  tab,
  rows,
  selectedId,
  selectedIds,
  savingIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenRow,
  onInlineUpdate,
  onQuickDraft,
}: {
  tab: 'functional' | 'nfr'
  rows: CaseRow[]
  selectedId: string | null
  selectedIds: Set<string>
  savingIds?: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onOpenRow: (row: CaseRow) => void
  onInlineUpdate?: (
    id: string,
    changes: { status?: string; priority?: string; title?: string }
  ) => Promise<void>
  onQuickDraft?: (title: string) => Promise<void>
}) {
  const [draftTitle, setDraftTitle] = useState('')
  const [draftSaving, setDraftSaving] = useState(false)

  const submitDraft = async () => {
    if (!onQuickDraft || !draftTitle.trim()) return
    setDraftSaving(true)
    try {
      await onQuickDraft(draftTitle.trim())
      setDraftTitle('')
    } finally {
      setDraftSaving(false)
    }
  }

  return (
    <DataTable
      className="mt-3 min-h-0 flex-1 border border-neutral-200"
      tableClassName="min-w-max"
      ariaLabel="Cases grid"
      rows={rows}
      rowKey={(row) => row.id}
      selectedRowKey={selectedId}
      selectedKeys={selectedIds}
      onSelectedKeysChange={(next) => {
        const changed = rows.filter((row) => next.has(row.id) !== selectedIds.has(row.id))
        if (changed.length === rows.length) {
          onToggleSelectAll()
          return
        }
        changed.forEach((row) => onToggleSelect(row.id))
      }}
      onRowClick={onOpenRow}
      emptyMessage="No cases yet. Add a draft or import from spreadsheet."
      beforeRows={
        onQuickDraft ? (
          <tr className="bg-neutral-50/60 border-b border-dashed border-neutral-200">
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-xs text-neutral-400">DRAFT</td>
            <td className="px-3 py-2" colSpan={tab === 'functional' ? 5 : 7}>
              <div className="flex gap-2">
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Quick draft title — Enter to create"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitDraft()
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!draftTitle.trim() || draftSaving}
                  onClick={() => void submitDraft()}
                >
                  Add draft
                </Button>
              </div>
            </td>
          </tr>
        ) : undefined
      }
      columns={[
        {
          id: 'code',
          header: 'Code',
          accessor: (row) => row.code || '—',
          kind: 'code',
          sticky: true,
          width: '120px',
        },
        {
          id: 'title',
          header: 'Title',
          sticky: true,
          width: '360px',
          interactive: Boolean(tab === 'functional' && onInlineUpdate),
          cell: (row) =>
            tab === 'functional' && onInlineUpdate ? (
              <Input
                defaultValue={row.title}
                key={`${row.id}:${row.title}`}
                disabled={savingIds?.has(row.id)}
                fullWidth
                className="h-8"
                onClick={(event) => event.stopPropagation()}
                onBlur={(e) => {
                  const next = e.target.value.trim()
                  if (next && next !== row.title) void onInlineUpdate(row.id, { title: next })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
              />
            ) : (
              row.title
            ),
        },
        {
          id: 'status',
          header: 'Status',
          interactive: Boolean(tab === 'functional' && onInlineUpdate),
          cell: (row) =>
            tab === 'functional' && onInlineUpdate ? (
              <Select
                size="sm"
                value={row.status}
                options={STATUS_INLINE}
                disabled={savingIds?.has(row.id)}
                onValueChange={(status: string) => void onInlineUpdate(row.id, { status })}
              />
            ) : (
              <Badge size="sm" tone="neutral">
                {row.status}
              </Badge>
            ),
        },
        {
          id: 'priority',
          header: 'Priority',
          interactive: Boolean(tab === 'functional' && onInlineUpdate),
          cell: (row) =>
            tab === 'functional' && onInlineUpdate ? (
              <Select
                size="sm"
                value={row.priority}
                options={PRIORITY_INLINE}
                disabled={savingIds?.has(row.id)}
                onValueChange={(priority: string) => void onInlineUpdate(row.id, { priority })}
              />
            ) : (
              row.priority
            ),
        },
        ...(tab === 'functional'
          ? [
              {
                id: 'useCase',
                header: 'Use Case',
                kind: 'reference' as const,
                accessor: (row: CaseRow) => row.useCaseCode || row.useCaseTitle || '—',
              },
            ]
          : [
              {
                id: 'attribute',
                header: 'Attribute',
                accessor: (row: CaseRow) => row.qualityAttribute || '—',
              },
              {
                id: 'method',
                header: 'Method',
                accessor: (row: CaseRow) => row.verificationMethod || '—',
              },
              {
                id: 'environment',
                header: 'Environment',
                accessor: (row: CaseRow) => row.environment || '—',
              },
            ]),
        {
          id: 'latest',
          header: 'Latest',
          cell: (row) =>
            row.latestResult ? (
              <Badge size="sm" tone={resultTone(row.latestResult.result)}>
                {row.latestResult.result}
              </Badge>
            ) : (
              <Typography variant="caption" tone="muted">
                —
              </Typography>
            ),
        },
      ]}
    />
  )
}
