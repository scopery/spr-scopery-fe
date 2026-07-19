import type { ProjectReportOption } from '../model/reports'

/** Report catalog — matches `GET /api/projects/{projectId}/reports/*` in the Wave 2 API contract. */
export const PROJECT_REPORT_OPTIONS: ProjectReportOption[] = [
  { key: 'scope-coverage', label: 'Scope coverage', group: 'Scope' },
  { key: 'deliverable-status', label: 'Deliverable status', group: 'Scope' },
  { key: 'acceptance-criteria', label: 'Acceptance criteria', group: 'Scope' },
  { key: 'acceptance-evidence', label: 'Acceptance evidence', group: 'Scope' },
  { key: 'raid-summary', label: 'RAID summary', group: 'RAID' },
  { key: 'risk-register', label: 'Risk register', group: 'RAID' },
  { key: 'issue-log', label: 'Issue log', group: 'RAID' },
  { key: 'assumption-log', label: 'Assumption log', group: 'RAID' },
  { key: 'dependency-log', label: 'Dependency log', group: 'RAID' },
  { key: 'raid-actions', label: 'RAID actions', group: 'RAID' },
  { key: 'decision-log', label: 'Decision log', group: 'RAID' },
]

/** Normalize a report payload into rows of key/value objects for generic table rendering. */
export function reportResultToRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) {
    return result.map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>) : { value: row }))
  }
  if (result && typeof result === 'object') {
    return Object.entries(result as Record<string, unknown>).map(([key, value]) => ({ key, value }))
  }
  return []
}

export function reportResultColumns(rows: Record<string, unknown>[]): string[] {
  const columns = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) columns.add(key)
  }
  return Array.from(columns)
}
