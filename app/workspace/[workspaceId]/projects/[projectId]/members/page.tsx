'use client'

import { WorkspaceMembersView } from '@/modules/org/workspace'

/**
 * Project directory — members roster (interim: workspace members list).
 * Per-project ACL is Phase C; until then roster is workspace-scoped.
 */
export default function ProjectMembersPage() {
  return <WorkspaceMembersView />
}
