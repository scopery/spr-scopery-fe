'use client'

import { Typography } from '@/shared/ui'
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

  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-neutral-100">
              {columns.map((col) => (
                <td key={col} className="px-4 py-3">
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
