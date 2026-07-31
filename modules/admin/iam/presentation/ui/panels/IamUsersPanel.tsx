'use client'

import { Ban, Check, Search } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Stack, Skeleton, Typography, DataTable } from '@/shared/ui'
import { IamStatusBadge } from '../IamStatusBadge'
import { IamSearchField } from '../IamSearchField'
import { iamUsersApi } from '@/modules/auth/iam'
import type { IamUser } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function IamUsersPanel() {
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<IamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await iamUsersApi.searchUsers({
        keyword: keyword.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = async (userId: string, action: 'activate' | 'deactivate' | 'suspend') => {
    setActingId(userId)
    try {
      if (action === 'activate') await iamUsersApi.activateUser(userId)
      if (action === 'deactivate') await iamUsersApi.deactivateUser(userId)
      if (action === 'suspend') await iamUsersApi.suspendUser(userId)
      toast.success('User updated')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingId(null)
    }
  }

  return (
    <Stack direction="vertical" spacing="md">
      <Stack direction="horizontal" spacing="sm" className="flex-wrap items-center">
        <IamSearchField
          placeholder="Search users…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
          Search
        </Button>
      </Stack>
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={80} />
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <DataTable
            ariaLabel="Iam Users Panel"
            rows={items}
            rowKey={(user) => String(user.id)}
            emptyMessage="No items."
            columns={[
              { id: 'username', header: 'Username', accessor: 'username' },
              { id: 'email', header: 'Email', accessor: 'email' },
              { id: 'full-name', header: 'Full name', accessor: 'fullName' },
              {
                id: 'status',
                header: 'Status',
                cell: (user) => (
                  <>
                    <IamStatusBadge status={user.status} />
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (user) => (
                  <>
                    <Stack direction="horizontal" spacing="xs" className="flex-wrap">
                      <Button
                        variant="ghost"
                        disabled={actingId === user.id}
                        onClick={() => void runAction(user.id, 'activate')}
                        icon={<Check size={16} />}
                      >
                        Activate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === user.id}
                        onClick={() => void runAction(user.id, 'deactivate')}
                        icon={<Ban size={16} />}
                      >
                        Deactivate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === user.id}
                        onClick={() => void runAction(user.id, 'suspend')}
                        icon={<Ban size={16} />}
                      >
                        Suspend
                      </Button>
                    </Stack>
                  </>
                ),
              },
            ]}
          />
        </div>
      )}
    </Stack>
  )
}
