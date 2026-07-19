import { Badge } from '@/shared/ui'

type Tone = 'success' | 'warning' | 'neutral' | 'error'

function statusTone(status: string): Tone {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success'
    case 'ARCHIVED':
    case 'INACTIVE':
      return 'neutral'
    default:
      return 'warning'
  }
}

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export function AdminWorkspaceStatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <Badge variant="solid" tone={statusTone(status)} size={size}>
      {formatStatusLabel(status)}
    </Badge>
  )
}
