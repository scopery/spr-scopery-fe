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
