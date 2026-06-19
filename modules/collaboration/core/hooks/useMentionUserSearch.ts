'use client'

import { useCallback, useEffect, useState } from 'react'
import * as collaborationApi from '../api/collaboration.api'
import type { MentionableUser } from '../model/collaboration'

export function useMentionUserSearch(orgId: string, projectId?: string, enabled = true) {
  const [users, setUsers] = useState<MentionableUser[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const res = await collaborationApi.listMentionableUsers(orgId, { project_id: projectId })
      setUsers(res.items)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { users, loading }
}
