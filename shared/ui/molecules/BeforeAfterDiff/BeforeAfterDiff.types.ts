export interface BeforeAfterDiffField {
  path: string
  label: string
  before: string | null
  after: string | null
}

export interface BeforeAfterDiffProps {
  fields: BeforeAfterDiffField[]
  /** Raw JSON fallback for advanced tab. */
  rawBefore?: unknown
  rawAfter?: unknown
  showRawTab?: boolean
  className?: string
}
