export interface AlertEvent {
  id: string
  workspaceId: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
  title: string
  body: string | null
  acknowledged: boolean
  dismissed: boolean
  occurredAt: string
}
