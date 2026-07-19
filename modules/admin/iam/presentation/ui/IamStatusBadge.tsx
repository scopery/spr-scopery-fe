import { Badge } from '@/shared/ui'
import { iamStatusTone } from '../lib/iam-status-tone'

interface IamStatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function IamStatusBadge({ status, size = 'sm' }: IamStatusBadgeProps) {
  return (
    <Badge variant="solid" tone={iamStatusTone(status)} size={size}>
      {formatStatusLabel(status)}
    </Badge>
  )
}
