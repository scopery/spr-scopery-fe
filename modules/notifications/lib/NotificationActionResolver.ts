/**
 * Maps BE actionUrl to in-app workspace routes. Never navigate to raw BE paths.
 */
export function resolveNotificationAction(
  workspaceId: string,
  actionUrl: string | null | undefined
): string | null {
  if (!actionUrl) return null
  const trimmed = actionUrl.trim()
  if (!trimmed) return null

  // Absolute frontend URLs — keep path only
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const u = new URL(trimmed)
      return resolveNotificationAction(workspaceId, u.pathname + u.search)
    }
  } catch {
    /* fall through */
  }

  // Org / workspace invitation accept (raw token/code)
  if (trimmed.startsWith('/org-invites/')) return trimmed
  if (trimmed.startsWith('/invites/')) return trimmed
  if (trimmed.startsWith('/workspace-invites/')) return trimmed

  // Already an app route
  if (trimmed.startsWith('/workspace/')) return trimmed
  if (trimmed.startsWith('/admin/')) return trimmed

  // /projects/{projectId}/tasks/{taskId}
  const taskMatch = trimmed.match(/\/projects\/([^/]+)\/tasks\/([^/?#]+)/)
  if (taskMatch) {
    return `/workspace/${workspaceId}/projects/${taskMatch[1]}/work/${taskMatch[2]}`
  }

  // /projects/{projectId}/meetings/{meetingId}
  const meetingMatch = trimmed.match(/\/projects\/([^/]+)\/meetings\/([^/?#]+)/)
  if (meetingMatch) {
    return `/workspace/${workspaceId}/projects/${meetingMatch[1]}/meetings/${meetingMatch[2]}`
  }

  // /projects/{projectId}/...
  const projectMatch = trimmed.match(/\/projects\/([^/?#]+)/)
  if (projectMatch) {
    return `/workspace/${workspaceId}/projects/${projectMatch[1]}/overview`
  }

  // Fall back to notifications home — never open opaque external/BE URLs
  return `/workspace/${workspaceId}/notifications`
}

export function isOrgInviteNotification(n: {
  actionType?: string | null
  actionUrl?: string | null
}): boolean {
  if (n.actionType === 'ACCEPT_ORG_INVITATION') return true
  if (n.actionType === 'ACCEPT_WORKSPACE_INVITATION') return true
  const url = n.actionUrl ?? ''
  return (
    url.includes('/org-invites/') ||
    url.includes('/invites/') ||
    url.includes('/workspace-invites/')
  )
}
