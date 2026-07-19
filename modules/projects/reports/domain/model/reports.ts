export type ProjectReportKey =
  | 'scope-coverage'
  | 'deliverable-status'
  | 'acceptance-criteria'
  | 'acceptance-evidence'
  | 'raid-summary'
  | 'risk-register'
  | 'issue-log'
  | 'assumption-log'
  | 'dependency-log'
  | 'raid-actions'
  | 'decision-log'

export interface ProjectReportOption {
  key: ProjectReportKey
  label: string
  group: 'Scope' | 'RAID'
}

/** Report responses are heterogeneous per BE (array or map) — kept as raw JSON for display. */
export type ProjectReportResult = unknown
