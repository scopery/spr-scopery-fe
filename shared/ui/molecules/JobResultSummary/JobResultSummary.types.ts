export interface JobResultSummaryProps {
  total: number
  success: number
  warning?: number
  failed: number
  skipped?: number
  onRetryFailed?: () => void
  onDownloadErrors?: () => void
  className?: string
}
