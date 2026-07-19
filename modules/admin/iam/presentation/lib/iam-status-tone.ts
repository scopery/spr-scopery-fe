export type IamStatusTone = 'success' | 'warning' | 'neutral' | 'error'

export function iamStatusTone(status: string): IamStatusTone {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success'
    case 'SUSPENDED':
    case 'REVOKED':
      return 'error'
    case 'INACTIVE':
    case 'PENDING':
      return 'warning'
    default:
      return 'neutral'
  }
}
