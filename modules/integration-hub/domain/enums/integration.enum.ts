export const IntegrationConnectionStatus = {
  Healthy: 'HEALTHY',
  Degraded: 'DEGRADED',
  Down: 'DOWN',
} as const
export type IntegrationConnectionStatus =
  (typeof IntegrationConnectionStatus)[keyof typeof IntegrationConnectionStatus]

export const ImportJobStatus = {
  Draft: 'DRAFT',
  Validated: 'VALIDATED',
  DryRun: 'DRY_RUN',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
} as const
export type ImportJobStatus = (typeof ImportJobStatus)[keyof typeof ImportJobStatus]
