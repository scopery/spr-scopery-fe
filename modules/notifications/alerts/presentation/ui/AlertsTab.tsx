'use client'

import { AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useAlertEvents } from '../hooks/useAlertEvents'

function severityTone(severity: string): 'error' | 'warning' | 'neutral' {
  if (severity === 'HIGH' || severity === 'CRITICAL') return 'error'
  if (severity === 'MEDIUM') return 'warning'
  return 'neutral'
}

interface Props {
  workspaceId: string
}

export function AlertsTab({ workspaceId }: Props) {
  const { alerts, loading, acknowledge, dismiss } = useAlertEvents(workspaceId)

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledge(id)
      toast.success('Alert acknowledged')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismiss(id)
      toast.success('Alert dismissed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && alerts.length === 0) {
    return <Typography variant="small" tone="muted">Loading…</Typography>
  }

  if (alerts.length === 0) {
    return <Typography variant="small" tone="muted">No alerts</Typography>
  }

  return (
    <div className="divide-y divide-neutral-100">
      {alerts.map((alert) => (
        <div key={alert.id} className="flex items-start gap-3 py-3">
          <AlertTriangle
            size={16}
            className={`mt-0.5 shrink-0 ${alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`}
          />
          <div className="flex-1">
            <Stack direction="horizontal" spacing="sm" className="items-center">
              <Typography weight="medium">{alert.title}</Typography>
              <Badge tone={severityTone(alert.severity)}>{alert.severity}</Badge>
              {alert.acknowledged && <Badge tone="neutral">Acknowledged</Badge>}
            </Stack>
            {alert.body ? (
              <Typography variant="small" tone="muted">{alert.body}</Typography>
            ) : null}
            <Typography variant="small" tone="muted">
              {new Date(alert.occurredAt).toLocaleString()} · {alert.type}
            </Typography>
          </div>
          <Stack direction="horizontal" spacing="sm">
            {!alert.acknowledged && (
              <Button size="sm" variant="secondary" onClick={() => void handleAcknowledge(alert.id)}>
                Acknowledge
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<X size={14} />}
              onClick={() => void handleDismiss(alert.id)}
            >
              Dismiss
            </Button>
          </Stack>
        </div>
      ))}
    </div>
  )
}
