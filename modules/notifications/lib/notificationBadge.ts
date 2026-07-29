type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export function getTypeBadge(title: string): { label: string; tone: BadgeTone } | null {
  const t = title.toLowerCase()
  if (t.startsWith('task assigned') || t.startsWith('assigned:')) return { label: 'Assigned', tone: 'success' }
  if (t.startsWith('task unassigned') || t.startsWith('unassigned')) return { label: 'Unassigned', tone: 'warning' }
  if (t.startsWith('task overdue') || t.startsWith('overdue:')) return { label: 'Overdue', tone: 'error' }
  if (t.startsWith('task due soon') || t.startsWith('due soon:')) return { label: 'Due Soon', tone: 'warning' }
  if (t.startsWith('task at risk') || t.startsWith('at risk:')) return { label: 'At Risk', tone: 'warning' }
  if (t.startsWith('change request')) return { label: 'CR', tone: 'info' }
  if (t.startsWith('baseline')) return { label: 'Baseline', tone: 'success' }
  if (t.startsWith('workspace invitation') || t.startsWith('invitation')) return { label: 'Invite', tone: 'info' }
  if (t.startsWith('quote')) return { label: 'Quote', tone: 'info' }
  if (t.startsWith('schedule run failed') || t.startsWith('finance warning') || t.startsWith('margin warning')) return { label: 'Alert', tone: 'error' }
  return null
}
