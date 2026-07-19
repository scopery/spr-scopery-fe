'use client'

import { Ban, Check, Search } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Stack, Skeleton, Typography } from '@/shared/ui'
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Username</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Full name</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="min-w-[12rem] whitespace-nowrap px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">{user.username}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">{user.fullName}</td>
                  <td className="px-3 py-2">
                    <IamStatusBadge status={user.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Stack direction="horizontal" spacing="xs" className="flex-wrap">
                      <Button
                        variant="ghost"
                        disabled={actingId === user.id}
                        onClick={() => void runAction(user.id, 'activate')} icon={<Check size={16} />}>
                        Activate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === user.id}
                        onClick={() => void runAction(user.id, 'deactivate')} icon={<Ban size={16} />}>
                        Deactivate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === user.id}
                        onClick={() => void runAction(user.id, 'suspend')} icon={<Ban size={16} />}>
                        Suspend
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center">
                    <Typography variant="small" tone="muted">
                      No users found
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  )
}
