'use client'

import { DataTable, Typography, type DataTableColumn } from '@/shared/ui'
import { reportResultColumns, reportResultToRows } from '../../domain/rules/reports.rules'

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Renders a report payload as a generic table when tabular, falling back to pretty JSON. */
export function ProjectReportResultTable({ result }: { result: unknown }) {
  if (result === null || result === undefined) {
    return (
      <Typography variant="small" tone="muted">
        No data
      </Typography>
    )
  }

  const rows = reportResultToRows(result)
  if (rows.length === 0) {
    return (
      <pre className="overflow-x-auto border border-neutral-200 bg-neutral-50 p-4 text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
    )
  }

  const columns = reportResultColumns(rows)

  const tableRows = rows.map((values, index) => ({ key: String(index), values }))
  const tableColumns: DataTableColumn<(typeof tableRows)[number]>[] = columns.map((column) => ({
    id: column,
    header: column,
    accessor: (row) => (/(^id$|_id$|Id$)/.test(column) ? '—' : formatCell(row.values[column])),
  }))

  return (
    <div className="border border-neutral-200 bg-white">
      <DataTable
        ariaLabel="Project report results"
        rows={tableRows}
        rowKey={(row) => row.key}
        columns={tableColumns}
      />
    </div>
  )
}
