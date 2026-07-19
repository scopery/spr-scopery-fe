'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as joinRequestsApi from '../api/join-requests.api'
import {
  listMyJoinRequestRecords,
  removeMyJoinRequestRecord,
  updateMyJoinRequestStatus,
  upsertMyJoinRequestRecord,
} from '../lib/my-join-requests-storage'
import { JoinRequestStatus } from '../model'
import type { MyJoinRequestRecord, SubmitJoinRequestByCodePayload } from '../model'

export function useMyJoinRequests() {
  const [items, setItems] = useState<MyJoinRequestRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setItems(listMyJoinRequestRecords())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const submit = useCallback(
    async (body: SubmitJoinRequestByCodePayload) => {
      const created = await joinRequestsApi.submitJoinRequestByCode(body)
      upsertMyJoinRequestRecord(created, body.workspaceCode ?? null)
      refresh()
      return created
    },
    [refresh]
  )

  const cancel = useCallback(
    async (workspaceId: string, requestId: string) => {
      try {
        const updated = await joinRequestsApi.cancelJoinRequest(workspaceId, requestId)
        updateMyJoinRequestStatus(requestId, updated.status)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          removeMyJoinRequestRecord(requestId)
        } else {
          throw err
        }
      }
      refresh()
    },
    [refresh]
  )

  const markCancelledLocally = useCallback(
    (requestId: string) => {
      updateMyJoinRequestStatus(requestId, JoinRequestStatus.Cancelled)
      refresh()
    },
    [refresh]
  )

  return { items, loading, refresh, submit, cancel, markCancelledLocally }
}
