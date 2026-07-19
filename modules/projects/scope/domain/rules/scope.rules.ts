import { ScopeItemPriority } from '../enums/scope.enum'

export function scopePackageStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft'
    case 'APPROVED':
      return 'Approved'
    case 'ARCHIVED':
      return 'Archived'
    default:
      return status
  }
}

export function scopeItemPriorityLabel(priority: string): string {
  switch (priority) {
    case ScopeItemPriority.Low:
      return 'Low'
    case ScopeItemPriority.Medium:
      return 'Medium'
    case ScopeItemPriority.High:
      return 'High'
    case ScopeItemPriority.Critical:
      return 'Critical'
    default:
      return priority
  }
}

export function scopeItemClassificationLabel(item: { inScope: boolean; outOfScope: boolean }): string {
  if (item.outOfScope) return 'Out of scope'
  if (item.inScope) return 'In scope'
  return 'Unclassified'
}

export function canArchiveScopePackage(pkg: { status: string }): boolean {
  return pkg.status !== 'ARCHIVED'
}
