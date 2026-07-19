export interface ErrorFallbackProps {
  title?: string
  message?: string
  /** Shown in dev only when provided */
  detail?: string
  onRetry?: () => void
  retryLabel?: string
  homeHref?: string
  homeLabel?: string
  className?: string
}
